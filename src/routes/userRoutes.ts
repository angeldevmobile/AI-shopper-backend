import { Router } from 'express';
import { registrarUsuarioCompleto, verifyOTP, forgotPassword, login, googleLogin } from '../controllers/userController';

const router = Router();

router.post('/completar-perfil', registrarUsuarioCompleto);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/login', login);
router.post('/google-login', googleLogin); // Nuevo endpoint

export default router;