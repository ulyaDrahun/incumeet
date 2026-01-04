import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Folder, Star, AlertTriangle, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
}

export function FolderCard({
  folder,
  onStar,
  onUrgent,
  onRename,
  onDelete,
}: FolderCardProps) {
  const [isEditing, setIsEditing] = useState(folder.name === "New Folder");
  const [editName, setEditName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) {
      onRename?.(folder.id, trimmed);
    } else {
      setEditName(folder.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="group relative bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer">
        {/* Status Indicators */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {folder.isStarred && (
            <Star className="h-4 w-4 fill-starred text-starred" />
          )}
          {folder.isUrgent && (
            <AlertTriangle className="h-4 w-4 fill-urgent text-urgent" />
          )}
        </div>

        {/* Folder Icon */}
        <Link to={`/folder/${folder.id}`} className="block">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Folder className="h-6 w-6 text-primary" />
          </div>
        </Link>

        {/* Content */}
        <div className="flex items-center gap-1.5 pr-8">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm font-semibold px-1"
            />
          ) : (
            <>
              <Link to={`/folder/${folder.id}`} className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {folder.name}
                </h3>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="Rename folder"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </>
          )}
        </div>
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
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
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
    </motion.div>
  );
}
