import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Folder, Meeting, MeetingSummary, CalendarNote } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FoldersContextType {
  folders: Folder[];
  meetings: Meeting[];
  calendarNotes: CalendarNote[];
  loading: boolean;
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  toggleFolderStar: (id: string) => Promise<void>;
  toggleFolderPinned: (id: string) => Promise<void>;
  reorderFolders: (activeId: string, overId: string) => Promise<void>;
  moveFolderIntoFolder: (folderId: string, targetParentId: string | null) => Promise<void>;
  createMeeting: (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt" | "order">) => Promise<string>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  toggleMeetingStar: (id: string) => Promise<void>;
  toggleMeetingPinned: (id: string) => Promise<void>;
  getMeetingsByFolder: (folderId: string) => Meeting[];
  getFolderById: (id: string) => Folder | undefined;
  getMeetingById: (id: string) => Meeting | undefined;
  getSubfolders: (parentId: string | null) => Folder[];
  generateSummary: (meetingId: string, transcript: string) => Promise<void>;
  getActualMeetingCount: (folderId: string) => number;
  addCalendarNote: (date: Date, content: string, startTime?: string, duration?: number) => Promise<void>;
  updateCalendarNote: (id: string, updates: Partial<CalendarNote>) => Promise<void>;
  addMeetingFromCalendar: (date: Date, title: string, folderId: string, startTime?: string, duration?: number) => Promise<string>;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

// Mappers between DB rows and app types
const mapFolder = (r: any): Folder => ({
  id: r.id,
  name: r.name,
  parentId: r.parent_id,
  isStarred: r.is_starred,
  isPinned: r.is_pinned,
  createdAt: new Date(r.created_at),
  updatedAt: new Date(r.updated_at),
  meetingCount: 0,
  order: r.order,
});

const mapMeeting = (r: any): Meeting => ({
  id: r.id,
  title: r.title,
  folderId: r.folder_id,
  isStarred: r.is_starred,
  isPinned: r.is_pinned,
  createdAt: new Date(r.created_at),
  updatedAt: new Date(r.updated_at),
  meetingDate: new Date(r.meeting_date),
  startTime: r.start_time ?? undefined,
  duration: r.duration ?? undefined,
  transcript: r.transcript ?? "",
  summary: r.summary ?? null,
  sourceType: r.source_type,
  manualNotes: r.manual_notes ?? undefined,
  order: r.order,
});

const mapCalendarNote = (r: any): CalendarNote => ({
  id: r.id,
  date: new Date(r.date),
  content: r.content,
  meetingId: r.meeting_id ?? undefined,
  startTime: r.start_time ?? undefined,
  duration: r.duration ?? undefined,
});

export function FoldersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data when user changes
  useEffect(() => {
    if (!user) {
      setFolders([]); setMeetings([]); setCalendarNotes([]); setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: f }, { data: m }, { data: c }] = await Promise.all([
        supabase.from("folders").select("*").order("order", { ascending: true }),
        supabase.from("meetings").select("*").order("order", { ascending: true }),
        supabase.from("calendar_notes").select("*"),
      ]);
      if (cancelled) return;
      setFolders((f ?? []).map(mapFolder));
      setMeetings((m ?? []).map(mapMeeting));
      setCalendarNotes((c ?? []).map(mapCalendarNote));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const createFolder = async (name: string, parentId: string | null = null): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    const siblings = folders.filter((f) => f.parentId === parentId);
    const maxOrder = siblings.length ? Math.max(...siblings.map((f) => f.order)) : -1;
    const { data, error } = await supabase.from("folders").insert({
      user_id: user.id, name, parent_id: parentId, order: maxOrder + 1,
    }).select().single();
    if (error) throw error;
    const folder = mapFolder(data);
    setFolders((prev) => [folder, ...prev]);
    return folder.id;
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
    if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.order !== undefined) dbUpdates.order = updates.order;
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f));
    await supabase.from("folders").update(dbUpdates).eq("id", id);
  };

  const deleteFolder = async (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setMeetings((prev) => prev.filter((m) => m.folderId !== id));
    await supabase.from("folders").delete().eq("id", id);
  };

  const toggleFolderStar = async (id: string) => {
    const f = folders.find((x) => x.id === id);
    if (f) await updateFolder(id, { isStarred: !f.isStarred });
  };

  const toggleFolderPinned = async (id: string) => {
    const f = folders.find((x) => x.id === id);
    if (f) await updateFolder(id, { isPinned: !f.isPinned });
  };

  const reorderFolders = async (activeId: string, overId: string) => {
    const oldIndex = folders.findIndex((f) => f.id === activeId);
    const newIndex = folders.findIndex((f) => f.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const updated = [...folders];
    const [removed] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, removed);
    const reordered = updated.map((f, i) => ({ ...f, order: i }));
    setFolders(reordered);
    // persist new order
    await Promise.all(reordered.map((f) => supabase.from("folders").update({ order: f.order }).eq("id", f.id)));
  };

  const moveFolderIntoFolder = async (folderId: string, targetParentId: string | null) => {
    await updateFolder(folderId, { parentId: targetParentId });
  };

  const createMeeting = async (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt" | "order">): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    const siblings = meetings.filter((m) => m.folderId === meeting.folderId);
    const maxOrder = siblings.length ? Math.max(...siblings.map((m) => m.order)) : -1;
    const { data, error } = await supabase.from("meetings").insert({
      user_id: user.id,
      folder_id: meeting.folderId,
      title: meeting.title,
      is_starred: meeting.isStarred,
      is_pinned: meeting.isPinned,
      meeting_date: meeting.meetingDate.toISOString(),
      start_time: meeting.startTime ?? null,
      duration: meeting.duration ?? null,
      transcript: meeting.transcript ?? "",
      summary: meeting.summary as any,
      source_type: meeting.sourceType,
      manual_notes: meeting.manualNotes ?? null,
      order: maxOrder + 1,
    }).select().single();
    if (error) throw error;
    const m = mapMeeting(data);
    setMeetings((prev) => [m, ...prev]);
    return m.id;
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
    if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.meetingDate !== undefined) dbUpdates.meeting_date = updates.meetingDate.toISOString();
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime ?? null;
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration ?? null;
    if (updates.transcript !== undefined) dbUpdates.transcript = updates.transcript;
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary as any;
    if (updates.sourceType !== undefined) dbUpdates.source_type = updates.sourceType;
    if (updates.manualNotes !== undefined) dbUpdates.manual_notes = updates.manualNotes ?? null;
    if (updates.order !== undefined) dbUpdates.order = updates.order;
    setMeetings((prev) => prev.map((m) => m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m));
    await supabase.from("meetings").update(dbUpdates).eq("id", id);
  };

  const deleteMeeting = async (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("meetings").delete().eq("id", id);
  };

  const toggleMeetingStar = async (id: string) => {
    const m = meetings.find((x) => x.id === id);
    if (m) await updateMeeting(id, { isStarred: !m.isStarred });
  };

  const toggleMeetingPinned = async (id: string) => {
    const m = meetings.find((x) => x.id === id);
    if (m) await updateMeeting(id, { isPinned: !m.isPinned });
  };

  const getMeetingsByFolder = (folderId: string): Meeting[] => meetings.filter((m) => m.folderId === folderId);
  const getFolderById = (id: string) => folders.find((f) => f.id === id);
  const getMeetingById = (id: string) => meetings.find((m) => m.id === id);
  const getSubfolders = (parentId: string | null): Folder[] => folders.filter((f) => f.parentId === parentId);
  const getActualMeetingCount = (folderId: string): number => meetings.filter((m) => m.folderId === folderId).length;

  const addCalendarNote = async (date: Date, content: string, startTime?: string, duration?: number) => {
    if (!user) return;
    const { data, error } = await supabase.from("calendar_notes").insert({
      user_id: user.id, date: date.toISOString(), content, start_time: startTime ?? null, duration: duration ?? null,
    }).select().single();
    if (error) return;
    setCalendarNotes((prev) => [...prev, mapCalendarNote(data)]);
  };

  const updateCalendarNote = async (id: string, updates: Partial<CalendarNote>) => {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString();
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime ?? null;
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration ?? null;
    if (updates.meetingId !== undefined) dbUpdates.meeting_id = updates.meetingId ?? null;
    setCalendarNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...updates } : n));
    await supabase.from("calendar_notes").update(dbUpdates).eq("id", id);
  };

  const addMeetingFromCalendar = async (date: Date, title: string, folderId: string, startTime?: string, duration?: number): Promise<string> => {
    return createMeeting({
      title, folderId, isStarred: false, isPinned: false,
      meetingDate: date, startTime, duration,
      transcript: "", summary: null, sourceType: "text",
    });
  };

  const generateSummary = async (meetingId: string, transcript: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke("summarize-meeting", { body: { transcript } });
    if (error) throw new Error(error.message || "Failed to generate summary");
    if (data?.error) throw new Error(data.error);
    if (data?.summary) await updateMeeting(meetingId, { summary: data.summary as MeetingSummary });
  };

  return (
    <FoldersContext.Provider value={{
      folders, meetings, calendarNotes, loading,
      createFolder, updateFolder, deleteFolder, toggleFolderStar, toggleFolderPinned,
      reorderFolders, moveFolderIntoFolder,
      createMeeting, updateMeeting, deleteMeeting, toggleMeetingStar, toggleMeetingPinned,
      getMeetingsByFolder, getFolderById, getMeetingById, getSubfolders,
      generateSummary, getActualMeetingCount,
      addCalendarNote, updateCalendarNote, addMeetingFromCalendar,
    }}>
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) throw new Error("useFolders must be used within a FoldersProvider");
  return context;
}
