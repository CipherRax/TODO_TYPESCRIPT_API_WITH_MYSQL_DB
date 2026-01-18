import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

// Explicitly type the pool as a Promise Pool
const pool: Pool = mysql.createPool({
  host: "127.0.0.1",
  user: "stan",
  password: "123456789",
  database: "test",
});

export default pool;
