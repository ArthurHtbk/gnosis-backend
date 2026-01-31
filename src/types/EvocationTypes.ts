import type { Evocation } from '@prisma/client';

export type EvocationResponse = Evocation;

export interface EvocationCreateBody {
  title: string;
  content: string;
  userId: number;
}

export interface EvocationUpdateBody {
  title?: string;
  content?: string;
}
