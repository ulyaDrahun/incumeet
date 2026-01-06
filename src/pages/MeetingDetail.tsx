import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  AlertTriangle,
  Mail,
  FileText,
  Edit3,
  Check,
  X,
  Loader2,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/contexts/FoldersContext";
import type { MeetingSummary } from "@/types";

export default function MeetingDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const {
    getMeetingById,
    getFolderById,
    updateMeeting,
    toggleMeetingStar,
    toggleMeetingUrgent,
    generateSummary,
  } = useFolders();

  const meeting = getMeetingById(id || "");
  const folder = meeting ? getFolderById(meeting.folderId) : undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState<MeetingSummary | null>(
    meeting?.summary || null
  );
  const [showTranscript, setShowTranscript] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `Meeting Summary: ${meeting?.title || ""}`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(meeting?.title || "");

  useEffect(() => {
    if (meeting?.summary) {
      setEditedSummary(meeting.summary);
    }
    if (meeting?.title) {
      setEditTitle(meeting.title);
      setEmailSubject(`Meeting Summary: ${meeting.title}`);
    }
  }, [meeting?.summary, meeting?.title]);

  if (!meeting) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <p className="text-muted-foreground">Meeting not found.</p>
          <Link to="/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleSave = () => {
    if (editedSummary) {
      updateMeeting(meeting.id, { summary: editedSummary });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSummary(meeting.summary);
    setIsEditing(false);
  };

  const toggleStar = () => {
    toggleMeetingStar(meeting.id);
  };

  const toggleUrgent = () => {
    toggleMeetingUrgent(meeting.id);
  };

  const handleGenerateSummary = async () => {
    if (!meeting.transcript || meeting.transcript.trim().length === 0) {
      toast({
        title: "No transcript",
        description: "Please add a transcript first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateSummary(meeting.id, meeting.transcript);
      toast({
        title: "Summary generated",
        description: "Your meeting summary is ready.",
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Failed to generate summary",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const commitTitleRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== meeting.title) {
      updateMeeting(meeting.id, { title: trimmed });
    } else {
      setEditTitle(meeting.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTitleRename();
    } else if (e.key === "Escape") {
      setEditTitle(meeting.title);
      setIsEditingTitle(false);
    }
  };

  const generateEmailBody = () => {
    if (!meeting.summary) return "";
    return `Hi,

Here's a summary of our meeting: ${meeting.title}

SUMMARY
${meeting.summary.shortSummary}

KEY DECISIONS
${meeting.summary.keyDecisions.map((d) => `• ${d}`).join("\n")}

ACTION ITEMS
${meeting.summary.actionItems.map((a) => `• ${a}`).join("\n")}

Best regards`;
  };

  const backLink = folder ? `/folder/${folder.id}` : "/dashboard";
  const backLabel = folder ? `Back to ${folder.name}` : "Back to Dashboard";

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to={backLink}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={commitTitleRename}
                  onKeyDown={handleTitleKeyDown}
                  className="text-2xl md:text-3xl font-bold h-auto py-1 max-w-md"
                  autoFocus
                />
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    {meeting.title}
                    {meeting.isStarred && (
                      <Star className="h-6 w-6 fill-starred text-starred" />
                    )}
                    {meeting.isUrgent && (
                      <AlertTriangle className="h-6 w-6 text-urgent" />
                    )}
                  </h1>
                  <button
                    onClick={() => {
                      setEditTitle(meeting.title);
                      setIsEditingTitle(true);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Rename meeting"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={meeting.isStarred ? "secondary" : "outline"}
                size="sm"
                onClick={toggleStar}
              >
                <Star
                  className={`h-4 w-4 ${
                    meeting.isStarred ? "fill-starred text-starred" : ""
                  }`}
                />
              </Button>
              <Button
                variant={meeting.isUrgent ? "urgent" : "outline"}
                size="sm"
                onClick={toggleUrgent}
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranscript(true)}
              >
                <FileText className="h-4 w-4" />
                View Transcript
              </Button>
              <Button size="sm" onClick={() => setShowEmailModal(true)}>
                <Mail className="h-4 w-4" />
                Email Summary
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Created {meeting.createdAt.toLocaleDateString()} •{" "}
            {meeting.sourceType === "text"
              ? "Text transcript"
              : meeting.sourceType === "audio"
              ? "Audio recording"
              : "Video"}
          </p>
        </motion.div>

        {/* Summary Section */}
        {meeting.summary ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Edit Toggle */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate
              </Button>
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {/* Short Summary */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-3">Summary</h2>
              {isEditing ? (
                <Textarea
                  value={editedSummary?.shortSummary || ""}
                  onChange={(e) =>
                    setEditedSummary({
                      ...editedSummary!,
                      shortSummary: e.target.value,
                    })
                  }
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {meeting.summary.shortSummary}
                </p>
              )}
            </div>

            {/* Key Decisions */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-3">Key Decisions</h2>
              {isEditing ? (
                <Textarea
                  value={editedSummary?.keyDecisions.join("\n") || ""}
                  onChange={(e) =>
                    setEditedSummary({
                      ...editedSummary!,
                      keyDecisions: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  placeholder="One decision per line"
                  className="min-h-[150px]"
                />
              ) : (
                <ul className="space-y-2">
                  {meeting.summary.keyDecisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span className="text-muted-foreground">{decision}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Action Items */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-3">Action Items</h2>
              {isEditing ? (
                <Textarea
                  value={editedSummary?.actionItems.join("\n") || ""}
                  onChange={(e) =>
                    setEditedSummary({
                      ...editedSummary!,
                      actionItems: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  placeholder="One action item per line"
                  className="min-h-[150px]"
                />
              ) : (
                <ul className="space-y-2">
                  {meeting.summary.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-8 shadow-card text-center"
          >
            <h2 className="text-lg font-semibold mb-2">No Summary Yet</h2>
            <p className="text-muted-foreground mb-4">
              Generate an AI summary from your transcript.
            </p>
            <Button onClick={handleGenerateSummary} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Transcript Modal */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Full Transcript</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm font-sans text-muted-foreground bg-muted p-4 rounded-lg">
              {meeting.transcript || "No transcript available."}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <Input
                placeholder="email@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Body</label>
              <Textarea
                value={generateEmailBody()}
                className="min-h-[300px] font-mono text-sm"
                readOnly
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowEmailModal(false);
                }}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
