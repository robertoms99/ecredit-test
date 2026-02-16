import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ecredit_dev';
const pool = new Pool({ connectionString });


export const db = drizzle(pool, { schema });
export { schema, connectionString };
