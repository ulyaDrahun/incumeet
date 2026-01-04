import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Star,
  AlertTriangle,
  MoreHorizontal,
  Share2,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MeetingCard } from "@/components/dashboard/MeetingCard";
import { UploadModal } from "@/components/upload/UploadModal";
import { ShareFolderModal } from "@/components/folder/ShareFolderModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Folder, Meeting } from "@/types";

const mockFolder: Folder = {
  id: "1",
  name: "Team Meetings",
  parentId: null,
  isStarred: true,
  isUrgent: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  meetingCount: 3,
};

const mockMeetings: Meeting[] = [
  {
    id: "1",
    title: "Q4 Planning Session",
    folderId: "1",
    isStarred: true,
    isUrgent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    updatedAt: new Date(),
    transcript: "",
    summary: {
      shortSummary:
        "Discussed Q4 goals including 20% revenue growth and new product launch timeline.",
      keyDecisions: [],
      actionItems: [],
    },
    sourceType: "text",
  },
  {
    id: "2",
    title: "Weekly Engineering Sync",
    folderId: "1",
    isStarred: false,
    isUrgent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(),
    transcript: "",
    summary: {
      shortSummary:
        "Sprint review and backlog grooming. Addressed tech debt and deployment schedule.",
      keyDecisions: [],
      actionItems: [],
    },
    sourceType: "audio",
  },
  {
    id: "3",
    title: "Product Roadmap Review",
    folderId: "1",
    isStarred: false,
    isUrgent: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    updatedAt: new Date(),
    transcript: "",
    summary: {
      shortSummary:
        "Reviewed upcoming features and prioritized based on customer feedback.",
      keyDecisions: [],
      actionItems: [],
    },
    sourceType: "video",
  },
];

export default function FolderView() {
  const { id } = useParams();
  const [folder, setFolder] = useState<Folder>(mockFolder);
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { toast } = useToast();

  const toggleStar = () => setFolder({ ...folder, isStarred: !folder.isStarred });
  const toggleUrgent = () => setFolder({ ...folder, isUrgent: !folder.isUrgent });

  // Sort newest first
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Meeting CRUD helpers
  const handleMeetingStar = (mid: string) =>
    setMeetings((prev) => prev.map((m) => (m.id === mid ? { ...m, isStarred: !m.isStarred } : m)));

  const handleMeetingUrgent = (mid: string) =>
    setMeetings((prev) => prev.map((m) => (m.id === mid ? { ...m, isUrgent: !m.isUrgent } : m)));

  const handleMeetingRename = (mid: string, title: string) =>
    setMeetings((prev) => prev.map((m) => (m.id === mid ? { ...m, title } : m)));

  const handleMeetingDelete = (mid: string) =>
    setMeetings((prev) => prev.filter((m) => m.id !== mid));

  // Upload handler (mock AI)
  const handleUpload = async (data: {
    title: string;
    type: "text" | "audio" | "video";
    content: string;
    folderId: string;
    newFolderName?: string;
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const newMeeting: Meeting = {
      id: crypto.randomUUID(),
      title: data.title,
      folderId: id || "1",
      isStarred: false,
      isUrgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      transcript: data.content,
      summary: {
        shortSummary: "AI-generated summary placeholder. Enable Cloud for real AI.",
        keyDecisions: ["Decision placeholder"],
        actionItems: ["Action placeholder"],
      },
      sourceType: data.type,
    };
    setMeetings((prev) => [newMeeting, ...prev]);
    setFolder((f) => ({ ...f, meetingCount: f.meetingCount + 1 }));
    toast({ title: "Meeting created", description: `"${data.title}" saved.` });
  };

  // Sharing handler
  const handleShare = async (email: string, permission: "view" | "edit") => {
    // In a real app, this would call your backend
    await new Promise((r) => setTimeout(r, 1000));
    toast({
      title: "Invite sent",
      description: `Shared with ${email} (${permission === "view" ? "View only" : "Can edit"})`,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                {folder.name}
                {folder.isStarred && <Star className="h-6 w-6 fill-starred text-starred" />}
                {folder.isUrgent && <AlertTriangle className="h-6 w-6 fill-urgent text-urgent" />}
              </h1>
              <p className="text-muted-foreground mt-1">
                {folder.meetingCount} meeting{folder.meetingCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={folder.isStarred ? "secondary" : "outline"} size="sm" onClick={toggleStar}>
                <Star className={`h-4 w-4 ${folder.isStarred ? "fill-starred text-starred" : ""}`} />
              </Button>
              <Button variant={folder.isUrgent ? "urgent" : "outline"} size="sm" onClick={toggleUrgent}>
                <AlertTriangle className={`h-4 w-4 ${folder.isUrgent ? "fill-urgent" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Rename</DropdownMenuItem>
                  <DropdownMenuItem>Move</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setUploadModalOpen(true)}>
                <Plus className="h-4 w-4" />
                New Meeting
              </Button>
            </div>
          </div>
        </motion.div>

        {/* View toggle */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        {/* Meetings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {sortedMeetings.length > 0 ? (
            viewMode === "list" ? (
              <div className="flex flex-col gap-3">
                {sortedMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    variant="list"
                    onStar={handleMeetingStar}
                    onUrgent={handleMeetingUrgent}
                    onRename={handleMeetingRename}
                    onDelete={handleMeetingDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onStar={handleMeetingStar}
                    onUrgent={handleMeetingUrgent}
                    onRename={handleMeetingRename}
                    onDelete={handleMeetingDelete}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first meeting to get started.</p>
              <Button onClick={() => setUploadModalOpen(true)}>
                <Plus className="h-4 w-4" />
                New Meeting
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        folders={[folder]}
        defaultFolderId={folder.id}
        onUpload={handleUpload}
      />

      <ShareFolderModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        folderName={folder.name}
        onShare={handleShare}
      />
    </AppLayout>
  );
}
