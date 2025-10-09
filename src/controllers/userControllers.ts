import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { CreateUserBody, UserResponse } from '../types/userTypes';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users: UserResponse[] = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
};

export const createUser = async (
  req: Request<{}, {}, CreateUserBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, name } = req.body;

    const newUser: UserResponse = await prisma.user.create({
      data: { email, name },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de l’utilisateur.' });
  }
};
