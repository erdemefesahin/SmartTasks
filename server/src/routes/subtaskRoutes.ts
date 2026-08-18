import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createSubtaskController, toggleSubtaskController, deleteSubtaskController } from '../controllers/subtaskController.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.post('/', createSubtaskController);
router.patch('/:subtaskId/complete', toggleSubtaskController);
router.delete('/:subtaskId', deleteSubtaskController);

export default router;