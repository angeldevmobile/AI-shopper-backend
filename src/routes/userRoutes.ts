import { Router, Request, Response, NextFunction } from 'express';
import { registrarUsuario } from '../controllers/userController';

const router = Router();

router.post('/registrar', (req: Request, res: Response, next: NextFunction) => {
  registrarUsuario(req, res).catch(next);
});

export default router;