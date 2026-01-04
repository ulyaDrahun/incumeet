import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Star,
  AlertTriangle,
  MoreHorizontal,
  Calendar,
  Mic,
  Video,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Meeting } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface MeetingCardProps {
  meeting: Meeting;
  onStar?: (id: string) => void;
  onUrgent?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  variant?: "grid" | "list";
}

const sourceIcons = {
  text: FileText,
  audio: Mic,
  video: Video,
};

export function MeetingCard({
  meeting,
  onStar,
  onUrgent,
  onRename,
  onDelete,
  variant = "grid",
}: MeetingCardProps) {
  const SourceIcon = sourceIcons[meeting.sourceType];
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(meeting.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== meeting.title) {
      onRename?.(meeting.id, trimmed);
    } else {
      setEditName(meeting.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      setEditName(meeting.title);
      setIsEditing(false);
    }
  };

  if (variant === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-card rounded-lg border border-border p-4 shadow-card hover:shadow-elevated transition-all duration-200 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <SourceIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm font-semibold px-1 max-w-xs"
            />
          ) : (
            <>
              <Link to={`/meeting/${meeting.id}`} className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">
                  {meeting.title}
                </h3>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="Rename meeting"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Calendar className="h-3 w-3" />
          <span>{formatDistanceToNow(meeting.createdAt, { addSuffix: true })}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {meeting.isStarred && <Star className="h-4 w-4 fill-starred text-starred" />}
          {meeting.isUrgent && <AlertTriangle className="h-4 w-4 fill-urgent text-urgent" />}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStar?.(meeting.id)}>
              <Star className="h-4 w-4 mr-2" />
              {meeting.isStarred ? "Unstar" : "Star"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUrgent?.(meeting.id)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {meeting.isUrgent ? "Remove Urgent" : "Mark Urgent"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsEditing(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete?.(meeting.id)} className="text-destructive focus:text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

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
          {meeting.isStarred && <Star className="h-4 w-4 fill-starred text-starred" />}
          {meeting.isUrgent && <AlertTriangle className="h-4 w-4 fill-urgent text-urgent" />}
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <SourceIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <div className="flex items-center gap-1.5">
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
                  <Link to={`/meeting/${meeting.id}`} className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{meeting.title}</h3>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label="Rename meeting"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(meeting.createdAt, { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        {/* Summary Preview */}
        {meeting.summary && (
          <Link to={`/meeting/${meeting.id}`}>
            <p className="text-sm text-muted-foreground line-clamp-2">{meeting.summary.shortSummary}</p>
          </Link>
        )}

        {/* Actions Menu */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStar?.(meeting.id)}>
                <Star className="h-4 w-4 mr-2" />
                {meeting.isStarred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUrgent?.(meeting.id)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {meeting.isUrgent ? "Remove Urgent" : "Mark Urgent"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsEditing(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(meeting.id)} className="text-destructive focus:text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
