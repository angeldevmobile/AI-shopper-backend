import pool from './connection';

async function testDB() {
  console.log('Iniciando prueba de conexión...');
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa:', res.rows[0]);
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  } finally {
    await pool.end();
  }
}

testDB();