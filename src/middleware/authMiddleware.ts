import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.user = data.user; // req.user est typé via express.d.ts

  next();
};
