import { Request, Response } from 'express';
import pool from '../database/connection';

export const registrarUsuario = async (req: Request, res: Response) => {
  const { rol_id, correo, contrasena, nombre_completo } = req.body;

  if (!rol_id || !correo || !contrasena || !nombre_completo) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    const fecha = new Date();
    const result = await pool.query(
      `INSERT INTO usuarios (rol_id, correo, contrasena, nombre_completo, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
      [rol_id, correo, contrasena, nombre_completo, fecha]
    );
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', usuario: result.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
  }
};