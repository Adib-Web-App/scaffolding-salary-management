/**
 * MonsterASP.NET entry point — must be named server.js in wwwroot.
 * @see https://help.monsterasp.net/books/nodejs/page/how-to-run-nodejs-application
 */
import { fileURLToPath } from 'url';
import path from 'path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
process.chdir(rootDir);

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (!process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = path.join(rootDir, 'data', 'production.db');
}

await import('./server/src/index.js');
