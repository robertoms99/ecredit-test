import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './client';

async function run() {
  try {
    await migrate(db, { migrationsFolder: './src/infrastructure/db/migrations' });
    console.log('Drizzle migrations applied');
    process.exit(0);
  } catch (e) {
    console.error('Migration error', e);
    process.exit(1);
  }
}

run();
