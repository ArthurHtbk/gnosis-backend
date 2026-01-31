import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import {
  EvocationCreateBody,
  EvocationUpdateBody,
  EvocationResponse,
} from '../types/EvocationTypes';

// 🟢 CREATE
export const createEvocation = async (
  req: Request<{}, {}, EvocationCreateBody>,
  res: Response
): Promise<void> => {
  try {
    const { title, content, userId } = req.body;

    const evocation: EvocationResponse = await prisma.evocation.create({
      data: { title, content, userId },
    });

    res.status(201).json(evocation);
  } catch (error: unknown) {
    console.error('❌ Error creating evocation:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l’évocation.' });
  }
};

// 🔵 READ ALL
export const getEvocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const evocations: EvocationResponse[] = await prisma.evocation.findMany();
    res.status(200).json(evocations);
  } catch (error: unknown) {
    console.error('❌ Error fetching evocations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des évocations.' });
  }
};

// 🟡 READ ONE
export const getEvocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const evocation: EvocationResponse | null = await prisma.evocation.findUnique({
      where: { id },
    });

    if (!evocation) {
      res.status(404).json({ message: 'Évocation non trouvée.' });
      return;
    }

    res.status(200).json(evocation);
  } catch (error: unknown) {
    console.error('❌ Error fetching evocation:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l’évocation.' });
  }
};

// 🟠 UPDATE
export const updateEvocation = async (
  req: Request<{ id: string }, {}, EvocationUpdateBody>,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, content } = req.body;

    const evocation: EvocationResponse = await prisma.evocation.update({
      where: { id },
      data: { title, content },
    });

    res.status(200).json(evocation);
  } catch (error: unknown) {
    console.error('❌ Error updating evocation:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l’évocation.' });
  }
};

// 🔴 DELETE
export const deleteEvocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.evocation.delete({ where: { id } });
    res.status(204).send();
  } catch (error: unknown) {
    console.error('❌ Error deleting evocation:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l’évocation.' });
  }
};
