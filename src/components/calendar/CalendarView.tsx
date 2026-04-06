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
  onAddNote: (date: Date, content: string) => void;
  onAddMeeting: (date: Date, title: string, folderId: string, startTime?: string, duration?: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

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

export function CalendarView({ notes, onAddNote, onAddMeeting }: CalendarViewProps) {
  const navigate = useNavigate();
  const { folders, meetings, updateMeeting } = useFolders();
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
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editDuration, setEditDuration] = useState("60");

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
  };

  const handleAddClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setSelectedDate(date);
    setShowDayDetail(true);
    setShowAddForm(true);
    setAddType("note");
    setEditingTimeId(null);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    if (addType === "note" && noteContent.trim()) {
      onAddNote(selectedDate, noteContent.trim());
    } else if (addType === "meeting" && meetingTitle.trim() && selectedFolderId) {
      onAddMeeting(selectedDate, meetingTitle.trim(), selectedFolderId, startTime, parseInt(duration));
    }
    setShowAddForm(false);
    setNoteContent("");
    setMeetingTitle("");
    setSelectedFolderId("");
    setStartTime("09:00");
    setDuration("60");
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

  const dayNotes = selectedDate ? getNotesForDate(selectedDate) : [];
  const dayMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  // Build timeline slots for visible hours
  const getTimelineHours = () => {
    if (dayMeetings.length === 0) return HOURS.slice(8, 20); // 8am-8pm default
    let minH = 8, maxH = 20;
    dayMeetings.forEach(m => {
      if (m.startTime) {
        const start = parseTime(m.startTime);
        const end = start + (m.duration || 60);
        minH = Math.min(minH, Math.floor(start / 60));
        maxH = Math.max(maxH, Math.ceil(end / 60));
      }
    });
    return HOURS.slice(Math.max(0, minH - 1), Math.min(24, maxH + 1));
  };

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
            <DialogTitle>
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Timeline view */}
            {(dayMeetings.length > 0 || dayNotes.length > 0) && (
              <div className="relative">
                {/* Timeline hours */}
                <div className="space-y-0">
                  {getTimelineHours().map((hour) => {
                    const hourMeetings = dayMeetings.filter(m => {
                      if (!m.startTime) return false;
                      const startMin = parseTime(m.startTime);
                      const endMin = startMin + (m.duration || 60);
                      const hourStart = hour * 60;
                      const hourEnd = (hour + 1) * 60;
                      return startMin < hourEnd && endMin > hourStart;
                    });

                    return (
                      <div key={hour} className="flex min-h-[60px] border-t border-border/50">
                        {/* Time label */}
                        <div className="w-16 shrink-0 pr-2 pt-1 text-right">
                          <span className="text-xs text-muted-foreground font-medium">
                            {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                          </span>
                        </div>
                        {/* Content area */}
                        <div className="flex-1 pl-3 border-l-2 border-border/30 py-1 space-y-1">
                          {hourMeetings.map(meeting => {
                            const startMin = parseTime(meeting.startTime!);
                            const meetingHourStart = hour * 60;
                            // Only render at the starting hour
                            if (startMin < meetingHourStart || startMin >= meetingHourStart + 60) return null;

                            return (
                              <div key={meeting.id} className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 space-y-1">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => { setShowDayDetail(false); navigate(`/meeting/${meeting.id}`); }}
                                    className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                                  >
                                    <FileText className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium">{meeting.title}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTimeId(editingTimeId === meeting.id ? null : meeting.id);
                                      setEditStartTime(meeting.startTime || "09:00");
                                      setEditDuration(String(meeting.duration || 60));
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    Edit time
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-medium">
                                    {meeting.startTime} – {endTimeStr(meeting.startTime!, meeting.duration || 60)}
                                  </span>
                                  <span>•</span>
                                  <span>{folders.find(f => f.id === meeting.folderId)?.name}</span>
                                </div>

                                {/* Inline time editor */}
                                {editingTimeId === meeting.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="flex items-center gap-2 pt-2 border-t border-border/50 mt-1"
                                  >
                                    <Select value={editStartTime} onValueChange={setEditStartTime}>
                                      <SelectTrigger className="w-28 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-48">
                                        {TIME_OPTIONS.map(t => (
                                          <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select value={editDuration} onValueChange={setEditDuration}>
                                      <SelectTrigger className="w-28 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DURATION_OPTIONS.map(d => (
                                          <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveTime(meeting)}>
                                      Save
                                    </Button>
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unscheduled meetings */}
                {dayMeetings.filter(m => !m.startTime).length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Unscheduled</h4>
                    {dayMeetings.filter(m => !m.startTime).map(meeting => (
                      <div key={meeting.id} className="flex items-center justify-between bg-primary/5 rounded-lg p-2.5 mb-1">
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
                            setEditDuration("60");
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" /> Set time
                        </button>
                        {editingTimeId === meeting.id && (
                          <div className="flex items-center gap-2 ml-2">
                            <Select value={editStartTime} onValueChange={setEditStartTime}>
                              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent className="max-h-48">
                                {TIME_OPTIONS.map(t => (
                                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={editDuration} onValueChange={setEditDuration}>
                              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DURATION_OPTIONS.map(d => (
                                  <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleSaveTime(meeting)}>Save</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes section */}
                {dayNotes.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Notes</h4>
                    {dayNotes.map((note) => (
                      <div key={note.id} className="p-2.5 rounded-lg border border-border bg-muted/50 mb-1">
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {dayMeetings.length === 0 && dayNotes.length === 0 && !showAddForm && (
              <p className="text-sm text-muted-foreground text-center py-8">No items for this day.</p>
            )}

            {/* Add form */}
            {showAddForm ? (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex gap-2">
                  <Button variant={addType === "note" ? "default" : "outline"} size="sm" onClick={() => setAddType("note")} className="flex-1">
                    Note
                  </Button>
                  <Button variant={addType === "meeting" ? "default" : "outline"} size="sm" onClick={() => setAddType("meeting")} className="flex-1">
                    Meeting
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  {addType === "note" ? (
                    <motion.div key="note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                      <Textarea
                        placeholder="Write your note..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="min-h-[80px]"
                        autoFocus
                      />
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
                              {TIME_OPTIONS.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {DURATION_OPTIONS.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />Add Item
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
