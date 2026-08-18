import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import subtaskRoutes from './routes/subtaskRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/:taskId/subtasks', subtaskRoutes);
app.use('/api/ai', aiRoutes);

app.use(errorHandler);

export default app;
