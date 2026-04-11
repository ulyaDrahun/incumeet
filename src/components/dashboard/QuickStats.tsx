import { motion } from "framer-motion";
import { Folder, FileText } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl border border-border p-4 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface QuickStatsProps {
  folderCount: number;
  meetingCount: number;
}

export function QuickStats({
  folderCount,
  meetingCount,
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        icon={<Folder className="h-5 w-5 text-primary" />}
        label="Folders"
        value={folderCount}
        color="bg-primary/10"
      />
      <StatCard
        icon={<FileText className="h-5 w-5 text-success" />}
        label="Total Meetings"
        value={meetingCount}
        color="bg-success/10"
      />
    </div>
  );
}
