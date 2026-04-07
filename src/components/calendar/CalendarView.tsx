import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, FileText, StickyNote, Clock } from "lucide-react";
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
const HOUR_HEIGHT = 60; // px per hour

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

// Editable duration component: click to type custom, or use dropdown
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

  return (
    <div className="flex items-center gap-1">
      <Select value={DURATION_OPTIONS.some(d => d.value === value) ? value : "custom"} onValueChange={(v) => {
        if (v === "custom") { setCustomValue(value); setIsCustom(true); }
        else onChange(v);
      }}>
        <SelectTrigger className={cn("h-8 text-xs w-28", className)} onClick={(e) => {
          // If user clicks directly on the trigger text area (not the chevron), allow custom input
        }}>
          <SelectValue placeholder="Duration" />
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
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingNoteTimeId, setEditingNoteTimeId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editDuration, setEditDuration] = useState("60");
  const [includeNoteTime, setIncludeNoteTime] = useState(false);
  const [noteStartTime, setNoteStartTime] = useState("09:00");
  const [noteDuration, setNoteDuration] = useState("30");

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
  const getMeetingsForDate = (date: Date) => {
    return meetings
      .filter(m => isSameDay(m.meetingDate, date))
      .sort((a, b) => {
        const aTime = a.startTime ? parseTime(a.startTime) : 9999;
        const bTime = b.startTime ? parseTime(b.startTime) : 9999;
        return aTime - bTime;
      });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetail(true);
    setShowAddForm(false);
    setEditingTimeId(null);
    setEditingNoteTimeId(null);
  };

  const handleAddClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setSelectedDate(date);
    setShowDayDetail(true);
    setShowAddForm(true);
    setAddType("note");
    setEditingTimeId(null);
    setEditingNoteTimeId(null);
    setIncludeNoteTime(false);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    if (addType === "note" && noteContent.trim()) {
      onAddNote(selectedDate, noteContent.trim(), includeNoteTime ? noteStartTime : undefined, includeNoteTime ? parseInt(noteDuration) : undefined);
    } else if (addType === "meeting" && meetingTitle.trim() && selectedFolderId) {
      onAddMeeting(selectedDate, meetingTitle.trim(), selectedFolderId, startTime, parseInt(duration));
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
  };

  const handleSaveTime = (meeting: Meeting) => {
    if (updateMeeting) {
      updateMeeting(meeting.id, {
        startTime: editStartTime,
        duration: parseInt(editDuration),
      });
    }
    setEditingTimeId(null);
  };

  const handleSaveNoteTime = (note: CalendarNote) => {
    updateCalendarNote(note.id, {
      startTime: editStartTime,
      duration: parseInt(editDuration),
    });
    setEditingNoteTimeId(null);
  };

  const dayNotes = selectedDate ? getNotesForDate(selectedDate) : [];
  const dayMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  // Combine scheduled meetings and notes for timeline
  type TimelineItem = { type: "meeting"; data: Meeting } | { type: "note"; data: CalendarNote };
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-border">
        {days.map((dayDate, idx) => {
          const dn = getNotesForDate(dayDate);
          const dm = getMeetingsForDate(dayDate);
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
                {dm.slice(0, 2).map((meeting) => (
                  <div key={meeting.id} className="text-[11px] px-1.5 py-0.5 bg-primary/10 text-primary rounded truncate">
                    {meeting.startTime && (
                      <span className="font-medium mr-1">{meeting.startTime}</span>
                    )}
                    <FileText className="h-2.5 w-2.5 inline mr-0.5" />
                    {meeting.title}
                  </div>
                ))}
                {dn.slice(0, 2).map((note) => (
                  <div key={note.id} className="text-[11px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded truncate">
                    {note.startTime && (
                      <span className="font-medium mr-1">{note.startTime}</span>
                    )}
                    <StickyNote className="h-2.5 w-2.5 inline mr-0.5" />
                    {note.content}
                  </div>
                ))}
                {(dm.length + dn.length > 2) && (
                  <span className="text-[10px] text-muted-foreground px-1.5">
                    +{dm.length + dn.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Popup - Timeline style */}
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Add form at top when open */}
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
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent className="max-h-48">
                                {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
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
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent className="max-h-48">
                              {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
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

            {/* Unscheduled meetings at top */}
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
                        onClick={() => {
                          setEditingTimeId(editingTimeId === meeting.id ? null : meeting.id);
                          setEditStartTime("09:00");
                          setEditDuration(String(meeting.duration || 60));
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" /> Set time
                      </button>
                    </div>
                    {editingTimeId === meeting.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                        <Select value={editStartTime} onValueChange={setEditStartTime}>
                          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-48">
                            {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <DurationInput value={editDuration} onChange={setEditDuration} />
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveTime(meeting)}>Save</Button>
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
                        onClick={() => {
                          setEditingNoteTimeId(editingNoteTimeId === note.id ? null : note.id);
                          setEditStartTime("09:00");
                          setEditDuration(String(note.duration || 30));
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" /> Set time
                      </button>
                    </div>
                    {editingNoteTimeId === note.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                        <Select value={editStartTime} onValueChange={setEditStartTime}>
                          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-48">
                            {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <DurationInput value={editDuration} onChange={setEditDuration} />
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveNoteTime(note)}>Save</Button>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Full day timeline with proportional blocks */}
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

                {/* Positioned timeline items */}
                {timelineItems.map((item) => {
                  const st = item.type === "meeting" ? (item.data as Meeting).startTime! : (item.data as CalendarNote).startTime!;
                  const dur = item.type === "meeting" ? ((item.data as Meeting).duration || 60) : ((item.data as CalendarNote).duration || 30);
                  const startMin = parseTime(st);
                  const topPx = (startMin / 60) * HOUR_HEIGHT;
                  const heightPx = Math.max((dur / 60) * HOUR_HEIGHT, 28); // minimum 28px
                  const id = item.data.id;
                  const isMeeting = item.type === "meeting";
                  const meeting = isMeeting ? item.data as Meeting : null;
                  const note = !isMeeting ? item.data as CalendarNote : null;

                  return (
                    <div
                      key={id}
                      className={cn(
                        "absolute left-[68px] right-2 rounded-lg border px-3 py-1.5 overflow-hidden",
                        isMeeting ? "bg-primary/10 border-primary/20" : "bg-accent/60 border-accent"
                      )}
                      style={{ top: topPx, height: heightPx }}
                    >
                      <div className="flex items-start justify-between h-full">
                        <div className="min-w-0 flex-1">
                          {isMeeting ? (
                            <button
                              onClick={() => { setShowDayDetail(false); navigate(`/meeting/${meeting!.id}`); }}
                              className="flex items-center gap-1.5 hover:text-primary transition-colors text-left"
                            >
                              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="text-xs font-medium truncate">{meeting!.title}</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <StickyNote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs truncate">{note!.content}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {st} – {endTimeStr(st, dur)} · {formatDurationLabel(dur)}
                            {isMeeting && meeting && <span> · {folders.find(f => f.id === meeting.folderId)?.name}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (isMeeting) {
                              setEditingTimeId(editingTimeId === id ? null : id);
                              setEditingNoteTimeId(null);
                            } else {
                              setEditingNoteTimeId(editingNoteTimeId === id ? null : id);
                              setEditingTimeId(null);
                            }
                            setEditStartTime(st);
                            setEditDuration(String(dur));
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 shrink-0 ml-1"
                        >
                          <Clock className="h-3 w-3" />
                        </button>
                      </div>
                      {((isMeeting && editingTimeId === id) || (!isMeeting && editingNoteTimeId === id)) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-1 pt-1 border-t border-border/50">
                          <Select value={editStartTime} onValueChange={setEditStartTime}>
                            <SelectTrigger className="w-24 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent className="max-h-48">
                              {TIME_OPTIONS.map(t => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <DurationInput value={editDuration} onChange={setEditDuration} className="w-24" />
                          <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => {
                            if (isMeeting) handleSaveTime(meeting!);
                            else handleSaveNoteTime(note!);
                          }}>Save</Button>
                        </motion.div>
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
