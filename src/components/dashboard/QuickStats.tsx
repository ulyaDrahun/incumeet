import { motion } from "framer-motion";
import { Folder, FileText, Pin, Eye } from "lucide-react";
import { PinnedSheet } from "./PinnedSheet";
import { useFolders } from "@/contexts/FoldersContext";
import { Button } from "@/components/ui/button";

interface QuickStatsProps {
  folderCount: number;
  meetingCount: number;
}

export function QuickStats({
  folderCount,
  meetingCount,
}: QuickStatsProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Info-only stats — no borders, just plain text */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <Folder className="h-4 w-4 text-primary" />
        <span className="text-2xl font-bold">{folderCount}</span>
        <span className="text-sm text-muted-foreground">Folders</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4 text-success" />
        <span className="text-2xl font-bold">{meetingCount}</span>
        <span className="text-sm text-muted-foreground">Total Meetings</span>
      </motion.div>

      {/* View Pinned — styled as a clear button */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ml-auto"
      >
        <PinnedSheet>
          <Button variant="outline" size="sm" className="gap-2">
            <Pin className="h-4 w-4 text-pinned" />
            View Pinned
          </Button>
        </PinnedSheet>
      </motion.div>
    </div>
  );
}
