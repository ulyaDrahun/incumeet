import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, Check, ChevronDown, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/contexts/FoldersContext";
import type { Folder } from "@/types";
import { format } from "date-fns";

type UploadType = "text";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  defaultFolderId?: string;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
];

function formatTimeAMPM(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function UploadModal({
  open,
  onOpenChange,
  folders,
  defaultFolderId,
}: UploadModalProps) {
  const { createMeeting, createFolder, generateSummary } = useFolders();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<UploadType>("text");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState<string>(defaultFolderId || "");
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [includeTime, setIncludeTime] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");

  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingNewFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreatingNewFolder]);

  useEffect(() => {
    if (defaultFolderId) {
      setFolderId(defaultFolderId);
    }
  }, [defaultFolderId]);

  const handleNewFolderSelect = () => {
    setIsCreatingNewFolder(true);
    setFolderId("");
    setDropdownOpen(false);
  };

  const handleFolderSelect = (id: string) => {
    setFolderId(id);
    setIsCreatingNewFolder(false);
    setNewFolderName("");
    setDropdownOpen(false);
  };

  const handleNewFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsCreatingNewFolder(false);
      setNewFolderName("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a meeting title.");
      return;
    }
    
    let targetFolderId = folderId;
    if (isCreatingNewFolder && newFolderName.trim()) {
      targetFolderId = await createFolder(newFolderName.trim());
    }
    
    if (!targetFolderId) {
      setError("Please select or create a folder.");
      return;
    }
    if (selectedType === "text" && !content.trim()) {
      setError("Please paste your transcript.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const meetingId = await createMeeting({
        title: title.trim(),
        folderId: targetFolderId,
        isStarred: false,
        isPinned: false,
        meetingDate: meetingDate,
        transcript: content,
        summary: null,
        sourceType: selectedType,
        startTime: includeTime ? startTime : undefined,
        duration: includeTime ? parseInt(duration) : undefined,
      });

      toast({
        title: "Processing...",
        description: "Generating AI summary for your meeting.",
      });

      try {
        await generateSummary(meetingId, content);
        toast({
          title: "Meeting created",
          description: `"${title}" has been saved with AI summary.`,
        });
      } catch (summaryError) {
        console.error("Summary generation failed:", summaryError);
        toast({
          title: "Meeting saved",
          description: `Meeting saved but summary generation failed. You can regenerate it later.`,
          variant: "destructive",
        });
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTitle("");
    setSelectedType("text");
    setContent("");
    setFolderId(defaultFolderId || "");
    setIsCreatingNewFolder(false);
    setNewFolderName("");
    setError(null);
    setDropdownOpen(false);
    setMeetingDate(new Date());
    setIncludeTime(false);
    setStartTime("09:00");
    setDuration("60");
  };

  const selectedFolder = folders.find((f) => f.id === folderId);
  const displayFolderName = isCreatingNewFolder 
    ? "New Folder" 
    : selectedFolder?.name || "Select a folder";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Meeting</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* 1. Meeting Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting Title</label>
            <Input
              placeholder="e.g., Weekly Team Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 2. Meeting Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting Date</label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(meetingDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={meetingDate}
                  onSelect={(date) => {
                    if (date) {
                      setMeetingDate(date);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* + Set Time toggle */}
            {!includeTime ? (
              <button
                onClick={() => setIncludeTime(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                + Set time
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex gap-2 pt-1"
              >
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Start time</label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="h-9">
                      <SelectValue>{formatTimeAMPM(startTime)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map(t => (
                        <SelectItem key={t} value={t}>{formatTimeAMPM(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-muted-foreground"
                    onClick={() => setIncludeTime(false)}
                  >
                    Remove
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* 3. Transcript Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transcript</label>
            <Textarea
              placeholder="Paste your meeting transcript here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[140px] resize-none"
            />
          </div>

          {/* 4. Folder Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Save To Folder</label>
            
            {!isCreatingNewFolder ? (
              <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {displayFolderName}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                  <div className="max-h-[200px] overflow-y-auto">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderSelect(folder.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                      >
                        {folder.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-t">
                    <button
                      onClick={handleNewFolderSelect}
                      className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-accent transition-colors"
                    >
                      + New Folder
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-between" onClick={() => setDropdownOpen(true)}>
                  New Folder
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
                <Input
                  ref={newFolderInputRef}
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={handleNewFolderKeyDown}
                />
                {dropdownOpen && (
                  <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <PopoverTrigger asChild>
                      <span />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-full p-0">
                      <div className="max-h-[200px] overflow-y-auto">
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => handleFolderSelect(folder.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                          >
                            {folder.name}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload & Generate Summary"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
