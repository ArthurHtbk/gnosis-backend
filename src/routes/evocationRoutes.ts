import express from 'express';
import {
  createEvocation,
  getEvocations,
  getEvocationById,
  updateEvocation,
  deleteEvocation,
} from '../controllers/evocationControllers';

const router = express.Router();

router.post('/', createEvocation);
router.get('/', getEvocations);
router.get('/:id', getEvocationById);
router.put('/:id', updateEvocation);
router.delete('/:id', deleteEvocation);

export default router;
