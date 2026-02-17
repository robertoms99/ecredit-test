import { db } from './client';
import { sql } from 'drizzle-orm';

/**
 * Utility script to safely truncate all tables for testing
 * This respects foreign key constraints
 */
async function truncateTables() {
  try {
    console.log('🗑️  Truncating all tables (respecting constraints)...\n');

    // Disable triggers temporarily to avoid issues
    await db.execute(sql`SET session_replication_role = 'replica'`);

    // Truncate in correct order (child tables first, then parent tables)
    const tables = [
      'status_transitions',
      'banking_info',
      'credit_requests',
      'request_statuses',
      'users',
    ];

    for (const table of tables) {
      await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
      console.log(`✓ Truncated: ${table}`);
    }

    // Re-enable triggers
    await db.execute(sql`SET session_replication_role = 'origin'`);

    console.log('\n✅ All tables truncated successfully');
  } catch (error) {
    console.error('❌ Error truncating tables:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

truncateTables();
