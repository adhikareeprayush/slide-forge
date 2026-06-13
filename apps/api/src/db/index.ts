import '../load-env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://slideforge:slideforge@localhost:5432/slideforge';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
