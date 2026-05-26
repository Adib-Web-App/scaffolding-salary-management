import 'dotenv/config';
import { initDatabase, closeDatabase, getDialect } from './database.js';

async function migrate() {
  try {
    const dialect = await initDatabase();
    console.log(`Migration complete (${dialect})`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

migrate();
