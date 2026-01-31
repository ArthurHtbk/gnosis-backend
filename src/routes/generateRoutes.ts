// src/routes/generateRoutes.ts

import { Router } from 'express';
import { generateCardsFromText } from '../controllers/generateControllers';

const router = Router();

// POST /api/generate
router.post('/', generateCardsFromText);

export default router;
