import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, FileText, StickyNote, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFolders } from "@/contexts/FoldersContext";
import type { CalendarNote, Meeting } from "@/types";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface CalendarViewProps {
  notes: CalendarNote[];
  onAddNote: (date: Date, content: string, startTime?: string, duration?: number) => void;
  onAddMeeting: (date: Date, title: string, folderId: string, startTime?: string, duration?: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;

function formatTime(hour: number, minute: number = 0) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function endTimeStr(startTime: string, duration: number): string {
  const total = parseTime(startTime) + duration;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return formatTime(h, m);
}

function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return formatTime(h, m);
});

function formatTimeAMPM(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function DurationInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState(value);

  if (isCustom) {
    return (
      <Input
        type="number"
        min="1"
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        onBlur={() => {
          const num = parseInt(customValue);
          if (num > 0) onChange(String(num));
          setIsCustom(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const num = parseInt(customValue);
            if (num > 0) onChange(String(num));
            setIsCustom(false);
          } else if (e.key === "Escape") {
            setIsCustom(false);
          }
        }}
        className={cn("h-8 text-xs w-24", className)}
        placeholder="mins"
        autoFocus
      />
    );
  }

  const isPreset = DURATION_OPTIONS.some(d => d.value === value);
  const displayLabel = isPreset
    ? undefined
    : `${value} min`;

  return (
    <div className="flex items-center gap-1">
      <Select value={isPreset ? value : "custom"} onValueChange={(v) => {
        if (v === "custom") { setCustomValue(value); setIsCustom(true); }
        else onChange(v);
      }}>
        <SelectTrigger className={cn("h-8 text-xs w-28", className)}>
          {isPreset ? <SelectValue placeholder="Duration" /> : <span>{displayLabel}</span>}
        </SelectTrigger>
        <SelectContent>
          {DURATION_OPTIONS.map(d => (<SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>))}
          <SelectItem value="custom" className="text-xs">Custom...</SelectItem>
        </SelectContent>
      </Select>
      <button
        onClick={() => { setCustomValue(value); setIsCustom(true); }}
        className="text-[10px] text-muted-foreground hover:text-foreground underline"
        title="Enter exact minutes"
      >
        edit
      </button>
    </div>
  );
}

function formatDurationLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Compute overlap columns for timeline items — always shows ALL overlapping items
type TimelineItem = { type: "meeting"; data: Meeting } | { type: "note"; data: CalendarNote };

function computeOverlapColumns(items: TimelineItem[]): Map<string, { col: number; totalCols: number }> {
  const result = new Map<string, { col: number; totalCols: number }>();
  if (items.length === 0) return result;

  const ranges = items.map(item => {
    const st = item.type === "meeting" ? (item.data as Meeting).startTime! : (item.data as CalendarNote).startTime!;
    const dur = item.type === "meeting" ? ((item.data as Meeting).duration || 60) : ((item.data as CalendarNote).duration || 30);
    const startMin = parseTime(st);
    return { id: item.data.id, start: startMin, end: startMin + dur };
  });

  ranges.sort((a, b) => a.start - b.start);

  // Greedy column assignment
  const columns: { id: string; end: number }[][] = [];
  for (const r of ranges) {
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      const lastInCol = columns[c][columns[c].length - 1];
      if (lastInCol.end <= r.start) {
        columns[c].push({ id: r.id, end: r.end });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([{ id: r.id, end: r.end }]);
    }
  }

  const idToCol = new Map<string, number>();
  columns.forEach((col, colIdx) => {
    col.forEach(item => idToCol.set(item.id, colIdx));
  });

  // For each item, find the MAX number of simultaneous overlaps in its time range
  for (const r of ranges) {
    const col = idToCol.get(r.id)!;
    const overlappingCols = new Set<number>();
    overlappingCols.add(col);
    for (const other of ranges) {
      if (other.id === r.id) continue;
      if (other.start < r.end && other.end > r.start) {
        overlappingCols.add(idToCol.get(other.id)!);
      }
    }
    result.set(r.id, { col, totalCols: Math.max(overlappingCols.size, columns.length > 0 ? Math.max(...Array.from(overlappingCols)) + 1 : 1) });
  }

  // Normalize: for each overlap group, totalCols should be the max col + 1 among the group
  // Re-pass to ensure totalCols is consistent within overlap groups
  for (const r of ranges) {
    const col = idToCol.get(r.id)!;
    let maxTotalCols = result.get(r.id)!.totalCols;
    for (const other of ranges) {
      if (other.id === r.id) continue;
      if (other.start < r.end && other.end > r.start) {
        maxTotalCols = Math.max(maxTotalCols, result.get(other.id)!.totalCols);
      }
    }
    result.set(r.id, { col, totalCols: maxTotalCols });
  }

  return result;
}

