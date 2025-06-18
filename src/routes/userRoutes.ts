import { Router } from 'express';
import { registrarUsuarioCompleto, verifyOTP } from '../controllers/userController';

const router = Router();

router.post('/completar-perfil', registrarUsuarioCompleto);
router.post('/verify-otp', verifyOTP); // Agrega la nueva ruta para la verificación OTP

export default router;