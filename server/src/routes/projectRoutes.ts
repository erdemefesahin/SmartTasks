import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createProjectController,
  getProjectsController,
  updateProjectController,
  deleteProjectController,
} from '../controllers/projectController.js';

const router = Router();

router.use(authenticate);
router.get('/', getProjectsController);
router.post('/', createProjectController);
router.put('/:projectId', updateProjectController);
router.delete('/:projectId', deleteProjectController);

export default router;
