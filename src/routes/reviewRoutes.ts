import { Router } from 'express';

import {
  startReviewSession,
  answerCard,
  finishSession,
  pauseSession,
} from '../controllers/reviewSessionControllers';

const router = Router();

router.post('/start', startReviewSession);
router.post('/answer', answerCard);
router.post('/finish', finishSession);
router.post('/pause', pauseSession);

export default router;
