export type ReviewAnswerInput = {
  cardId: number;
  userAnswerIndex: number;
};

export type StartSessionResponse = {
  sessionId: number;
  expiresAt: Date;
  cards: {
    id: number;
    question: string;
    answers: string[];
  }[];
};

export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'EXPIRED';
