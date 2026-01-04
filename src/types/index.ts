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
  isUrgent: boolean;
  createdAt: Date;
  updatedAt: Date;
  meetingCount: number;
}

export interface Meeting {
  id: string;
  title: string;
  folderId: string;
  isStarred: boolean;
  isUrgent: boolean;
  createdAt: Date;
  updatedAt: Date;
  transcript: string;
  summary: MeetingSummary | null;
  sourceType: 'text' | 'audio' | 'video';
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
