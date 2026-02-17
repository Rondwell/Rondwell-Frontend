const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

// Load env from both server/.env and project-root .env.
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

class Database {
  constructor() {
    // Initialize a PostgreSQL pool using env vars with sensible defaults.
    const rawPassword = process.env.DB_PASSWORD;
    const dbPassword = rawPassword == null ? "" : String(rawPassword);

    console.log("Database config:", {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD ? "********" : "MISSING/UNDEFINED",
      port: process.env.DB_PORT,
      passwordType: typeof process.env.DB_PASSWORD
    });

    this.pool = new Pool({
      user: process.env.DB_USER || "samaila",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "order_system",
      password: dbPassword,
      port: Number(process.env.DB_PORT) || 5432
    });

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }

  async initializeDatabase() {
    const client = await this.pool.connect();

    try {
      console.log("Connected to database successfully");

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Seed default user for local development if not already present.
      await client.query(
        `
          INSERT INTO users (email, password, role)
          VALUES ($1, $2, $3)
          ON CONFLICT (email) DO NOTHING;
        `,
        ["admin@rondwell.com", "password123", "admin"]
      );
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email) {
    const result = await this.pool.query(
      "SELECT id, email, password, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );

    return result.rows[0] || null;
  }
}

module.exports = new Database();
