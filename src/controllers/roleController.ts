import { Request, Response } from 'express';
import pool from '../database/connection';

export const crearRol = async (req: Request, res: Response) => {
  const { id, nombre } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO roles (id, nombre) VALUES ($1, $2) RETURNING *',
      [id, nombre]
    );
    res.status(201).json({ mensaje: 'Rol creado', rol: result.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear rol', error });
  }
};