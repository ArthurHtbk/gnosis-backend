import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { callMistral } from '../lib/llm/mistralClient';
import { extractJson } from '../lib/llm/jsonWrapper';
import type { GenerateFromTextBody, LlmResponse } from '../types/GenerateCardsTypes';

export const generateCardsFromText = async (
  req: Request<{}, {}, GenerateFromTextBody>,
  res: Response
): Promise<void> => {
  try {
    // 🔐 user from supabase middleware
    const supabaseUser = req.user;

    if (!supabaseUser) {
      res.status(401).json({ error: 'Utilisateur non authentifié' });
      return;
    }

    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'title et content sont requis' });
      return;
    }

    // 1️⃣ Find user in DB
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé en base' });
      return;
    }

    // 2️⃣ Create Evocation
    const evocation = await prisma.evocation.create({
      data: {
        title,
        content,
        userId: user.id,
      },
    });

    // 3️⃣ LLM prompt
    const systemPrompt = `
Tu es un assistant pédagogique spécialisé dans la création de cartes de révision.

RÈGLES ABSOLUES :
- Tu DOIS répondre uniquement avec du JSON valide.
- Tu NE DOIS PAS ajouter de texte hors JSON.
- Tu DOIS produire EXACTEMENT 10 cartes.
- Les cartes que tu produis DOIVENT correspondre au niveau de complexité du texte fourni.
- Chaque carte doit être un objet avec :
  - "question": string
  - "answers": array de 4 strings
  - "rightAnswer": string (doit être STRICTEMENT l’une des valeurs de answers)

LANGUE :
- Même langue que le texte fourni.

FORMAT DE SORTIE :
{
  "cards": [
    {
      "question": "...",
      "answers": ["...", "...", "...", "..."],
      "rightAnswer": "..."
    }
  ]
}
`;

    // 4️⃣ Call Mistral
    const llmText = await callMistral([
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ]);

    // 5️⃣ Extract JSON
    const parsed = extractJson(llmText) as LlmResponse;

    if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length !== 10) {
      throw new Error('Format de cartes invalide retourné par le LLM');
    }

    // 6️⃣ Create cards (transaction) en stockant l'index de la bonne réponse
    const cards = await prisma.$transaction(
      parsed.cards.map((card) => {
        const rightIndex = card.answers.findIndex(a => a === card.rightAnswer);
        if (rightIndex === -1) throw new Error('Right answer not in answers array');

        return prisma.card.create({
          data: {
            evocationId: evocation.id,
            question: card.question,
            answers: card.answers,
            rightAnswerIndex: rightIndex, // <- on stocke l'index
            nextReviewAt: new Date(),
          },
        });
      })
    );

    // 7️⃣ Response
    res.status(201).json({
      evocation,
      cards,
    });
  } catch (error: unknown) {
    console.error('❌ Generation error:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la génération des cartes';
    res.status(500).json({ error: message });
  }
};
