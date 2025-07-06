import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'BD_AI_SHOP',
  password: 'root1515', 
  port: 5432,
});

export default pool;