export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  isStarred: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  meetingCount: number;
  order: number;
}

export interface Meeting {
  id: string;
  title: string;
  folderId: string;
  isStarred: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  meetingDate: Date;
  startTime?: string; // "HH:mm" format e.g. "09:00"
  duration?: number;  // in minutes
  transcript: string;
  summary: MeetingSummary | null;
  sourceType: 'text' | 'audio' | 'video';
  manualNotes?: string;
  order: number;
}

export interface ActionItemByPerson {
  person: string;
  items: string[];
}

export interface MeetingSummary {
  shortSummary: string;
  keyDecisions: string[];
  actionItems: ActionItemByPerson[];
}

export interface CalendarNote {
  id: string;
  date: Date;
  content: string;
  meetingId?: string;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}
