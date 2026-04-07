import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Folder, Meeting, MeetingSummary, CalendarNote } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Initial mock data
const initialFolders: Folder[] = [
  {
    id: "1",
    name: "Team Meetings",
    parentId: null,
    isStarred: true,
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 5,
    order: 0,
  },
  {
    id: "2",
    name: "Client Calls",
    parentId: null,
    isStarred: false,
    isPinned: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 3,
    order: 1,
  },
  {
    id: "3",
    name: "1:1 Sessions",
    parentId: null,
    isStarred: false,
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 8,
    order: 2,
  },
  {
    id: "4",
    name: "Product Reviews",
    parentId: null,
    isStarred: true,
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    meetingCount: 2,
    order: 3,
  },
];

const initialMeetings: Meeting[] = [
  {
    id: "1",
    title: "Q4 Planning Session",
    folderId: "1",
    isStarred: true,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    updatedAt: new Date(),
    meetingDate: new Date(Date.now() - 1000 * 60 * 30),
    transcript: "",
    summary: {
      shortSummary:
        "Discussed Q4 goals including 20% revenue growth and new product launch timeline. Team aligned on priorities.",
      keyDecisions: [],
      actionItems: [
        { person: "John", items: ["Finalize budget proposal", "Schedule review meeting"] },
        { person: "Sarah", items: ["Draft marketing plan", "Contact vendors"] },
      ],
    },
    sourceType: "text",
    order: 0,
  },
  {
    id: "2",
    title: "Client Onboarding - Acme Corp",
    folderId: "2",
    isStarred: false,
    isPinned: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(),
    meetingDate: new Date(Date.now() - 1000 * 60 * 60 * 2),
    transcript: "",
    summary: {
      shortSummary:
        "Onboarding call with Acme Corp. Covered integration requirements and timeline expectations.",
      keyDecisions: [],
      actionItems: [
        { person: "Mike", items: ["Send API documentation", "Set up staging environment"] },
      ],
    },
    sourceType: "audio",
    order: 0,
  },
  {
    id: "3",
    title: "Weekly Engineering Sync",
    folderId: "1",
    isStarred: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(),
    meetingDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    transcript: "",
    summary: {
      shortSummary:
        "Sprint review and backlog grooming. Addressed tech debt items and deployment schedule.",
      keyDecisions: [],
      actionItems: [
        { person: "Emma", items: ["Update Jira tickets", "Review PRs"] },
        { person: "David", items: ["Deploy to staging", "Run integration tests"] },
      ],
    },
    sourceType: "video",
    order: 1,
  },
];

interface FoldersContextType {
  folders: Folder[];
  meetings: Meeting[];
  calendarNotes: CalendarNote[];
  createFolder: (name: string, parentId?: string | null) => string;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  toggleFolderStar: (id: string) => void;
  toggleFolderPinned: (id: string) => void;
  reorderFolders: (activeId: string, overId: string) => void;
  moveFolderIntoFolder: (folderId: string, targetParentId: string | null) => void;
  createMeeting: (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt" | "order">) => string;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  toggleMeetingStar: (id: string) => void;
  toggleMeetingPinned: (id: string) => void;
  getMeetingsByFolder: (folderId: string) => Meeting[];
  getFolderById: (id: string) => Folder | undefined;
  getMeetingById: (id: string) => Meeting | undefined;
  getSubfolders: (parentId: string | null) => Folder[];
  generateSummary: (meetingId: string, transcript: string) => Promise<void>;
  getActualMeetingCount: (folderId: string) => number;
  addCalendarNote: (date: Date, content: string, startTime?: string, duration?: number) => void;
  updateCalendarNote: (id: string, updates: Partial<CalendarNote>) => void;
  addMeetingFromCalendar: (date: Date, title: string, folderId: string, startTime?: string, duration?: number) => string;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);

