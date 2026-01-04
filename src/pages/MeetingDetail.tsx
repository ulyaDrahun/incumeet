import { useState } from "react";
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
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Meeting, MeetingSummary } from "@/types";

const mockMeeting: Meeting = {
  id: "1",
  title: "Q4 Planning Session",
  folderId: "1",
  isStarred: true,
  isUrgent: false,
  createdAt: new Date(Date.now() - 1000 * 60 * 30),
  updatedAt: new Date(),
  transcript: `John: Good morning everyone, let's get started with our Q4 planning session.

Sarah: Thanks John. I've prepared the revenue projections for Q4. We're looking at a potential 20% growth if we hit our targets.

John: That's ambitious but achievable. What about the product roadmap?

Mike: We're planning to launch the new analytics dashboard by mid-November. The beta testing is going well.

Sarah: That should definitely help with enterprise sales. The dashboard was the most requested feature.

John: Let's make sure we have enough support resources ready for the launch.

Mike: Already on it. We're bringing in two additional support engineers.

John: Perfect. Any blockers we should address?

Sarah: The only concern is the holiday season. We might see slower response times from prospects.

John: Good point. Let's front-load our outreach efforts. Anything else?

Mike: I think we're in good shape. Let's sync again next week to review progress.

John: Sounds good. Meeting adjourned.`,
  summary: {
    shortSummary:
      "The team discussed Q4 planning with a focus on achieving 20% revenue growth. Key initiatives include launching the analytics dashboard by mid-November and preparing for the holiday season impact on sales cycles.",
    keyDecisions: [
      "Target 20% revenue growth for Q4",
      "Launch analytics dashboard by mid-November",
      "Hire two additional support engineers for launch",
      "Front-load outreach efforts before holiday season",
    ],
    actionItems: [
      "Sarah to finalize revenue projections and share with team",
      "Mike to complete beta testing for analytics dashboard",
      "Mike to onboard new support engineers before launch",
      "Sales team to accelerate outreach before holidays",
      "Schedule follow-up sync for next week",
    ],
  },
  sourceType: "text",
};

export default function MeetingDetail() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState<Meeting>(mockMeeting);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState<MeetingSummary | null>(
    meeting.summary
  );
  const [showTranscript, setShowTranscript] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `Meeting Summary: ${meeting.title}`
  );

  const handleSave = () => {
    if (editedSummary) {
      setMeeting({ ...meeting, summary: editedSummary });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSummary(meeting.summary);
    setIsEditing(false);
  };

  const toggleStar = () => {
    setMeeting({ ...meeting, isStarred: !meeting.isStarred });
  };

  const toggleUrgent = () => {
    setMeeting({ ...meeting, isUrgent: !meeting.isUrgent });
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
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                {meeting.title}
                {meeting.isStarred && (
                  <Star className="h-6 w-6 fill-starred text-starred" />
                )}
                {meeting.isUrgent && (
                  <AlertTriangle className="h-6 w-6 text-urgent" />
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                Created {meeting.createdAt.toLocaleDateString()} •{" "}
                {meeting.sourceType === "text"
                  ? "Text transcript"
                  : meeting.sourceType === "audio"
                  ? "Audio recording"
                  : "Video"}
              </p>
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
        </motion.div>

        {/* Summary Section */}
        {meeting.summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Edit Toggle */}
            <div className="flex items-center justify-end gap-2">
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
              {meeting.transcript}
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
                  // In a real app, this would send the email
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
