import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Mic, Video, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type UploadType = "text" | "audio" | "video";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string;
  onUpload?: (data: { title: string; type: UploadType; content: string }) => void;
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
  folderId,
  onUpload,
}: UploadModalProps) {
  const [step, setStep] = useState<"select" | "input">("select");
  const [selectedType, setSelectedType] = useState<UploadType | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleTypeSelect = (type: UploadType) => {
    setSelectedType(type);
    setStep("input");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedType(null);
    setContent("");
  };

  const handleSubmit = async () => {
    if (!selectedType || !title) return;
    
    setIsUploading(true);
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    onUpload?.({ title, type: selectedType, content });
    setIsUploading(false);
    onOpenChange(false);
    
    // Reset form
    setStep("select");
    setSelectedType(null);
    setTitle("");
    setContent("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("select");
    setSelectedType(null);
    setTitle("");
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Upload Meeting" : `New ${selectedType === "text" ? "Text" : selectedType === "audio" ? "Audio" : "Video"} Meeting`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid gap-3 py-4"
            >
              {uploadOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleTypeSelect(option.type)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <option.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Meeting Title</label>
                <Input
                  placeholder="e.g., Weekly Team Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {selectedType === "text" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transcript</label>
                  <Textarea
                    placeholder="Paste your meeting transcript here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                </div>
              )}

              {selectedType === "audio" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audio File</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP3, WAV, M4A up to 100MB
                    </p>
                  </div>
                </div>
              )}

              {selectedType === "video" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video URL</label>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    YouTube, Loom, Vimeo, or direct video links
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!title || isUploading}
                >
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
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