  const createFolder = (name: string, parentId: string | null = null): string => {
    const id = crypto.randomUUID();
    const siblings = folders.filter((f) => f.parentId === parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((f) => f.order)) : -1;
    const newFolder: Folder = {
      id,
      name,
      parentId,
      isStarred: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      meetingCount: 0,
      order: maxOrder + 1,
    };
    setFolders((prev) => [newFolder, ...prev]);
    return id;
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f
      )
    );
  };

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setMeetings((prev) => prev.filter((m) => m.folderId !== id));
  };

  const toggleFolderStar = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isStarred: !f.isStarred } : f))
    );
  };

  const toggleFolderPinned = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isPinned: !f.isPinned } : f))
    );
  };

  const reorderFolders = (activeId: string, overId: string) => {
    setFolders((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === activeId);
      const newIndex = prev.findIndex((f) => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, removed);
      return updated.map((f, i) => ({ ...f, order: i }));
    });
  };

  const moveFolderIntoFolder = (folderId: string, targetParentId: string | null) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, parentId: targetParentId, updatedAt: new Date() } : f
      )
    );
  };

  const createMeeting = (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt" | "order">): string => {
    const id = crypto.randomUUID();
    const siblings = meetings.filter((m) => m.folderId === meeting.folderId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((m) => m.order)) : -1;
    const newMeeting: Meeting = {
      ...meeting,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: maxOrder + 1,
    };
    setMeetings((prev) => [newMeeting, ...prev]);
    
    // Increment folder meeting count
    setFolders((prev) =>
      prev.map((f) =>
        f.id === meeting.folderId ? { ...f, meetingCount: f.meetingCount + 1 } : f
      )
    );
    
    return id;
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
      )
    );
  };

  const deleteMeeting = (id: string) => {
    const meeting = meetings.find((m) => m.id === id);
    if (meeting) {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === meeting.folderId
            ? { ...f, meetingCount: Math.max(0, f.meetingCount - 1) }
            : f
        )
      );
    }
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleMeetingStar = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m))
    );
  };

  const toggleMeetingPinned = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  const getMeetingsByFolder = (folderId: string): Meeting[] => {
    return meetings.filter((m) => m.folderId === folderId);
  };

  const getFolderById = (id: string): Folder | undefined => {
    return folders.find((f) => f.id === id);
  };

  const getMeetingById = (id: string): Meeting | undefined => {
    return meetings.find((m) => m.id === id);
  };

  const getSubfolders = (parentId: string | null): Folder[] => {
    return folders.filter((f) => f.parentId === parentId);
  };

  const getActualMeetingCount = (folderId: string): number => {
    return meetings.filter((m) => m.folderId === folderId).length;
  };

  const addCalendarNote = (date: Date, content: string, startTime?: string, duration?: number) => {
    const note: CalendarNote = {
      id: crypto.randomUUID(),
      date,
      content,
      startTime,
      duration,
    };
    setCalendarNotes((prev) => [...prev, note]);
  };

  const updateCalendarNote = (id: string, updates: Partial<CalendarNote>) => {
    setCalendarNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  };

   const addMeetingFromCalendar = (date: Date, title: string, folderId: string, startTime?: string, duration?: number): string => {
     return createMeeting({
       title,
       folderId,
       isStarred: false,
       isPinned: false,
       meetingDate: date,
       startTime,
       duration,
       transcript: "",
       summary: null,
       sourceType: "text",
     });
   };

  const generateSummary = async (meetingId: string, transcript: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke("summarize-meeting", {
      body: { transcript },
    });

    if (error) {
      console.error("Error generating summary:", error);
      throw new Error(error.message || "Failed to generate summary");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    if (data?.summary) {
      updateMeeting(meetingId, { summary: data.summary as MeetingSummary });
    }
  };

  return (
    <FoldersContext.Provider
      value={{
        folders,
        meetings,
        calendarNotes,
        createFolder,
        updateFolder,
        deleteFolder,
        toggleFolderStar,
        toggleFolderPinned,
        reorderFolders,
        moveFolderIntoFolder,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        toggleMeetingStar,
        toggleMeetingPinned,
        getMeetingsByFolder,
        getFolderById,
        getMeetingById,
        getSubfolders,
        generateSummary,
        getActualMeetingCount,
        addCalendarNote,
        addMeetingFromCalendar,
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error("useFolders must be used within a FoldersProvider");
  }
  return context;
}
