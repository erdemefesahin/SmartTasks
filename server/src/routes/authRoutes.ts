import { Router } from 'express';
import { registerController, loginController, meController, updateProfileController, forgotPasswordController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/forgot-password', forgotPasswordController);
router.get('/me', authenticate, meController);
router.put('/me', authenticate, updateProfileController);

export default router;
