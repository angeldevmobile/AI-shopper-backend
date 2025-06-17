import { Router } from 'express';
import { crearRol } from '../controllers/roleController';

const router = Router();
router.post('/crear', crearRol);

export default router;