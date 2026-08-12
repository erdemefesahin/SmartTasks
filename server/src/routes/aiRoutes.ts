import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { enhanceTaskController } from '../controllers/aiController.js';

const router = Router();

router.use(authenticate);
router.post('/enhance-task', enhanceTaskController);

export default router;
