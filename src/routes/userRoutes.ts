import { Router } from 'express';
import { registrarUsuarioCompleto } from '../controllers/userController';

const router = Router();

router.post('/completar-perfil', registrarUsuarioCompleto);

export default router;