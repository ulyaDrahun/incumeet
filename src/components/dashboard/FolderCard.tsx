import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Folder, Star, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Folder as FolderType } from "@/types";

interface FolderCardProps {
  folder: FolderType;
  onStar?: (id: string) => void;
  onUrgent?: (id: string) => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function FolderCard({
  folder,
  onStar,
  onUrgent,
  onRename,
  onDelete,
}: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/folder/${folder.id}`}>
        <div className="group relative bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer">
          {/* Status Indicators */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {folder.isStarred && (
              <Star className="h-4 w-4 fill-starred text-starred" />
            )}
            {folder.isUrgent && (
              <AlertTriangle className="h-4 w-4 text-urgent" />
            )}
          </div>

          {/* Folder Icon */}
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Folder className="h-6 w-6 text-primary" />
          </div>

          {/* Content */}
          <h3 className="font-semibold text-foreground truncate pr-8">
            {folder.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {folder.meetingCount} meeting{folder.meetingCount !== 1 ? "s" : ""}
          </p>

          {/* Actions Menu */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStar?.(folder.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  {folder.isStarred ? "Unstar" : "Star"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUrgent?.(folder.id)}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {folder.isUrgent ? "Remove Urgent" : "Mark Urgent"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRename?.(folder.id)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(folder.id)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
