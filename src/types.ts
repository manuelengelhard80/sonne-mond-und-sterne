export type UserRoleType = 'sonne' | 'mond';

export interface StarNote {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  content: string;
  author: string;
  authorRole?: UserRoleType;
  authorUid?: string;
  date: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  angle?: number;
  curvature?: number;
  expiresAt?: string | null; // Optionaler Termin: danach wird die Sternschnuppe gelöscht/ausgeblendet
  createdAt?: string;
  isArchived?: boolean;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  createdAt?: string;
  title: string;
  content: string;
  mood: 'Sonnig' | 'Ruhig' | 'Sternenklar' | 'Gedankenvoll';
  authorRole?: UserRoleType;
  authorName?: string;
  authorUid?: string;
  likes?: string[]; // Array of role identifiers or user IDs who loved this thought
}

export type SoundMode = 'off' | 'sun' | 'moon' | 'stars' | 'rain' | 'lake';

export type ActiveTab = 'story' | 'breath' | 'reflection' | 'moon' | 'stars' | 'lake' | 'meditation' | 'traumreisen' | 'journal';

export type ThemeMode = 'petrol-gold' | 'night-sky' | 'golden-hour' | 'deep-emerald';