export function CalendarView({ notes, onAddNote, onAddMeeting }: CalendarViewProps) {
  const navigate = useNavigate();
  const { folders, meetings, updateMeeting, updateCalendarNote } = useFolders();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<"note" | "meeting">("note");
  const [noteContent, setNoteContent] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editDuration, setEditDuration] = useState("60");
  const [editName, setEditName] = useState("");
  const [editingItemType, setEditingItemType] = useState<"meeting" | "note">("meeting");
  const [includeNoteTime, setIncludeNoteTime] = useState(false);
  const [noteStartTime, setNoteStartTime] = useState("09:00");
  const [noteDuration, setNoteDuration] = useState("30");
  const [folderError, setFolderError] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getNotesForDate = (date: Date) => notes.filter(n => isSameDay(n.date, date));
  const getMeetingsForDate = (date: Date) =>
    meetings.filter(m => isSameDay(m.meetingDate, date));

  // Sort items for the calendar grid cells: unscheduled first, then by time
  const getSortedItemsForDate = (date: Date) => {
    const dm = getMeetingsForDate(date);
    const dn = getNotesForDate(date);
    type GridItem = { type: "meeting"; data: Meeting } | { type: "note"; data: CalendarNote };
    const items: GridItem[] = [
      ...dm.map(m => ({ type: "meeting" as const, data: m })),
      ...dn.map(n => ({ type: "note" as const, data: n })),
    ];
    items.sort((a, b) => {
      const aTime = a.type === "meeting"
        ? ((a.data as Meeting).startTime ? parseTime((a.data as Meeting).startTime!) : -1)
        : ((a.data as CalendarNote).startTime ? parseTime((a.data as CalendarNote).startTime!) : -1);
      const bTime = b.type === "meeting"
        ? ((b.data as Meeting).startTime ? parseTime((b.data as Meeting).startTime!) : -1)
        : ((b.data as CalendarNote).startTime ? parseTime((b.data as CalendarNote).startTime!) : -1);
      // Unscheduled (-1) first, then by time ascending
      if (aTime === -1 && bTime === -1) return 0;
      if (aTime === -1) return -1;
      if (bTime === -1) return 1;
      return aTime - bTime;
    });
    return items;
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetail(true);
    setShowAddForm(false);
    setEditingItemId(null);
  };

  const handleAddClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setSelectedDate(date);
    setShowDayDetail(true);
    setShowAddForm(true);
    setAddType("note");
    setEditingItemId(null);
    setIncludeNoteTime(false);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    if (addType === "note" && noteContent.trim()) {
      onAddNote(selectedDate, noteContent.trim(), includeNoteTime ? noteStartTime : undefined, includeNoteTime ? parseInt(noteDuration) : undefined);
    } else if (addType === "meeting") {
      if (!selectedFolderId) {
        setFolderError(true);
        return;
      }
      if (meetingTitle.trim()) {
        onAddMeeting(selectedDate, meetingTitle.trim(), selectedFolderId, startTime, parseInt(duration));
      }
    }
    setShowAddForm(false);
    setNoteContent("");
    setMeetingTitle("");
    setSelectedFolderId("");
    setStartTime("09:00");
    setDuration("60");
    setIncludeNoteTime(false);
    setNoteStartTime("09:00");
    setNoteDuration("30");
    setFolderError(false);
  };

  const startEditItem = (id: string, type: "meeting" | "note", st: string, dur: number, name: string) => {
    setEditingItemId(editingItemId === id ? null : id);
    setEditingItemType(type);
    setEditStartTime(st || "09:00");
    setEditDuration(String(dur));
    setEditName(name);
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;
    if (editingItemType === "meeting" && updateMeeting) {
      updateMeeting(editingItemId, {
        startTime: editStartTime,
        duration: parseInt(editDuration),
        title: editName,
      });
    } else {
      updateCalendarNote(editingItemId, {
        startTime: editStartTime,
        duration: parseInt(editDuration),
        content: editName,
      });
    }
    setEditingItemId(null);
  };

  const dayNotes = selectedDate ? getNotesForDate(selectedDate) : [];
  const dayMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  const scheduledMeetings = dayMeetings.filter(m => m.startTime);
  const unscheduledMeetings = dayMeetings.filter(m => !m.startTime);
  const scheduledNotes = dayNotes.filter(n => n.startTime);
  const unscheduledNotes = dayNotes.filter(n => !n.startTime);

  const timelineItems: TimelineItem[] = [
    ...scheduledMeetings.map(m => ({ type: "meeting" as const, data: m })),
    ...scheduledNotes.map(n => ({ type: "note" as const, data: n })),
  ].sort((a, b) => {
    const aTime = a.type === "meeting" ? parseTime((a.data as Meeting).startTime!) : parseTime((a.data as CalendarNote).startTime!);
    const bTime = b.type === "meeting" ? parseTime((b.data as Meeting).startTime!) : parseTime((b.data as CalendarNote).startTime!);
    return aTime - bTime;
  });

  const overlapMap = computeOverlapColumns(timelineItems);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-r border-border last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid - sorted by time */}
      <div className="grid grid-cols-7 border-l border-border">
        {days.map((dayDate, idx) => {
          const sortedItems = getSortedItemsForDate(dayDate);
          const isCurrentMonth = isSameMonth(dayDate, currentMonth);
          const isToday = isSameDay(dayDate, new Date());

          return (
            <div
              key={idx}
              onClick={() => handleDayClick(dayDate)}
              className={cn(
                "min-h-[120px] p-1.5 border-r border-b border-border cursor-pointer transition-colors relative group",
                isCurrentMonth ? "bg-card" : "bg-muted/30",
                isToday && "bg-primary/5",
                "hover:bg-accent/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground"
                )}>
                  {format(dayDate, "d")}
                </span>
                <button
                  onClick={(e) => handleAddClick(e, dayDate)}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Add item"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-1 space-y-0.5 overflow-hidden">
                {sortedItems.slice(0, 3).map((item) => {
                  const isMeeting = item.type === "meeting";
                  const meeting = isMeeting ? item.data as Meeting : null;
                  const note = !isMeeting ? item.data as CalendarNote : null;
                  const st = isMeeting ? meeting!.startTime : note!.startTime;

                    return (
                      <div
                        key={item.data.id}
                        className={cn(
                          "text-[11px] px-1.5 py-0.5 rounded truncate",
                          isMeeting ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {st && (
                          <span className="font-medium mr-1">{formatTimeAMPM(st)}</span>
                        )}
                        {isMeeting ? (
                          <><FileText className="h-2.5 w-2.5 inline mr-0.5" />{meeting!.title}</>
                        ) : (
                          <><StickyNote className="h-2.5 w-2.5 inline mr-0.5" />{note!.content}</>
                        )}
                      </div>
                    );
                })}
                {sortedItems.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1.5">
                    +{sortedItems.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Popup */}
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col pr-10">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle>
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Add form */}
            {showAddForm && (
              <div className="space-y-3 border-b border-border pb-4">
                <div className="flex gap-2">
                  <Button variant={addType === "note" ? "default" : "outline"} size="sm" onClick={() => setAddType("note")} className="flex-1">Note</Button>
                  <Button variant={addType === "meeting" ? "default" : "outline"} size="sm" onClick={() => setAddType("meeting")} className="flex-1">Meeting</Button>
                </div>
                <AnimatePresence mode="wait">
                  {addType === "note" ? (
                    <motion.div key="note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                      <Textarea placeholder="Write your note..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="min-h-[80px]" autoFocus />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input type="checkbox" checked={includeNoteTime} onChange={(e) => setIncludeNoteTime(e.target.checked)} className="rounded" />
                          Set time
                        </label>
                      </div>
                      {includeNoteTime && (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Start time</label>
                          <Select value={noteStartTime} onValueChange={setNoteStartTime}>
                              <SelectTrigger className="h-9"><SelectValue>{formatTimeAMPM(noteStartTime)}</SelectValue></SelectTrigger>
                              <SelectContent className="max-h-48">
                                {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t}>{formatTimeAMPM(t)}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                            <DurationInput value={noteDuration} onChange={setNoteDuration} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="meeting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <Input placeholder="Meeting title" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} autoFocus />
                      <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                        <SelectTrigger><SelectValue placeholder="Select a folder (required)" /></SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">Start time</label>
                          <Select value={startTime} onValueChange={setStartTime}>
                            <SelectTrigger className="h-9"><SelectValue>{formatTimeAMPM(startTime)}</SelectValue></SelectTrigger>
                            <SelectContent className="max-h-48">
                              {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t}>{formatTimeAMPM(t)}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                          <DurationInput value={duration} onChange={setDuration} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSubmit}>Add {addType === "note" ? "Note" : "Meeting"}</Button>
                </div>
              </div>
            )}

            {/* Unscheduled items */}
            {(unscheduledMeetings.length > 0 || unscheduledNotes.length > 0) && (
              <div className="border-b border-border pb-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Unscheduled</h4>
                {unscheduledMeetings.map(meeting => (
                  <div key={meeting.id} className="bg-primary/5 rounded-lg p-2.5 mb-1">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setShowDayDetail(false); navigate(`/meeting/${meeting.id}`); }}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{meeting.title}</span>
                      </button>
                      <button
                        onClick={() => startEditItem(meeting.id, "meeting", "", meeting.duration || 60, meeting.title)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" /> Set time
                      </button>
                    </div>
                    {editingItemId === meeting.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 mt-2 pt-2 border-t border-border/50">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs" placeholder="Meeting name" />
                        <div className="flex items-center gap-2">
                          <Select value={editStartTime} onValueChange={setEditStartTime}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue>{formatTimeAMPM(editStartTime)}</SelectValue></SelectTrigger>
                            <SelectContent className="max-h-48">
                              {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t} className="text-xs">{formatTimeAMPM(t)}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <DurationInput value={editDuration} onChange={setEditDuration} />
                          <Button size="sm" className="h-8 text-xs" onClick={handleSaveEdit}>Save</Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
                {unscheduledNotes.map(note => (
                  <div key={note.id} className="bg-muted/50 rounded-lg p-2.5 mb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{note.content}</span>
                      </div>
                      <button
                        onClick={() => startEditItem(note.id, "note", "", note.duration || 30, note.content)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" /> Set time
                      </button>
                    </div>
                    {editingItemId === note.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 mt-2 pt-2 border-t border-border/50">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs" placeholder="Note text" />
                        <div className="flex items-center gap-2">
                          <Select value={editStartTime} onValueChange={setEditStartTime}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue>{formatTimeAMPM(editStartTime)}</SelectValue></SelectTrigger>
                            <SelectContent className="max-h-48">
                              {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t} className="text-xs">{formatTimeAMPM(t)}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <DurationInput value={editDuration} onChange={setEditDuration} />
                          <Button size="sm" className="h-8 text-xs" onClick={handleSaveEdit}>Save</Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Full day timeline with overlapping support */}
            <div className="relative">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Daily Timeline</h4>
              <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full flex border-t border-border/30"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  >
                    <div className="w-16 shrink-0 pr-2 pt-1 text-right">
                      <span className="text-xs text-muted-foreground font-medium">
                        {formatHourLabel(hour)}
                      </span>
                    </div>
                    <div className="flex-1 border-l-2 border-border/30" />
                  </div>
                ))}

                {/* Positioned timeline items with overlap columns */}
                {timelineItems.map((item) => {
                  const st = item.type === "meeting" ? (item.data as Meeting).startTime! : (item.data as CalendarNote).startTime!;
                  const dur = item.type === "meeting" ? ((item.data as Meeting).duration || 60) : ((item.data as CalendarNote).duration || 30);
                  const startMin = parseTime(st);
                  const topPx = (startMin / 60) * HOUR_HEIGHT;
                  const heightPx = Math.max((dur / 60) * HOUR_HEIGHT, 28);
                  const id = item.data.id;
                  const isMeeting = item.type === "meeting";
                  const meeting = isMeeting ? item.data as Meeting : null;
                  const note = !isMeeting ? item.data as CalendarNote : null;

                  const overlap = overlapMap.get(id) || { col: 0, totalCols: 1 };
                  const availableWidth = `calc(100% - 76px)`; // right area after hour labels
                  const colWidth = `calc(${availableWidth} / ${overlap.totalCols})`;
                  const leftOffset = `calc(68px + (${availableWidth} / ${overlap.totalCols}) * ${overlap.col})`;

                  return (
                    <div key={id}>
                      <div
                        className={cn(
                          "absolute rounded-lg border px-2 py-1",
                          isMeeting ? "bg-primary/10 border-primary/20" : "bg-accent/60 border-accent"
                        )}
                        style={{
                          top: topPx,
                          height: heightPx,
                          left: leftOffset,
                          width: `calc(${colWidth} - 4px)`,
                          overflow: "hidden",
                        }}
                      >
                        <div className="flex items-start justify-between h-full">
                          <div className="min-w-0 flex-1">
                            {isMeeting ? (
                              <button
                                onClick={() => { setShowDayDetail(false); navigate(`/meeting/${meeting!.id}`); }}
                                className="flex items-center gap-1 hover:text-primary transition-colors text-left"
                              >
                                <FileText className="h-3 w-3 text-primary shrink-0" />
                                <span className="text-[11px] font-medium truncate">{meeting!.title}</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <StickyNote className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-[11px] truncate">{note!.content}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {formatTimeAMPM(st)} – {formatTimeAMPM(endTimeStr(st, dur))} · {formatDurationLabel(dur)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditItem(
                                id,
                                isMeeting ? "meeting" : "note",
                                st,
                                dur,
                                isMeeting ? meeting!.title : note!.content
                              );
                            }}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 shrink-0 ml-1"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {editingItemId === id && (
                        <div
                          className="absolute rounded-lg border bg-card shadow-lg px-3 py-2 z-50"
                          style={{
                            top: topPx + heightPx + 4,
                            left: leftOffset,
                            width: `calc(${colWidth} - 4px)`,
                            minWidth: 240,
                          }}
                        >
                          <div className="space-y-1.5">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-[11px]" />
                            <div className="flex items-center gap-1">
                              <Select value={editStartTime} onValueChange={setEditStartTime}>
                                <SelectTrigger className="w-24 h-7 text-[10px]"><SelectValue>{formatTimeAMPM(editStartTime)}</SelectValue></SelectTrigger>
                                <SelectContent className="max-h-48">
                                  {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t} className="text-xs">{formatTimeAMPM(t)}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <DurationInput value={editDuration} onChange={setEditDuration} className="w-20" />
                              <Button size="sm" className="h-7 text-[10px] px-2" onClick={handleSaveEdit}>Save</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {dayMeetings.length === 0 && dayNotes.length === 0 && !showAddForm && (
              <p className="text-sm text-muted-foreground text-center py-8">No items for this day.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
