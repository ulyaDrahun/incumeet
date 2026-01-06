import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Mic, Video, Upload, Loader2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/contexts/FoldersContext";
import type { Folder } from "@/types";

type UploadType = "text" | "audio" | "video";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  defaultFolderId?: string;
}

const uploadOptions = [
  {
    type: "text" as UploadType,
    icon: FileText,
    label: "Text Transcript",
    description: "Paste your meeting transcript",
  },
  {
    type: "audio" as UploadType,
    icon: Mic,
    label: "Audio File",
    description: "Upload an audio recording",
  },
  {
    type: "video" as UploadType,
    icon: Video,
    label: "Video Link",
    description: "Paste a video URL",
  },
];

export function UploadModal({
  open,
  onOpenChange,
  folders,
  defaultFolderId,
}: UploadModalProps) {
  const { createMeeting, createFolder, generateSummary } = useFolders();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<UploadType | null>(null);
  const [content, setContent] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [folderId, setFolderId] = useState<string>(defaultFolderId || "");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewFolderInput && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [showNewFolderInput]);

  useEffect(() => {
    if (defaultFolderId) {
      setFolderId(defaultFolderId);
    }
  }, [defaultFolderId]);

  const handleNewFolderSelect = () => {
    setShowNewFolderInput(true);
    setFolderId("");
    // Keep dropdown open
  };

  const handleNewFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newFolderName.trim()) {
      const id = createFolder(newFolderName.trim());
      setFolderId(id);
      setShowNewFolderInput(false);
      setNewFolderName("");
      setDropdownOpen(false);
    } else if (e.key === "Escape") {
      setShowNewFolderInput(false);
      setNewFolderName("");
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setContent(file.name);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedType) {
      setError("Please enter a meeting title and select a content type.");
      return;
    }
    
    // Allow creating with new folder name typed but not yet confirmed
    let targetFolderId = folderId;
    if (!folderId && newFolderName.trim()) {
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
      // Create meeting with placeholder summary (will be replaced by AI)
      const meetingId = createMeeting({
        title: title.trim(),
        folderId: targetFolderId,
        isStarred: false,
        isPinned: false,
        transcript: content,
        summary: null, // Will be generated
        sourceType: selectedType,
      });

      toast({
        title: "Processing...",
        description: "Generating AI summary for your meeting.",
      });

      // Generate AI summary
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
    // Reset
    setTitle("");
    setSelectedType(null);
    setContent("");
    setAudioFile(null);
    setFolderId(defaultFolderId || "");
    setShowNewFolderInput(false);
    setNewFolderName("");
    setError(null);
    setDropdownOpen(false);
  };

  const selectedFolder = folders.find((f) => f.id === folderId);

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

          {/* 2. Upload Type Selection */}
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

          {/* 2b. Content Input Area */}
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

          {/* 3. Folder Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Save To Folder</label>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedFolder ? selectedFolder.name : (newFolderName ? `New: ${newFolderName}` : "Select a folder")}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {folders.map((folder) => (
                  <DropdownMenuItem 
                    key={folder.id} 
                    onClick={() => {
                      setFolderId(folder.id);
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }}
                  >
                    {folder.name}
                  </DropdownMenuItem>
                ))}
                {folders.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNewFolderSelect();
                  }}
                  className="focus:bg-transparent"
                >
                  <span className="text-primary">+ New Folder</span>
                </DropdownMenuItem>
                {showNewFolderInput && (
                  <div className="px-2 py-1.5">
                    <Input
                      ref={newFolderInputRef}
                      placeholder="Enter folder name..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={handleNewFolderKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8"
                    />
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
