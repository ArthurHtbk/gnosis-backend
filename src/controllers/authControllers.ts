import { Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient';
import { prisma } from '../prisma/client';

interface SignupBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// --- SIGNUP ---
export const signup = async (req: Request<{}, {}, SignupBody>, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // 1️⃣ Supabase signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.SUPABASE_REDIRECT_URL,
      },
    });

    if (error || !data.user) {
      res.status(400).json({ error: error?.message || 'Erreur Supabase' });
      return;
    }

    // 2️⃣ Création DB
    const userInDb = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        supabaseId: data.user.id,
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: userInDb,
      supabaseUser: data.user,
    });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Erreur serveur inconnue';
    res.status(500).json({ error: message });
  }
};

// --- LOGIN ---
export const login = async (req: Request<{}, {}, LoginBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // 1️⃣ Login Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      res.status(400).json({ error: error?.message || 'Erreur login Supabase' });
      return;
    }

    const supabaseId = data.user.id;

    // 2️⃣ Vérifier si l'utilisateur existe dans Neon
    let userInDb = await prisma.user.findUnique({
      where: { supabaseId },
    });

    // 3️⃣ S'il n'existe pas → on le crée (cas fréquent)
    if (!userInDb) {
      userInDb = await prisma.user.create({
        data: {
          supabaseId,
          email,
          name: null,
        },
      });
    }

    // 4️⃣ OK
    res.status(200).json({
      message: 'Login successful',
      user: userInDb,
      supabaseUser: data.user,
      access_token: data.session?.access_token,
    });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'Erreur serveur inconnue';
    res.status(500).json({ error: message });
  }
};
