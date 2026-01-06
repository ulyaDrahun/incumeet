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
  transcript: string;
  summary: MeetingSummary | null;
  sourceType: 'text' | 'audio' | 'video';
  order: number;
}

export interface MeetingSummary {
  shortSummary: string;
  keyDecisions: string[];
  actionItems: string[];
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}
