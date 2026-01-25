import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFolders } from "@/contexts/FoldersContext";
import type { CalendarNote, Folder } from "@/types";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface CalendarViewProps {
  notes: CalendarNote[];
  onAddNote: (date: Date, content: string) => void;
  onAddMeeting: (date: Date, title: string, folderId: string) => void;
}

export function CalendarView({ notes, onAddNote, onAddMeeting }: CalendarViewProps) {
  const { folders, meetings } = useFolders();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowAddModal(true);
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    
    if (addType === "note" && noteContent.trim()) {
      onAddNote(selectedDate, noteContent.trim());
    } else if (addType === "meeting" && meetingTitle.trim() && selectedFolderId) {
      onAddMeeting(selectedDate, meetingTitle.trim(), selectedFolderId);
    }
    
    setShowAddModal(false);
    setNoteContent("");
    setMeetingTitle("");
    setSelectedFolderId("");
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayDate, idx) => {
          const dayNotes = getNotesForDate(dayDate);
          const dayMeetings = getMeetingsForDate(dayDate);
          const isCurrentMonth = isSameMonth(dayDate, currentMonth);
          const isToday = isSameDay(dayDate, new Date());
          const hasContent = dayNotes.length > 0 || dayMeetings.length > 0;

          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleDateClick(dayDate)}
              className={cn(
                "min-h-[80px] p-2 rounded-lg border text-left transition-colors relative",
                isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
                isToday && "ring-2 ring-primary",
                "hover:bg-accent"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                isToday && "text-primary"
              )}>
                {format(dayDate, "d")}
              </span>
              
              {/* Content indicators */}
              <div className="mt-1 space-y-0.5">
                {dayMeetings.slice(0, 2).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary rounded truncate"
                  >
                    <FileText className="h-2 w-2 inline mr-0.5" />
                    {meeting.title}
                  </div>
                ))}
                {dayNotes.slice(0, 1).map((note) => (
                  <div
                    key={note.id}
                    className="text-[10px] px-1 py-0.5 bg-muted text-muted-foreground rounded truncate"
                  >
                    {note.content}
                  </div>
                ))}
                {(dayMeetings.length > 2 || dayNotes.length > 1) && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayMeetings.length - 2 + dayNotes.length - 1} more
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add to {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Type selection */}
            <div className="flex gap-2">
              <Button
                variant={addType === "note" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddType("note")}
                className="flex-1"
              >
                Add Note
              </Button>
              <Button
                variant={addType === "meeting" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddType("meeting")}
                className="flex-1"
              >
                Add Meeting
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {addType === "note" ? (
                <motion.div
                  key="note"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <Textarea
                    placeholder="Write your note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="meeting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Title</label>
                    <Input
                      placeholder="e.g., Team Sync"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Save to Folder</label>
                    <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Add {addType === "note" ? "Note" : "Meeting"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
