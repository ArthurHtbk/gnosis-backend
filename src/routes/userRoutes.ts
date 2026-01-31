import { Router } from 'express';
import {
  getUsers,
  getCurrentUser,
  updateUser,
  deleteUser,
  getUserById,
} from '../controllers/userControllers';

const router = Router();

router.get('/', getUsers);
router.get('/me', getCurrentUser);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
