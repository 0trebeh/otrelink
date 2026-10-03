// Shows which users exist and in which database (emails only, never passwords).
// Usage (from apps/web):  node scripts/list-users.mjs
import fs from 'node:fs';

if (fs.existsSync('.env')) process.loadEnvFile('.env');
const driver = process.env.DB_DRIVER || (process.env.MONGODB_URI ? 'mongo' : 'file');
const appDb = process.env.MONGODB_DB || 'otrelink';
console.log(`The app is configured to use: ${driver}${driver === 'mongo' ? ` → database "${appDb}"` : ' → data/db.json'}\n`);

if (driver === 'mongo') {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const { databases } = await client.db().admin().listDatabases();
  for (const { name } of databases) {
    if (['admin', 'local', 'config'].includes(name)) continue;
    const cols = (await client.db(name).listCollections().toArray()).map((c) => c.name);
    if (!cols.includes('users')) continue;
    const users = await client.db(name).collection('users').find({}, { projection: { email: 1, passwordHash: 1 } }).toArray();
    console.log(`Database "${name}"${name === appDb ? '  ← used by the app' : ''}: ${users.length} user(s)`);
    for (const u of users) console.log(`  - ${u.email}${u.passwordHash ? '' : '  (old format, cannot log in)'}`);
  }
  await client.close();
} else {
  const file = 'data/db.json';
  if (!fs.existsSync(file)) console.log(`${file} does not exist yet: there are no users.`);
  else for (const u of JSON.parse(fs.readFileSync(file, 'utf8')).users) console.log(`  - ${u.email}`);
}
