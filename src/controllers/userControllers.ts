import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { User } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// GET /api/users
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users: User[] = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
};

// GET /api/users/me
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const supabaseUserId = req.user?.id;
    if (!supabaseUserId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
    });

    console.log('Supabase user from token:', req.user);

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil.' });
  }
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      res.status(404).json({ message: 'Utilisateur non trouvé.' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l’utilisateur.' });
  }
};

// PATCH /api/users/:id
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { email, name },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l’utilisateur.' });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 1️⃣ On récupère l’utilisateur d’abord pour avoir son supabaseId
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    // 2️⃣ Suppression côté Supabase Auth
    const { error: supabaseError } = await supabase.auth.admin.deleteUser(user.supabaseId);

    if (supabaseError) {
      console.error('Supabase deletion error:', supabaseError);
      res.status(500).json({
        message: 'Impossible de supprimer l’utilisateur côté Supabase.',
        supabaseError,
      });
      return;
    }

    // 3️⃣ Suppression côté Neon
    await prisma.user.delete({
      where: { id: Number(id) },
    });

    // 4️⃣ Réponse
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Erreur interne lors de la suppression de l’utilisateur.' });
  }
};
