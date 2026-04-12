import { useState } from "react";
import { Link } from "react-router-dom";
import { Pin, Search, Folder, FileText, Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFolders } from "@/contexts/FoldersContext";
import type { Folder as FolderType, Meeting } from "@/types";

interface PinnedSheetProps {
  children: React.ReactNode;
}

export function PinnedSheet({ children }: PinnedSheetProps) {
  const { folders, meetings, getFolderById } = useFolders();
  const [search, setSearch] = useState("");
  const [showFolders, setShowFolders] = useState(true);
  const [showFiles, setShowFiles] = useState(true);

  const pinnedFolders = folders.filter((f) => f.isPinned);
  const pinnedMeetings = meetings.filter((m) => m.isPinned);

  const filteredFolders = pinnedFolders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMeetings = pinnedMeetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-[400px] flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-pinned" />
            Pinned
          </SheetTitle>
        </SheetHeader>

        {/* Search & Filter */}
        <div className="px-6 pb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pinned items..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showFolders}
                onCheckedChange={setShowFolders}
              >
                Folders
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showFiles}
                onCheckedChange={setShowFiles}
              >
                Meeting Files
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Pinned Folders */}
          {showFolders && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Folders
              </h3>
              {filteredFolders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pinned folders{search ? " matching your search" : ""}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredFolders.map((folder) => (
                    <Link
                      key={folder.id}
                      to={`/folder/${folder.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Folder className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {folder.meetingCount} meeting{folder.meetingCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Pin className="h-3.5 w-3.5 text-pinned shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pinned Files */}
          {showFiles && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Files
              </h3>
              {filteredMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pinned files{search ? " matching your search" : ""}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredMeetings.map((meeting) => {
                    const folder = getFolderById(meeting.folderId);
                    return (
                      <Link
                        key={meeting.id}
                        to={`/meeting/${meeting.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {folder ? folder.name : "Unknown folder"}
                          </p>
                        </div>
                        <Pin className="h-3.5 w-3.5 text-pinned shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
