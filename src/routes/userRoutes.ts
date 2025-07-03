import { Router, Request, Response } from 'express';
import { registrarUsuarioCompleto, verifyOTP } from '../controllers/userController';
import pool from '../database/connection';
import { sendEmail } from '../services/otpService';
import bcrypt from 'bcryptjs';

const router = Router();

router.post('/completar-perfil', registrarUsuarioCompleto);
router.post('/verify-otp', verifyOTP);

router.post('/forgot-password', async (req: Request, res: Response) => {
  const { correo } = req.body;
  try {
    // 1. Verifica si el usuario existe
    const userResult = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Correo no encontrado" });
    }
    const userId = userResult.rows[0].id;

    // 2. Genera una contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8);

    // 3. Hashea la contraseña temporal
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4. Actualiza la contraseña en la base de datos
    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2', [hashedPassword, userId]);

    // 5. Envía el correo con la contraseña temporal
    await sendEmail(correo, `Tu nueva contraseña temporal es: ${tempPassword}`);

    return res.status(200).json({ success: true, message: "Correo enviado" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error enviando correo" });
  }
});

export default router;