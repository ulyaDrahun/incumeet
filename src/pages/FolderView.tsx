import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Star, Pin, MoreHorizontal, Share2, LayoutGrid, LayoutList, Pencil } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MeetingCard } from "@/components/dashboard/MeetingCard";
import { UploadModal } from "@/components/upload/UploadModal";
import { ShareFolderModal } from "@/components/folder/ShareFolderModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/contexts/FoldersContext";

export default function FolderView() {
  const { id } = useParams();
  const { toast } = useToast();
  const { folders, getFolderById, getMeetingsByFolder, toggleFolderStar, toggleFolderPinned, updateFolder, deleteFolder, toggleMeetingStar, toggleMeetingPinned, updateMeeting, deleteMeeting } = useFolders();

  const folder = getFolderById(id || "");
  const meetings = getMeetingsByFolder(id || "");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder?.name || "");

  if (!folder) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <p className="text-muted-foreground">Folder not found.</p>
          <Link to="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </AppLayout>
    );
  }

  const sortedMeetings = [...meetings].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleStar = () => toggleFolderStar(folder.id);
  const togglePin = () => toggleFolderPinned(folder.id);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) updateFolder(folder.id, { name: trimmed });
    else setEditName(folder.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
    else if (e.key === "Escape") { setEditName(folder.name); setIsEditing(false); }
  };

  const handleShare = async (email: string, permission: "view" | "edit") => {
    await new Promise((r) => setTimeout(r, 1000));
    toast({ title: "Invite sent", description: `Shared with ${email} (${permission === "view" ? "View only" : "Can edit"})` });
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={commitRename} onKeyDown={handleKeyDown} className="text-2xl md:text-3xl font-bold h-auto py-1 max-w-xs" autoFocus />
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    {folder.name}
                    {folder.isStarred && <Star className="h-6 w-6 fill-starred text-starred" />}
                    {folder.isPinned && <Pin className="h-6 w-6 fill-pinned text-pinned" />}
                  </h1>
                  <button onClick={() => { setEditName(folder.name); setIsEditing(true); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Rename folder">
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant={folder.isStarred ? "secondary" : "outline"} size="sm" onClick={toggleStar}>
                <Star className={`h-4 w-4 ${folder.isStarred ? "fill-starred text-starred" : ""}`} />
              </Button>
              <Button variant={folder.isPinned ? "secondary" : "outline"} size="sm" onClick={togglePin}>
                <Pin className={`h-4 w-4 ${folder.isPinned ? "fill-pinned text-pinned" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}><Share2 className="h-4 w-4" />Share</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setEditName(folder.name); setIsEditing(true); }}>Rename</DropdownMenuItem>
                  <DropdownMenuItem>Move</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteFolder(folder.id)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setUploadModalOpen(true)}><Plus className="h-4 w-4" />New Meeting</Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">{folder.meetingCount} meeting{folder.meetingCount !== 1 ? "s" : ""}</p>
        </motion.div>

        <div className="flex items-center justify-end gap-2 mb-4">
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("list")} aria-label="List view"><LayoutList className="h-4 w-4" /></Button>
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("grid")} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {sortedMeetings.length > 0 ? (
            viewMode === "list" ? (
              <div className="flex flex-col gap-3">
                {sortedMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} variant="list" onStar={toggleMeetingStar} onPin={toggleMeetingPinned} onRename={(id, title) => updateMeeting(id, { title })} onDelete={deleteMeeting} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} onStar={toggleMeetingStar} onPin={toggleMeetingPinned} onRename={(id, title) => updateMeeting(id, { title })} onDelete={deleteMeeting} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><Plus className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first meeting to get started.</p>
              <Button onClick={() => setUploadModalOpen(true)}><Plus className="h-4 w-4" />New Meeting</Button>
            </div>
          )}
        </motion.div>
      </div>
      <UploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} folders={folders} defaultFolderId={folder.id} />
      <ShareFolderModal open={shareModalOpen} onOpenChange={setShareModalOpen} folderName={folder.name} onShare={handleShare} />
    </AppLayout>
  );
}
