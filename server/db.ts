import dotenv from "dotenv";
dotenv.config();  // ← ¡Carga .env antes que nada!

import { Pool, neonConfig, neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// In serverless environments like Vercel, the fetch-based neon client 
// is often more stable than WebSockets for short-lived requests.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzlePool(pool, { schema });