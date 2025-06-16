/// <reference types="node" />

import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();

export default defineConfig({
  schema: path.join(__dirname, 'server', 'schema.ts'),
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});