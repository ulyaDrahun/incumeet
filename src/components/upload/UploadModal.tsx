import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Loader2, Check, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    
    // Allow creating with new folder name typed
    let targetFolderId = folderId;
    if (isCreatingNewFolder && newFolderName.trim()) {
      targetFolderId = createFolder(newFolderName.trim());
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
      const meetingId = createMeeting({
        title: title.trim(),
        folderId: targetFolderId,
        isStarred: false,
        isPinned: false,
        meetingDate: meetingDate,
        transcript: content,
        summary: null,
        sourceType: selectedType,
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
    setSelectedType(null);
    setContent("");
    setAudioFile(null);
    setFolderId(defaultFolderId || "");
    setIsCreatingNewFolder(false);
    setNewFolderName("");
    setError(null);
    setDropdownOpen(false);
    setMeetingDate(new Date());
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
          </div>

          {/* 3. Upload Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Content</label>
            <div className="grid gap-2">
              {uploadOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    setSelectedType(option.type);
                    setContent("");
                    setAudioFile(null);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    selectedType === option.type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-md flex items-center justify-center",
                      selectedType === option.type ? "bg-primary/20" : "bg-secondary"
                    )}
                  >
                    <option.icon
                      className={cn(
                        "h-5 w-5",
                        selectedType === option.type ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {selectedType === option.type && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Input Area */}
          <AnimatePresence mode="wait">
            {selectedType === "text" && (
              <motion.div
                key="text"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-sm font-medium">Transcript</label>
                <Textarea
                  placeholder="Paste your meeting transcript here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[140px] resize-none"
                />
              </motion.div>
            )}

            {selectedType === "audio" && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-sm font-medium">Audio File</label>
                <input
                  type="file"
                  accept="audio/*"
                  ref={audioInputRef}
                  onChange={handleAudioChange}
                  className="hidden"
                />
                <div
                  onClick={() => audioInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {audioFile ? (
                    <p className="text-sm font-medium">{audioFile.name}</p>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        MP3, WAV, M4A up to 100MB
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {selectedType === "video" && (
              <motion.div
                key="video"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-sm font-medium">Video URL</label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  YouTube, Loom, Vimeo, or direct video links
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4. Folder Selection - Simplified */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Save To Folder</label>
            
            {/* Dropdown trigger that shows selected folder or "New Folder" */}
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
              /* When creating new folder, show condensed button + text input */
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
                {/* Re-open dropdown to select existing folder instead */}
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
