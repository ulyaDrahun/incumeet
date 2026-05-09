import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Folder,
  FolderPlus,
  Home,
  Calendar,
  Pin,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useFolders } from "@/contexts/FoldersContext";
import { useAuth } from "@/contexts/AuthContext";
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

interface SortableFolderItemProps {
  folder: FolderType;
  isActive?: boolean;
  isExpanded?: boolean;
  hasSubfolders?: boolean;
  onToggleExpand?: () => void;
  depth?: number;
  actualMeetingCount: number;
}

function SortableFolderItem({
  folder,
  isActive,
  isExpanded,
  hasSubfolders,
  onToggleExpand,
  depth = 0,
  actualMeetingCount,
}: SortableFolderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Link to={`/folder/${folder.id}`}>
        <motion.div
          whileHover={{ x: 2 }}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          {hasSubfolders && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleExpand?.();
              }}
              className="shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          <Folder className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate font-medium">{folder.name}</span>
          <div className="flex items-center gap-1">
            {folder.isStarred && (
              <Star className="h-3 w-3 fill-starred text-starred" />
            )}
            {folder.isPinned && (
              <Pin className="h-3 w-3 fill-pinned text-pinned" />
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-1">
            {actualMeetingCount}
          </span>
        </motion.div>
      </Link>
    </div>
  );
}

function FolderItemOverlay({ folder }: { folder: FolderType }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-card border shadow-lg">
      <Folder className="h-4 w-4 shrink-0" />
      <span className="font-medium">{folder.name}</span>
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { folders, createFolder, reorderFolders, moveFolderIntoFolder, getSubfolders, getActualMeetingCount } = useFolders();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<FolderType | null>(null);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleNewFolder = () => {
    createFolder("New Folder");
  };

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const folder = folders.find((f) => f.id === event.active.id);
    setActiveFolder(folder || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveFolder(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderFolders(active.id as string, over.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Could implement drop into folder logic here
  };

  const handleSignOut = async () => {
    setShowSignOutDialog(false);
    await signOut();
    navigate("/");
  };

  // Sort folders: pinned first, then by order
  const sortedRootFolders = folders
    .filter((f) => f.parentId === null)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.order - b.order;
    });

  const renderFolderTree = (parentId: string | null, depth: number = 0): React.ReactNode => {
    const subfolders = getSubfolders(parentId).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.order - b.order;
    });

    return subfolders.map((folder) => {
      const hasSubfolders = getSubfolders(folder.id).length > 0;
      const isExpanded = expandedFolders.has(folder.id);

      return (
        <div key={folder.id}>
          <SortableFolderItem
            folder={folder}
            isActive={location.pathname === `/folder/${folder.id}`}
            isExpanded={isExpanded}
            hasSubfolders={hasSubfolders}
            onToggleExpand={() => toggleExpand(folder.id)}
            depth={depth}
            actualMeetingCount={getActualMeetingCount(folder.id)}
          />
          <AnimatePresence>
            {isExpanded && hasSubfolders && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {renderFolderTree(folder.id, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  if (collapsed) return null;

  return (
    <>
      <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Logo size="sm" />
            </Link>
            <button
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </div>
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
            icon={<Calendar className="h-4 w-4" />}
            label="Calendar"
            href="/calendar"
            isActive={location.pathname === "/calendar"}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
            >
              <SortableContext
                items={sortedRootFolders.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {renderFolderTree(null)}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeFolder && <FolderItemOverlay folder={activeFolder} />}
              </DragOverlay>
            </DndContext>
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
          <button
            onClick={() => setShowSignOutDialog(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Incumeet?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your meetings and folders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
