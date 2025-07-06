import { Request, Response } from 'express';
import pool from '../database/connection';

export const getPopularProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(i.url)
            FROM imagenes_producto i
            WHERE i.producto_id = p.id
          ), '[]'
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'producto_id', r.producto_id,
                'rating', r.rating,
                'comentario', r.comentario,
                'fecha', r.fecha,
                'nombre_revisor', r.nombre_revisor,
                'email_revisor', r.email_revisor
              )
            )
            FROM reviews_producto r
            WHERE r.producto_id = p.id
          ), '[]'
        ) AS reviews
      FROM productos p
      ORDER BY p.rating DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos populares' });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

export const getProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const categoria = req.params.categoria;

  try {
    const catResult = await pool.query(
      'SELECT id FROM categorias WHERE nombre ILIKE $1',
      [categoria]
    );

    if (catResult.rows.length === 0) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    const categoriaId = catResult.rows[0].id;

    const prodResult = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(i.url)
            FROM imagenes_producto i
            WHERE i.producto_id = p.id
          ), '[]'
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'producto_id', r.producto_id,
                'rating', r.rating,
                'comentario', r.comentario,
                'fecha', r.fecha,
                'nombre_revisor', r.nombre_revisor,
                'email_revisor', r.email_revisor
              )
            )
            FROM reviews_producto r
            WHERE r.producto_id = p.id
          ), '[]'
        ) AS reviews
      FROM productos p
      WHERE p.categoria_id = $1
    `, [categoriaId]);

    res.json(prodResult.rows);
  } catch (error: any) {
    console.error('Error en getProductsByCategory:', error);
    res
      .status(500)
      .json({ error: 'Error al buscar productos por categoría', details: error.message });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(i.url)
            FROM imagenes_producto i
            WHERE i.producto_id = p.id
          ), '[]'
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'producto_id', r.producto_id,
                'rating', r.rating,
                'comentario', r.comentario,
                'fecha', r.fecha,
                'nombre_revisor', r.nombre_revisor,
                'email_revisor', r.email_revisor
              )
            )
            FROM reviews_producto r
            WHERE r.producto_id = p.id
          ), '[]'
        ) AS reviews
      FROM productos p
      ORDER BY p.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const getFiveProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(i.url)
            FROM imagenes_producto i
            WHERE i.producto_id = p.id
          ), '[]'
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'producto_id', r.producto_id,
                'rating', r.rating,
                'comentario', r.comentario,
                'fecha', r.fecha,
                'nombre_revisor', r.nombre_revisor,
                'email_revisor', r.email_revisor
              )
            )
            FROM reviews_producto r
            WHERE r.producto_id = p.id
          ), '[]'
        ) AS reviews
      FROM productos p
      ORDER BY p.rating DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener 5 productos' });
  }
};

export const getMostDiscountedProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(i.url)
            FROM imagenes_producto i
            WHERE i.producto_id = p.id
          ), '[]'
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'producto_id', r.producto_id,
                'rating', r.rating,
                'comentario', r.comentario,
                'fecha', r.fecha,
                'nombre_revisor', r.nombre_revisor,
                'email_revisor', r.email_revisor
              )
            )
            FROM reviews_producto r
            WHERE r.producto_id = p.id
          ), '[]'
        ) AS reviews
      FROM productos p
      ORDER BY p.descuento DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos con más descuento' });
  }
};

export const getProductsByCategories = async (req: Request, res: Response) => {
  const categorias: string[] = req.body.categorias;
  if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
    return res.status(400).json({ error: 'Debes enviar un array de categorías' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          (
            SELECT json_agg(i.url)
            FROM imagenes_producto i
            WHERE i.producto_id = p.id
          ), '[]'
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', r.id,
                'producto_id', r.producto_id,
                'rating', r.rating,
                'comentario', r.comentario,
                'fecha', r.fecha,
                'nombre_revisor', r.nombre_revisor,
                'email_revisor', r.email_revisor
              )
            )
            FROM reviews_producto r
            WHERE r.producto_id = p.id
          ), '[]'
        ) AS reviews
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE c.nombre = ANY($1)
    `, [categorias]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos por categorías' });
  }
};


export const searchProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Debes enviar el parámetro de búsqueda "q"' });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.titulo,
        p.precio,
        p.rating,
        COALESCE(
          (
            SELECT i.url
            FROM imagenes_producto i
            WHERE i.producto_id = p.id
            LIMIT 1
          ), p.thumbnail
        ) AS imagen
      FROM productos p
      WHERE LOWER(p.titulo) LIKE LOWER($1)
      ORDER BY p.titulo ASC
      LIMIT 3
    `,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error en searchProducts:', error);
    res.status(500).json({
      error: 'Error al buscar productos',
      detail: error.message,
    });
  }
};