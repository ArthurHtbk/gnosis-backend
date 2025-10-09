import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await prisma.user.create({
      data: { email, name }
    });
    return res.status(201).json(user);
  } catch (err: any) {
    console.error(err);
    // Prisma unique constraint example
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
