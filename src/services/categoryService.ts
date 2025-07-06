import pool from '../database/connection';
import fetch from 'node-fetch'; // Instala con: npm install node-fetch

export async function populateCategoriesIfEmpty() {
  // Verifica si la tabla está vacía
  const result = await pool.query('SELECT COUNT(*) FROM categorias');
  const count = parseInt(result.rows[0].count, 10);

  if (count === 0) {
    // Obtiene las categorías desde la API
    const res = await fetch('https://dummyjson.com/products/category-list');
    const categories = await res.json() as string[];

    // Inserta cada categoría
    for (const nombre of categories) {
      await pool.query(
        'INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING',
        [nombre]
      );
    }
    console.log('Categorías importadas correctamente');
  } else {
    console.log('Ya existen categorías en la base de datos, no se importan.');
  }
}