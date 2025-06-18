import { Request, Response, NextFunction } from 'express';
import pool from '../database/connection';
import { generateRandomOTP, sendEmail } from '../services/otpService'; // Importa funciones auxiliares
import { v4 as uuidv4 } from 'uuid';

export const registrarUsuarioCompleto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { correo, contrasena, nombres, apellidos, direccion, telefono, rol_id } = req.body;

  // Validación según el tipo de registro
  if (!correo || !nombres || !rol_id) {
    res.status(400).json({ mensaje: 'Correo, nombres y rol_id son obligatorios.' });
    return;
  }

  try {
    const fecha = new Date();
    const id = uuidv4();
    // Usar 'google_auth' como contraseña predeterminada si es registro con Google
    const passwordToUse = contrasena === 'google_auth' ? 'google_auth' : contrasena;
    // Para registro con Google, apellidos, dirección y teléfono pueden ser vacíos
    const apellidosToUse = contrasena === 'google_auth' ? '' : (apellidos || '');
    const direccionToUse = contrasena === 'google_auth' ? '' : (direccion || '');
    const telefonoToUse = contrasena === 'google_auth' ? '' : (telefono || '');

    const result = await pool.query(
      `INSERT INTO usuarios (id, correo, contrasena, nombres, apellidos, direccion, telefono, rol_id, fecha_creacion, fecha_actualizacion, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, FALSE)
       RETURNING *`,
      [id, correo, passwordToUse, nombres, apellidosToUse, direccionToUse, telefonoToUse, rol_id, fecha]
    );

    // Generar OTP solo si el registro fue exitoso
    const otp = generateRandomOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp (usuario_id, otp, expiry) VALUES ($1, $2, $3)`,
      [id, otp, expiry]
    );

    await sendEmail(correo, otp);

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente. OTP enviado.', usuario: result.rows[0] });
    return;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
    return;
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { correo, otp } = req.body;

  try {
    const userResult = await pool.query(`SELECT id FROM usuarios WHERE correo = $1`, [correo]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ mensaje: 'Usuario no encontrado.' });
      return;
    }
    const userId = userResult.rows[0].id;

    const result = await pool.query(
      `SELECT * FROM otp WHERE usuario_id = $1 AND otp = $2 AND expiry > NOW()`,
      [userId, otp]
    );

    if (result.rows.length > 0) {
      await pool.query(`UPDATE usuarios SET verified = TRUE WHERE id = $1`, [userId]);
      await pool.query(`DELETE FROM otp WHERE usuario_id = $1`, [userId]);
      res.status(200).json({ mensaje: 'OTP verificado. Usuario verificado.' });
    } else {
      res.status(400).json({ mensaje: 'OTP inválido o expirado.' });
    }
  } catch (error) {
    console.error('Error al verificar OTP:', error);
    res.status(500).json({ mensaje: 'Error al verificar OTP', error });
  }
};