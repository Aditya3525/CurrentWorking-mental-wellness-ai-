import type { ReactNode } from 'react';

export type MediaKind = 'video' | 'audio';

export interface MediaSource {
  kind: MediaKind;
  src?: string | null;
  youtubeId?: string | null;
  poster?: string | null;
}

export interface LibraryItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  approach?: 'western' | 'eastern' | 'hybrid' | 'all' | string | null;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | string | null;
  durationLabel?: string | null;
  durationSeconds?: number | null;
  tags: string[];
  thumbnail?: string | null;
  rating?: number | null;
  author?: string | null;
  displayType: 'video' | 'audio' | 'article' | 'playlist';
  media?: MediaSource | null;
  body?: string | null;
  source: 'content' | 'practice';
  summaryExtra?: ReactNode;
  raw?: Record<string, unknown> | null;
}
