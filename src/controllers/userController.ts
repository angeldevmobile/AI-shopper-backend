import { Request, Response, NextFunction } from 'express';
import pool from '../database/connection';

export const registrarUsuarioCompleto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { correo, contrasena, nombres, apellidos, direccion, telefono, rol_id } = req.body;

  if (!correo || !contrasena || !nombres || !apellidos || !direccion || !telefono || !rol_id) {
    res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    return;
  }

  try {
    const fecha = new Date();
    const result = await pool.query(
      `INSERT INTO usuarios (correo, contrasena, nombres, apellidos, direccion, telefono, rol_id, fecha_creacion, fecha_actualizacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING *`,
      [correo, contrasena, nombres, apellidos, direccion, telefono, rol_id, fecha]
    );
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', usuario: result.rows[0] });
    return;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
    return;
  }
};