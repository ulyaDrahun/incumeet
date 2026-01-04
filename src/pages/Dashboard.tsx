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
import type { Folder, Meeting } from "@/types";

const mockFolders: Folder[] = [
  {
    id: "1",
    name: "Team Meetings",
    parentId: null,
    isStarred: true,
    isUrgent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 5,
  },
  {
    id: "2",
    name: "Client Calls",
    parentId: null,
    isStarred: false,
    isUrgent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 3,
  },
  {
    id: "3",
    name: "1:1 Sessions",
    parentId: null,
    isStarred: false,
    isUrgent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 8,
  },
  {
    id: "4",
    name: "Product Reviews",
    parentId: null,
    isStarred: true,
    isUrgent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 2,
  },
];

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
        "Discussed Q4 goals including 20% revenue growth and new product launch timeline. Team aligned on priorities.",
      keyDecisions: [],
      actionItems: [],
    },
    sourceType: "text",
  },
  {
    id: "2",
    title: "Client Onboarding - Acme Corp",
    folderId: "2",
    isStarred: false,
    isUrgent: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(),
    transcript: "",
    summary: {
      shortSummary:
        "Onboarding call with Acme Corp. Covered integration requirements and timeline expectations.",
      keyDecisions: [],
      actionItems: [],
    },
    sourceType: "audio",
  },
  {
    id: "3",
    title: "Weekly Engineering Sync",
    folderId: "1",
    isStarred: false,
    isUrgent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(),
    transcript: "",
    summary: {
      shortSummary:
        "Sprint review and backlog grooming. Addressed tech debt items and deployment schedule.",
      keyDecisions: [],
      actionItems: [],
    },
    sourceType: "video",
  },
];

export default function Dashboard() {
  const [folders] = useState<Folder[]>(mockFolders);
  const [meetings] = useState<Meeting[]>(mockMeetings);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const stats = {
    folderCount: folders.length,
    meetingCount: meetings.length,
    starredCount:
      folders.filter((f) => f.isStarred).length +
      meetings.filter((m) => m.isStarred).length,
    urgentCount:
      folders.filter((f) => f.isUrgent).length +
      meetings.filter((m) => m.isUrgent).length,
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
            <Button variant="ghost" size="sm" className="gap-2">
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <FolderCard key={folder.id} folder={folder} />
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
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </motion.section>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />
    </AppLayout>
  );
}
