import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import type { CardCreateBody, CardResponse, CardUpdateBody } from '../types/CardTypes';

// --- GET ALL ---
export const getCards = async (
  _req: Request,
  res: Response<CardResponse[] | { error: string }>
): Promise<void> => {
  try {
    const cards = await prisma.card.findMany({ include: { Evocation: true } });
    res.status(200).json(cards);
  } catch (error: unknown) {
    console.error('❌ Error fetching cards:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la récupération des cartes.';
    res.status(500).json({ error: message });
  }
};

// --- GET BY ID ---
export const getCardById = async (
  req: Request<{ id: string }>,
  res: Response<CardResponse | { error: string }>
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID invalide.' });
      return;
    }

    const card = await prisma.card.findUnique({
      where: { id },
      include: { Evocation: true },
    });

    if (!card) {
      res.status(404).json({ error: 'Carte non trouvée.' });
      return;
    }

    res.status(200).json(card);
  } catch (error: unknown) {
    console.error('❌ Error fetching card by id:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la récupération de la carte.';
    res.status(500).json({ error: message });
  }
};

// --- CREATE ---
export const createCard = async (
  req: Request<{}, {}, CardCreateBody>,
  res: Response<CardResponse | { error: string }>
): Promise<void> => {
  try {
    const { evocationId, question, answers, rightAnswer } = req.body;

    if (!evocationId || !question || !answers.length || !rightAnswer) {
      res.status(400).json({ error: 'Les champs evocationId, question et answer sont requis.' });
      return;
    }

    const newCard = await prisma.card.create({
      data: { evocationId, question, answers, rightAnswer },
    });

    res.status(201).json(newCard);
  } catch (error: unknown) {
    console.error('❌ Error creating card:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la création de la carte.';
    res.status(500).json({ error: message });
  }
};

// --- UPDATE ---
export const updateCard = async (
  req: Request<{ id: string }, {}, CardUpdateBody>,
  res: Response<CardResponse | { error: string }>
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID invalide.' });
      return;
    }

    const { question, answers, rightAnswer } = req.body;

    const updatedCard = await prisma.card.update({
      where: { id },
      data: { question, answers, rightAnswer },
    });

    res.status(200).json(updatedCard);
  } catch (error: unknown) {
    console.error('❌ Error updating card:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la carte.';
    res.status(500).json({ error: message });
  }
};

// --- DELETE ---
export const deleteCard = async (
  req: Request<{ id: string }>,
  res: Response<{ message?: string; error?: string }>
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID invalide.' });
      return;
    }

    await prisma.card.delete({ where: { id } });
    res.status(204).send();
  } catch (error: unknown) {
    console.error('❌ Error deleting card:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la suppression de la carte.';
    res.status(500).json({ error: message });
  }
};
