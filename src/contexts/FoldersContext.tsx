import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Folder, Meeting, MeetingSummary } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Initial mock data
const initialFolders: Folder[] = [
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

const initialMeetings: Meeting[] = [
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

interface FoldersContextType {
  folders: Folder[];
  meetings: Meeting[];
  createFolder: (name: string) => string;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  toggleFolderStar: (id: string) => void;
  toggleFolderUrgent: (id: string) => void;
  createMeeting: (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt">) => string;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  toggleMeetingStar: (id: string) => void;
  toggleMeetingUrgent: (id: string) => void;
  getMeetingsByFolder: (folderId: string) => Meeting[];
  getFolderById: (id: string) => Folder | undefined;
  getMeetingById: (id: string) => Meeting | undefined;
  generateSummary: (meetingId: string, transcript: string) => Promise<void>;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);

  const createFolder = (name: string): string => {
    const id = crypto.randomUUID();
    const newFolder: Folder = {
      id,
      name,
      parentId: null,
      isStarred: false,
      isUrgent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      meetingCount: 0,
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

  const toggleFolderUrgent = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isUrgent: !f.isUrgent } : f))
    );
  };

  const createMeeting = (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt">): string => {
    const id = crypto.randomUUID();
    const newMeeting: Meeting = {
      ...meeting,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
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

  const toggleMeetingUrgent = (id: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isUrgent: !m.isUrgent } : m))
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
        createFolder,
        updateFolder,
        deleteFolder,
        toggleFolderStar,
        toggleFolderUrgent,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        toggleMeetingStar,
        toggleMeetingUrgent,
        getMeetingsByFolder,
        getFolderById,
        getMeetingById,
        generateSummary,
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
