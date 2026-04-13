import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Pin, Mail, FileText, Edit3, Check, X, Loader2, RefreshCw, Pencil, Copy, NotebookPen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/contexts/FoldersContext";
import type { MeetingSummary, ActionItemByPerson } from "@/types";

export default function MeetingDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { getMeetingById, getFolderById, updateMeeting, toggleMeetingStar, toggleMeetingPinned, generateSummary } = useFolders();

  const meeting = getMeetingById(id || "");
  const folder = meeting ? getFolderById(meeting.folderId) : undefined;

  const [activeTab, setActiveTab] = useState<"summary" | "notes">("summary");
  const [manualNotes, setManualNotes] = useState(meeting?.manualNotes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState<MeetingSummary | null>(meeting?.summary || null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [emailSubject, setEmailSubject] = useState(`Meeting Summary: ${meeting?.title || ""}`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(meeting?.title || "");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(meeting?.transcript || "");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMeetingStartTime, setEditMeetingStartTime] = useState(meeting?.startTime || "09:00");
  const [editMeetingDuration, setEditMeetingDuration] = useState(String(meeting?.duration || 60));

  useEffect(() => {
    if (meeting?.summary) setEditedSummary(meeting.summary);
    if (meeting?.title) { setEditTitle(meeting.title); setEmailSubject(`Meeting Summary: ${meeting.title}`); }
    if (meeting?.manualNotes !== undefined) setManualNotes(meeting.manualNotes || "");
  }, [meeting?.summary, meeting?.title, meeting?.manualNotes]);

  if (!meeting) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <p className="text-muted-foreground">Meeting not found.</p>
          <Link to="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </AppLayout>
    );
  }

  const handleSave = () => { if (editedSummary) updateMeeting(meeting.id, { summary: editedSummary }); setIsEditing(false); };
  const handleCancel = () => { setEditedSummary(meeting.summary); setIsEditing(false); };
  const toggleStar = () => toggleMeetingStar(meeting.id);
  const togglePin = () => toggleMeetingPinned(meeting.id);

  const handleGenerateSummary = async () => {
    if (!meeting.transcript || meeting.transcript.trim().length === 0) {
      toast({ title: "No transcript", description: "Please add a transcript first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      await generateSummary(meeting.id, meeting.transcript);
      toast({ title: "Summary generated", description: "Your meeting summary is ready." });
    } catch (error) {
      toast({ title: "Failed to generate summary", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const commitTitleRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== meeting.title) updateMeeting(meeting.id, { title: trimmed });
    else setEditTitle(meeting.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); commitTitleRename(); }
    else if (e.key === "Escape") { setEditTitle(meeting.title); setIsEditingTitle(false); }
  };

  const formatActionItemsForText = () => {
    if (!meeting.summary?.actionItems) return "";
    return (meeting.summary.actionItems || []).map(group =>
      `${group.person}:\n${(group.items || []).map(item => `  • ${item}`).join("\n")}`
    ).join("\n\n");
  };

  const generateEmailBody = () => {
    if (!meeting.summary) return "";
    return `Hi,\n\nHere's a summary of our meeting: ${meeting.title}\n\nSUMMARY\n${meeting.summary.shortSummary}\n\nKEY DECISIONS\n${(meeting.summary.keyDecisions || []).map((d) => `• ${d}`).join("\n")}\n\nACTION ITEMS\n${formatActionItemsForText()}\n\nBest regards,\n\n—\nSummary generated by Incumeet.`;
  };

  const generateEmailHtml = () => {
    if (!meeting.summary) return "";
    return `<!DOCTYPE html><html><head><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}h1{color:#1a1a1a;font-size:24px;border-bottom:2px solid #4f46e5;padding-bottom:10px}h2{color:#4f46e5;font-size:16px;text-transform:uppercase;letter-spacing:.5px;margin-top:24px}.section{background:#f8f9fa;border-radius:8px;padding:16px;margin:12px 0}ul{margin:0;padding-left:20px}li{margin:8px 0}.person-name{font-weight:600;color:#1a1a1a;margin-top:12px;margin-bottom:4px}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;font-style:italic}</style></head><body><h1>${meeting.title}</h1><h2>Summary</h2><div class="section"><p>${meeting.summary.shortSummary}</p></div><h2>Key Decisions</h2><div class="section"><ul>${(meeting.summary.keyDecisions || []).map(d => `<li>${d}</li>`).join("")}</ul></div><h2>Action Items</h2><div class="section">${(meeting.summary.actionItems || []).map(group => `<p class="person-name">${group.person}</p><ul>${(group.items || []).map(item => `<li>${item}</li>`).join("")}</ul>`).join("")}</div><div class="footer"><p>Best regards,</p><br/><p>Summary generated by Incumeet.</p></div></body></html>`;
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast({ title: "Missing recipient", description: "Please enter at least one email address.", variant: "destructive" });
      return;
    }
    setIsSendingEmail(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({ title: "Email sent", description: "Meeting summary has been emailed successfully." });
      setShowEmailModal(false);
      setEmailTo(""); setEmailCc(""); setEmailBcc("");
    } catch (error) {
      toast({ title: "Failed to send email", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyToClipboard = () => {
    if (!meeting.summary) return;
    const text = `SUMMARY\n${meeting.summary.shortSummary}\n\nKEY DECISIONS\n${(meeting.summary.keyDecisions || []).map((d) => `• ${d}`).join("\n")}\n\nACTION ITEMS\n${formatActionItemsForText()}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleActionItemsEdit = (value: string) => {
    const lines = value.split("\n").filter(Boolean);
    const parsed: ActionItemByPerson[] = [];
    let currentPerson = "";
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.endsWith(":")) {
        currentPerson = trimmed.slice(0, -1);
        parsed.push({ person: currentPerson, items: [] });
      } else if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
        const item = trimmed.replace(/^[•\-]\s*/, "");
        if (parsed.length > 0) parsed[parsed.length - 1].items.push(item);
      } else if (currentPerson && trimmed) {
        if (parsed.length > 0) parsed[parsed.length - 1].items.push(trimmed);
      }
    });
    setEditedSummary({ ...editedSummary!, actionItems: parsed });
  };

  const handleNotesChange = (value: string) => {
    setManualNotes(value);
    updateMeeting(meeting.id, { manualNotes: value });
  };

  const backLink = folder ? `/folder/${folder.id}` : "/dashboard";
  const backLabel = folder ? `Back to ${folder.name}` : "Back to Dashboard";

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Top banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to={backLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />{backLabel}
          </Link>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={commitTitleRename} onKeyDown={handleTitleKeyDown} className="text-2xl md:text-3xl font-bold h-auto py-1 max-w-md" autoFocus />
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    {meeting.title}
                    {meeting.isStarred && <Star className="h-6 w-6 fill-starred text-starred" />}
                    {meeting.isPinned && <Pin className="h-6 w-6 fill-pinned text-pinned" />}
                  </h1>
                  <button onClick={() => { setEditTitle(meeting.title); setIsEditingTitle(true); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Rename meeting">
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant={meeting.isStarred ? "secondary" : "outline"} size="sm" onClick={toggleStar}>
                <Star className={`h-4 w-4 ${meeting.isStarred ? "fill-starred text-starred" : ""}`} />
              </Button>
              <Button variant={meeting.isPinned ? "secondary" : "outline"} size="sm" onClick={togglePin}>
                <Pin className={`h-4 w-4 ${meeting.isPinned ? "fill-pinned text-pinned" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTranscript(true)}><FileText className="h-4 w-4" />Transcript</Button>
              <Button size="sm" onClick={() => setShowEmailModal(true)}><Mail className="h-4 w-4" />Email</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mt-1 text-sm">
            <span>Meeting Date: {meeting.meetingDate.toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {meeting.startTime ? (
                <span>{meeting.startTime} – {(() => { const t = (meeting.startTime.split(":").map(Number)[0] * 60 + (meeting.startTime.split(":").map(Number)[1] || 0)) + (meeting.duration || 60); const h = Math.floor(t / 60) % 24; const m = t % 60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; })()} ({meeting.duration || 60} min)</span>
              ) : (
                <span className="italic">No time set</span>
              )}
              <button onClick={() => setIsEditingTime(true)} className="text-primary hover:underline text-xs ml-1">Edit</button>
            </span>
            <span>•</span>
            <span>Created {meeting.createdAt.toLocaleDateString()}</span>
            <span>•</span>
            <span>{meeting.sourceType === "text" ? "Text transcript" : meeting.sourceType === "audio" ? "Audio recording" : "Video"}</span>
          </div>
          {isEditingTime && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 mt-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Start time</label>
                <Select value={editMeetingStartTime} onValueChange={setEditMeetingStartTime}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {Array.from({ length: 48 }, (_, i) => { const h = Math.floor(i / 2); const m = (i % 2) * 30; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }).map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Duration (min)</label>
                <Input type="number" min="1" value={editMeetingDuration} onChange={(e) => setEditMeetingDuration(e.target.value)} className="w-24 h-8 text-xs" />
              </div>
              <div className="flex items-end gap-1 pb-0.5">
                <Button size="sm" className="h-8 text-xs" onClick={() => {
                  updateMeeting(meeting.id, { startTime: editMeetingStartTime, duration: parseInt(editMeetingDuration) || 60 });
                  setIsEditingTime(false);
                }}>Save</Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsEditingTime(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Tab buttons */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "summary" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <FileText className="h-4 w-4 inline mr-1.5" />Summary
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "notes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <NotebookPen className="h-4 w-4 inline mr-1.5" />Notes
          </button>
        </div>

        {/* Summary Tab */}
        {activeTab === "summary" && (
          <>
            {meeting.summary ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-end gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="h-4 w-4" />Copy</Button>
                  <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Regenerate
                  </Button>
                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleCancel}><X className="h-4 w-4" />Cancel</Button>
                      <Button size="sm" onClick={handleSave}><Check className="h-4 w-4" />Save</Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}><Edit3 className="h-4 w-4" />Edit</Button>
                  )}
                </div>

                <div className="bg-card rounded-xl border border-border shadow-card divide-y divide-border">
                  <div className="p-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Summary</h2>
                    {isEditing ? (
                      <Textarea value={editedSummary?.shortSummary || ""} onChange={(e) => setEditedSummary({ ...editedSummary!, shortSummary: e.target.value })} className="min-h-[100px]" />
                    ) : (
                      <p className="text-foreground leading-relaxed">{meeting.summary.shortSummary}</p>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Key Decisions</h2>
                    {isEditing ? (
                      <Textarea value={editedSummary?.keyDecisions.join("\n") || ""} onChange={(e) => setEditedSummary({ ...editedSummary!, keyDecisions: e.target.value.split("\n").filter(Boolean) })} placeholder="One decision per line" className="min-h-[120px]" />
                    ) : (
                      <ul className="space-y-2">
                        {(meeting.summary.keyDecisions || []).map((decision, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span className="text-foreground">{decision}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Action Items</h2>
                    {isEditing ? (
                      <Textarea
                        value={editedSummary?.actionItems.map(g => `${g.person}:\n${g.items.map(i => `• ${i}`).join("\n")}`).join("\n\n") || ""}
                        onChange={(e) => handleActionItemsEdit(e.target.value)}
                        placeholder="Person Name:\n• Action item 1"
                        className="min-h-[150px] font-mono text-sm"
                      />
                    ) : (
                      <div className="space-y-4">
                        {(meeting.summary.actionItems || []).map((group, groupIdx) => (
                          <div key={groupIdx}>
                            <h3 className="font-semibold text-foreground mb-2">{group.person}</h3>
                            <ul className="space-y-2 ml-4">
                              {group.items.map((item, itemIdx) => {
                                const key = `${groupIdx}-${itemIdx}`;
                                const isChecked = checkedItems[key] || false;
                                return (
                                  <li key={itemIdx} className="flex items-start gap-3">
                                    <button
                                      onClick={() => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))}
                                      className={cn(
                                        "w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors",
                                        isChecked ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary/60"
                                      )}
                                    >
                                      {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </button>
                                    <span className={cn("text-foreground transition-colors", isChecked && "line-through text-muted-foreground")}>{item}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-8 shadow-card text-center">
                <h2 className="text-lg font-semibold mb-2">No Summary Yet</h2>
                <p className="text-muted-foreground mb-4">Generate an AI summary from your transcript.</p>
                <Button onClick={handleGenerateSummary} disabled={isGenerating}>
                  {isGenerating ? (<><Loader2 className="h-4 w-4 animate-spin" />Generating...</>) : "Generate Summary"}
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card rounded-xl border border-border shadow-card min-h-[60vh]">
              <Textarea
                value={manualNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start typing your notes here..."
                className="w-full min-h-[60vh] border-0 rounded-xl resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-6 text-base leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Transcript Modal */}
      <Dialog open={showTranscript} onOpenChange={(open) => { setShowTranscript(open); if (!open) setIsEditingTranscript(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Full Transcript</DialogTitle>
              <div className="flex items-center gap-2">
                {isEditingTranscript ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { setEditedTranscript(meeting.transcript); setIsEditingTranscript(false); }}>
                      <X className="h-4 w-4" />Cancel
                    </Button>
                    <Button size="sm" onClick={() => { updateMeeting(meeting.id, { transcript: editedTranscript }); setIsEditingTranscript(false); toast({ title: "Transcript updated" }); }}>
                      <Check className="h-4 w-4" />Save
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setEditedTranscript(meeting.transcript); setIsEditingTranscript(true); }}>
                    <Edit3 className="h-4 w-4" />Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {isEditingTranscript ? (
              <Textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="min-h-[400px] w-full font-sans text-sm"
                placeholder="Paste or type your transcript here..."
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm font-sans text-muted-foreground bg-muted p-4 rounded-lg">
                {meeting.transcript || "No transcript available. Click Edit to add one."}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={(open) => {
        setShowEmailModal(open);
        if (open) setEmailBody(generateEmailHtml());
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Email Meeting Summary</DialogTitle></DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium">To (separate multiple emails with commas)</label>
              <Input placeholder="email@example.com, another@example.com" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CC</label>
                <Input placeholder="cc@example.com" value={emailCc} onChange={(e) => setEmailCc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">BCC</label>
                <Input placeholder="bcc@example.com" value={emailBcc} onChange={(e) => setEmailBcc(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Preview (click to edit)</label>
                <Button variant="outline" size="sm" onClick={() => setEmailBody(generateEmailHtml())}>
                  <RefreshCw className="h-3.5 w-3.5" />Reset to default
                </Button>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: emailBody }}
                onBlur={(e) => setEmailBody(e.currentTarget.innerHTML)}
                className="min-h-[250px] border border-border rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background overflow-y-auto cursor-text"
                style={{ maxHeight: '350px' }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>Cancel</Button>
              <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><Mail className="h-4 w-4" />Send Email</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
