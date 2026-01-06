import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Folder,
  FolderPlus,
  Home,
  Star,
  AlertTriangle,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFolders } from "@/contexts/FoldersContext";
import type { Folder as FolderType } from "@/types";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: React.ReactNode;
}

function SidebarItem({ icon, label, href, isActive, badge }: SidebarItemProps) {
  return (
    <Link to={href}>
      <motion.div
        whileHover={{ x: 2 }}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        {icon}
        <span className="flex-1">{label}</span>
        {badge}
      </motion.div>
    </Link>
  );
}

interface FolderItemProps {
  folder: FolderType;
  isActive?: boolean;
}

function FolderItem({ folder, isActive }: FolderItemProps) {
  return (
    <Link to={`/folder/${folder.id}`}>
      <motion.div
        whileHover={{ x: 2 }}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Folder className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate font-medium">{folder.name}</span>
        <div className="flex items-center gap-1">
          {folder.isStarred && (
            <Star className="h-3 w-3 fill-starred text-starred" />
          )}
          {folder.isUrgent && (
            <AlertTriangle className="h-3 w-3 text-urgent" />
          )}
          <span className="text-xs text-muted-foreground">
            {folder.meetingCount}
          </span>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </motion.div>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { folders, createFolder } = useFolders();

  const handleNewFolder = () => {
    createFolder("New Folder");
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">I</span>
          </div>
          <span className="font-semibold text-lg">Incumeet</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <SidebarItem
          icon={<Home className="h-4 w-4" />}
          label="Dashboard"
          href="/dashboard"
          isActive={location.pathname === "/dashboard"}
        />
        <SidebarItem
          icon={<Star className="h-4 w-4" />}
          label="Starred"
          href="/starred"
          isActive={location.pathname === "/starred"}
        />
        <SidebarItem
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Urgent"
          href="/urgent"
          isActive={location.pathname === "/urgent"}
        />

        {/* Folders Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Folders
            </span>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={handleNewFolder}>
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-0.5">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                isActive={location.pathname === `/folder/${folder.id}`}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <SidebarItem
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          href="/settings"
          isActive={location.pathname === "/settings"}
        />
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
