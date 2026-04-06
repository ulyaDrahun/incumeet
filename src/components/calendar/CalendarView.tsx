import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, FileText, StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFolders } from "@/contexts/FoldersContext";
import type { CalendarNote } from "@/types";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface CalendarViewProps {
  notes: CalendarNote[];
  onAddNote: (date: Date, content: string) => void;
  onAddMeeting: (date: Date, title: string, folderId: string) => void;
}

export function CalendarView({ notes, onAddNote, onAddMeeting }: CalendarViewProps) {
  const navigate = useNavigate();
  const { folders, meetings } = useFolders();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<"note" | "meeting">("note");
  const [noteContent, setNoteContent] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");

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
  const getMeetingsForDate = (date: Date) => meetings.filter(m => isSameDay(m.meetingDate, date));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetail(true);
    setShowAddForm(false);
  };

  const handleAddClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setSelectedDate(date);
    setShowDayDetail(true);
    setShowAddForm(true);
    setAddType("note");
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    if (addType === "note" && noteContent.trim()) {
      onAddNote(selectedDate, noteContent.trim());
    } else if (addType === "meeting" && meetingTitle.trim() && selectedFolderId) {
      onAddMeeting(selectedDate, meetingTitle.trim(), selectedFolderId);
    }
    setShowAddForm(false);
    setNoteContent("");
    setMeetingTitle("");
    setSelectedFolderId("");
  };

  const dayNotes = selectedDate ? getNotesForDate(selectedDate) : [];
  const dayMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

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

      {/* Calendar grid - large cells */}
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

      {/* Day Detail Popup */}
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Existing items */}
            {dayMeetings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Meetings</h3>
                {dayMeetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => { setShowDayDetail(false); navigate(`/meeting/${meeting.id}`); }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                  >
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {folders.find(f => f.id === meeting.folderId)?.name || "Unknown folder"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {dayNotes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                {dayNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border border-border bg-muted/50">
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            {dayMeetings.length === 0 && dayNotes.length === 0 && !showAddForm && (
              <p className="text-sm text-muted-foreground text-center py-4">No items for this day.</p>
            )}

            {/* Add form */}
            {showAddForm ? (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex gap-2">
                  <Button
                    variant={addType === "note" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddType("note")}
                    className="flex-1"
                  >
                    Note
                  </Button>
                  <Button
                    variant={addType === "meeting" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddType("meeting")}
                    className="flex-1"
                  >
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
                      <Input
                        placeholder="Meeting title"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        autoFocus
                      />
                      <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a folder (required)" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSubmit}>
                    Add {addType === "note" ? "Note" : "Meeting"}
                  </Button>
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
