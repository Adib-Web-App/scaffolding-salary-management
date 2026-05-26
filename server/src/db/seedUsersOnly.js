import 'dotenv/config';
import { initDatabase, closeDatabase, get } from './database.js';
import { seedDefaultUsers } from './seedUsers.js';
import { parseCount } from './sqlUtils.js';

async function main() {
  await initDatabase();
  const before = parseCount(await get(`SELECT COUNT(*) as count FROM users`));
  await seedDefaultUsers(parseCount);
  const after = parseCount(await get(`SELECT COUNT(*) as count FROM users`));
  if (after > before) {
    console.log('Default users created.');
  } else {
    console.log('Users already exist — no changes.');
  }
  await closeDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
