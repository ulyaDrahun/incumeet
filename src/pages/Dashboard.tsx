import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FolderPlus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FolderCard } from "@/components/dashboard/FolderCard";
import { MeetingCard } from "@/components/dashboard/MeetingCard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { UploadModal } from "@/components/upload/UploadModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFolders } from "@/contexts/FoldersContext";

export default function Dashboard() {
  const {
    folders,
    meetings,
    createFolder,
    toggleFolderStar,
    toggleFolderPinned,
    updateFolder,
    deleteFolder,
    toggleMeetingStar,
    toggleMeetingPinned,
    updateMeeting,
    deleteMeeting,
  } = useFolders();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort folders and meetings with pinned items first
  const sortedFolders = [...folders].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const sortedMeetings = [...meetings].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const stats = {
    folderCount: folders.length,
    meetingCount: meetings.length,
    starredCount:
      folders.filter((f) => f.isStarred).length +
      meetings.filter((m) => m.isStarred).length,
    pinnedCount:
      folders.filter((f) => f.isPinned).length +
      meetings.filter((m) => m.isPinned).length,
  };

  const handleNewFolderClick = () => {
    createFolder("New Folder");
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your meetings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Meeting
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <QuickStats {...stats} />
        </motion.div>

        {/* Folders Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Folders</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleNewFolderClick}
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onStar={toggleFolderStar}
                onPin={toggleFolderPinned}
                onRename={(id, name) => updateFolder(id, { name })}
                onDelete={deleteFolder}
              />
            ))}
          </div>
        </motion.section>

        {/* Recent Meetings Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Meetings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onStar={toggleMeetingStar}
                onPin={toggleMeetingPinned}
                onRename={(id, title) => updateMeeting(id, { title })}
                onDelete={deleteMeeting}
              />
            ))}
          </div>
        </motion.section>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        folders={folders}
      />
    </AppLayout>
  );
}
