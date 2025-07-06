import pool from '../database/connection';
import fetch from 'node-fetch';

export async function populateProductsIfEmpty() {
  const result = await pool.query('SELECT COUNT(*) FROM productos');
  const count = parseInt(result.rows[0].count, 10);

  if (count === 0) {
    const res = await fetch('https://dummyjson.com/products?limit=0');
    const data = await res.json() as { products: any[] };
    const products = data.products;

    for (const p of products) {
      // Busca el id de la categoría
      const catRes = await pool.query('SELECT id FROM categorias WHERE nombre = $1', [p.category]);
      const categoria_id = catRes.rows.length > 0 ? catRes.rows[0].id : null;

      // Inserta producto
      await pool.query(
        `INSERT INTO productos (
          id, titulo, descripcion, categoria_id, precio, descuento, rating, stock, marca, sku, peso,
          garantia, envio, estado_disponibilidad, politica_devolucion, cantidad_minima, thumbnail
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        ) ON CONFLICT (id) DO NOTHING`,
        [
          p.id, p.title, p.description, categoria_id, p.price, p.discountPercentage, p.rating, p.stock,
          p.brand, p.sku, p.weight, p.warrantyInformation, p.shippingInformation, p.availabilityStatus,
          p.returnPolicy, p.minimumOrderQuantity, p.thumbnail
        ]
      );

      // Inserta imágenes
      for (const img of p.images) {
        await pool.query(
          'INSERT INTO imagenes_producto (producto_id, url) VALUES ($1, $2)',
          [p.id, img]
        );
      }

      // Inserta tags
      for (const tag of p.tags) {
        await pool.query(
          'INSERT INTO tags_producto (producto_id, tag) VALUES ($1, $2)',
          [p.id, tag]
        );
      }

      // Inserta reviews
      for (const r of p.reviews) {
        await pool.query(
          `INSERT INTO reviews_producto (producto_id, rating, comentario, fecha, nombre_revisor, email_revisor)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [p.id, r.rating, r.comment, r.date, r.reviewerName, r.reviewerEmail]
        );
      }

      // Inserta dimensiones
      if (p.dimensions) {
        await pool.query(
          `INSERT INTO dimensiones_producto (producto_id, ancho, alto, profundidad)
           VALUES ($1, $2, $3, $4)`,
          [p.id, p.dimensions.width, p.dimensions.height, p.dimensions.depth]
        );
      }
    }
    console.log('Productos importados correctamente');
  } else {
    console.log('Ya existen productos en la base de datos, no se importan.');
  }
}