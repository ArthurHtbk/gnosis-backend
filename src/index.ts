import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import evocationRoutes from './routes/evocationRoutes';
import cardRoutes from './routes/cardRoutes';
import generateRoutes from './routes/generateRoutes';
import reviewRoutes from './routes/reviewRoutes';
import { requireAuth } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.send('Gnosis API is live 🧠'));

app.use('/api/auth', authRoutes);

app.use('/api', requireAuth);

app.use('/api/users', userRoutes);
app.use('/api/evocations', evocationRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/review', reviewRoutes);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
