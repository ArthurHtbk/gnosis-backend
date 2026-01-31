import type { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { endOfToday, startOfTomorrow } from '../utils/dateUtils';
import type { ReviewAnswerInput, StartSessionResponse } from '../types/ReviewTypes';
import type { CardResponse } from '../types/CardTypes';

/* -------------------------------------------------- */
/* Typage de réponse SM-2                             */
/* -------------------------------------------------- */
type AnswerCardResponse = {
  ok: true;
  sm2: {
    nextReviewAt: Date;
    interval: number;
    repetitions: number;
    easeFactor: number;
  };
};

/* -------------------------------------------------- */
/* SM-2 binaire util                                  */
/* -------------------------------------------------- */
interface Sm2CardData {
  interval: number | null;
  repetitions: number | null;
  easeFactor: number | null;
}

function applySm2Binary(card: Sm2CardData) {
  let interval = card.interval ?? 0;
  let repetitions = card.repetitions ?? 0;
  let ef = card.easeFactor ?? 2.5;

  return function update(success: boolean) {
    if (success) {
      repetitions += 1;

      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 3;
      else interval = Math.round(interval * ef);
    } else {
      repetitions = 0;
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);
    nextReviewAt.setHours(0, 0, 0, 0);

    return { interval, repetitions, easeFactor: ef, nextReviewAt };
  };
}

/* -------------------------------------------------- */
/* START SESSION                                      */
/* -------------------------------------------------- */
/* -------------------------------------------------- */
/* START SESSION                                      */
/* -------------------------------------------------- */
export async function startReviewSession(
  req: Request,
  res: Response<StartSessionResponse | { message: string } | { error: string }>
): Promise<void> {
  try {
    const supabaseUserId = req.user!.id;

    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
    });

    if (!prismaUser) {
      res.status(404).json({ error: 'User not found in database' });
      return;
    }

    const userId = prismaUser.id;
    const now = new Date();

    // Récupère les cartes à réviser : nextReviewAt <= maintenant ou non définies
    const dueCards: CardResponse[] = await prisma.card.findMany({
      where: {
        Evocation: { userId },
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
      take: 50, // <- ajustable selon ta limite
      orderBy: { nextReviewAt: 'asc' },
      include: { Evocation: true },
    });

    if (dueCards.length === 0) {
      res.json({ message: 'No cards due now' });
      return;
    }

    // Crée la session avec snapshot des cartes
    const session = await prisma.reviewSession.create({
      data: {
        userId,
        expiresAt: endOfToday(),
        cards: {
          createMany: {
            data: dueCards.map((c) => ({ cardId: c.id })),
          },
        },
      },
      include: {
        cards: { include: { card: true } },
      },
    });

    const response: StartSessionResponse = {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      cards: session.cards.map((sc) => ({
        id: sc.card.id,
        question: sc.card.question,
        answers: sc.card.answers,
      })),
    };

    res.json(response);
  } catch (error: unknown) {
    console.error('❌ Start session error:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors du démarrage de la session';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------- */
/* ANSWER CARD                                        */
/* -------------------------------------------------- */
interface AnswerCardBody extends ReviewAnswerInput {
  sessionId: number;
}

export async function answerCard(
  req: Request<unknown, unknown, AnswerCardBody>,
  res: Response<AnswerCardResponse | { error: string }>
): Promise<void> {
  const supabaseUserId = req.user!.id;

  const prismaUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
  });

  if (!prismaUser) {
    res.status(404).json({ error: 'User not found in database' });
    return;
  }

  const userId = prismaUser.id;
  const { sessionId, cardId, userAnswerIndex } = req.body;

  const sessionCard = await prisma.reviewSessionCard.findFirst({
    where: {
      sessionId,
      cardId,
      session: { userId, finishedAt: null },
    },
    include: { card: true },
  });

  if (!sessionCard) {
    res.status(404).json({ error: 'Card not in active session' });
    return;
  }

  if (sessionCard.reviewed) {
    res.status(400).json({ error: 'Card already reviewed' });
    return;
  }

  // ✅ Compare l'index de la réponse utilisateur avec le bon index
  const success = sessionCard.card.rightAnswerIndex === userAnswerIndex;

  const updater = applySm2Binary(sessionCard.card);
  const sm2 = updater(success);

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: sm2,
    }),
    prisma.reviewSessionCard.update({
      where: { id: sessionCard.id },
      data: { reviewed: true },
    }),
    prisma.reviewLog.create({
      data: {
        userId,
        cardId,
        sessionId,
        success,
        reviewedAt: new Date(),
      },
    }),
  ]);

  res.json({
    ok: true,
    sm2: {
      nextReviewAt: sm2.nextReviewAt,
      interval: sm2.interval,
      repetitions: sm2.repetitions,
      easeFactor: sm2.easeFactor,
    },
  });
}

/* -------------------------------------------------- */
/* FINISH SESSION                                     */
/* -------------------------------------------------- */
interface FinishSessionBody {
  sessionId: number;
}

export async function finishSession(
  req: Request<unknown, unknown, FinishSessionBody>,
  res: Response<{ ok: boolean } | { error: string }>
): Promise<void> {
  try {
    const supabaseUserId = req.user!.id;

    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
    });

    if (!prismaUser) {
      res.status(404).json({ error: 'User not found in database' });
      return;
    }

    const userId = prismaUser.id;
    const { sessionId } = req.body;

    const session = await prisma.reviewSession.findFirst({
      where: { id: sessionId, userId, finishedAt: null },
      include: { cards: true },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const notReviewed = session.cards.filter((c) => !c.reviewed);

    await prisma.$transaction([
      prisma.card.updateMany({
        where: { id: { in: notReviewed.map((c) => c.cardId) } },
        data: { nextReviewAt: startOfTomorrow() },
      }),
      prisma.reviewSession.update({
        where: { id: sessionId },
        data: { finishedAt: new Date() },
      }),
    ]);

    res.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error finishing session';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------- */
/* PAUSE SESSION                                      */
/* -------------------------------------------------- */
interface PauseSessionBody {
  sessionId: number;
}

export async function pauseSession(
  req: Request<unknown, unknown, PauseSessionBody>,
  res: Response<{ ok: boolean; expiresAt: Date } | { error: string }>
): Promise<void> {
  try {
    const supabaseUserId = req.user!.id;

    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
    });

    if (!prismaUser) {
      res.status(404).json({ error: 'User not found in database' });
      return;
    }

    const userId = prismaUser.id;
    const { sessionId } = req.body;

    const session = await prisma.reviewSession.findFirst({
      where: { id: sessionId, userId, finishedAt: null },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ ok: true, expiresAt: session.expiresAt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error pausing session';
    res.status(500).json({ error: message });
  }
}

/* -------------------------------------------------- */
/* EXPIRE SESSIONS (cron / middleware)               */
/* -------------------------------------------------- */
export async function expireSessions(): Promise<void> {
  const now = new Date();

  const expired = await prisma.reviewSession.findMany({
    where: { finishedAt: null, expiresAt: { lt: now } },
    include: { cards: true },
  });

  for (const session of expired) {
    const notReviewed = session.cards.filter((c) => !c.reviewed);

    await prisma.$transaction([
      prisma.card.updateMany({
        where: { id: { in: notReviewed.map((c) => c.cardId) } },
        data: { nextReviewAt: startOfTomorrow() },
      }),
      prisma.reviewSession.update({
        where: { id: session.id },
        data: { finishedAt: now },
      }),
    ]);
  }
}
