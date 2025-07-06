import { Request, Response, NextFunction } from 'express';
import pool from '../database/connection';
import { generateRandomOTP, sendEmail } from '../services/otpService';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import admin from '../config/firebase'; // Para verificar ID token de Google

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

  // Validar que la contraseña sea proporcionada para registros no Google
  if (!contrasena && contrasena !== 'google_auth') {
    res.status(400).json({ mensaje: 'La contraseña es obligatoria para registros no Google.' });
    return;
  }

  try {
    // Verificar si el correo ya existe
    const existingUser = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ mensaje: 'El correo ya está registrado. Por favor, inicia sesión.' });
      return;
    }

    const fecha = new Date();
    const id = uuidv4();
    // Determinar la contraseña a usar
    let passwordToUse = contrasena;
    if (contrasena !== 'google_auth') {
      // Hashear la contraseña para usuarios regulares
      passwordToUse = await bcrypt.hash(contrasena, 10);
    }

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
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
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

export const forgotPassword = async (req: Request<{}, any, { correo: string }>, res: Response): Promise<void> => {
  const { correo } = req.body;
  try {
    const userResult = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Correo no encontrado' });
      return;
    }
    const userId = userResult.rows[0].id;

    // Verificar que no sea un usuario de Google
    const userDetails = await pool.query('SELECT contrasena FROM usuarios WHERE id = $1', [userId]);
    if (userDetails.rows[0].contrasena === 'google_auth') {
      res.status(400).json({ success: false, message: 'No se puede restablecer la contraseña para usuarios de Google' });
      return;
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2', [hashedPassword, userId]);
    await sendEmail(correo, `Tu nueva contraseña temporal es: ${tempPassword}`);
    res.status(200).json({ success: true, message: 'Correo enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error enviando correo' });
  }
};

export const login = async (
  req: Request<{}, any, { correo: string; contrasena: string }>,
  res: Response
): Promise<void> => {
  const { correo, contrasena } = req.body;

  try {
    // Verifica si el usuario existe en PostgreSQL
    const userResult = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    if (userResult.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Correo no encontrado' });
      return;
    }

    const user = userResult.rows[0];

    // Si el usuario se registró con Google
    if (user.contrasena === 'google_auth') {
      res.status(400).json({ success: false, message: 'Este usuario debe iniciar sesión con Google' });
      return;
    }

    // Verifica la contraseña
    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
      return;
    }

    // Verifica si el usuario está verificado
    if (!user.verified) {
      res.status(403).json({ success: false, message: 'Usuario no verificado. Por favor, verifica tu correo con el OTP.' });
      return;
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        correo: user.correo,
        nombres: user.nombres,
        rol_id: user.rol_id,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión', error });
  }
};

// Nuevo endpoint para inicio de sesión con Google
export const googleLogin = async (
  req: Request<{}, any, { idToken: string }>,
  res: Response
): Promise<void> => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;
    const name = decodedToken.name || email?.split('@')[0];

    if (!email) {
      res.status(400).json({ success: false, message: 'No se pudo obtener el correo del token.' });
      return;
    }

    // Buscar usuario
    const userResult = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);

    // Si el usuario no existe, lo registramos automáticamente
    if (userResult.rows.length === 0) {
      const id = uuidv4();
      const fecha = new Date();

      const result = await pool.query(
        `INSERT INTO usuarios (id, correo, contrasena, nombres, apellidos, direccion, telefono, rol_id, fecha_creacion, fecha_actualizacion, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, FALSE)
         RETURNING *`,
        [
          id,
          email,
          'google_auth', // contraseña especial
          name,
          '',
          '',
          '',
          1, // rol_id por defecto
          fecha,
        ]
      );

      // Generar OTP y enviarlo
      const otp = generateRandomOTP();
      const expiry = new Date(Date.now() + 5 * 60 * 1000);
      await pool.query(`INSERT INTO otp (usuario_id, otp, expiry) VALUES ($1, $2, $3)`, [id, otp, expiry]);
      await sendEmail(email, otp);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado con Google. OTP enviado.',
        usuario: result.rows[0],
        requiereVerificacion: true,
      });
      return;
    }

    const user = userResult.rows[0];

    if (user.contrasena !== 'google_auth') {
      res.status(400).json({ success: false, message: 'Este usuario no está registrado con Google' });
      return;
    }

    if (!user.verified) {
      res.status(403).json({ success: false, message: 'Usuario no verificado. Por favor, verifica tu correo con el OTP.' });
      return;
    }

    // Usuario existente y verificado
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión con Google exitoso',
      user: {
        id: user.id,
        correo: user.correo,
        nombres: user.nombres,
        rol_id: user.rol_id,
        verified: user.verified,
      },
      token: idToken,
    });
  } catch (error) {
    console.error('Error en googleLogin:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión con Google', error });
  }
};