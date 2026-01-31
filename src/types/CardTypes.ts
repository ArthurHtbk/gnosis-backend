import type { Card } from '@prisma/client';

export type CardResponse = Omit<Card, 'rightAnswer'> & {
  evocation?: { id: number; title: string; content: string; userId: number };
};

export interface CardCreateBody {
  evocationId: number;
  question: string;
  answers: string[];
  rightAnswerIndex: number;
}

export interface CardUpdateBody {
  question?: string;
  answers?: string[];
  rightAnswerIndex?: number;
}
