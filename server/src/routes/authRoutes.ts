import { Router } from 'express';
import {
  completeSignup,
  getProfile,
  loginWithPin,
  sendWhatsAppOtp,
  verifyOtp,
} from '../controllers/authController';

const router = Router();

router.post('/send-otp', sendWhatsAppOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-signup', completeSignup);
router.post('/login-pin', loginWithPin);
router.get('/profile/:id', getProfile);

export default router;
