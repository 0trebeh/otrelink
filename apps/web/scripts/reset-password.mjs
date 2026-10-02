// Set a new password for a user.
// Usage (from apps/web):  node scripts/reset-password.mjs you@example.com "new password"
// Uses the same database settings as the app (apps/web/.env).
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

if (fs.existsSync('.env')) process.loadEnvFile('.env');

const [rawEmail, password] = process.argv.slice(2);
if (!rawEmail || !password) {
  console.error('Usage: node scripts/reset-password.mjs <email> "<new password>"');
  process.exit(1);
}
if (password.length < 8) {
  console.error('The password must have at least 8 characters.');
  process.exit(1);
}
const email = rawEmail.trim().toLowerCase();
const passwordHash = await bcrypt.hash(password, 10);
const driver = process.env.DB_DRIVER || (process.env.MONGODB_URI ? 'mongo' : 'file');

if (driver === 'mongo') {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const dbName = process.env.MONGODB_DB || 'otrelink';
  const res = await client.db(dbName).collection('users').updateOne({ email }, { $set: { passwordHash } });
  await client.close();
  if (!res.matchedCount) { console.error(`No user with email ${email} in MongoDB database "${dbName}".`); process.exit(1); }
} else {
  const file = 'data/db.json';
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  const user = state.users.find((u) => u.email === email);
  if (!user) { console.error(`No user with email ${email} in ${file}.`); process.exit(1); }
  user.passwordHash = passwordHash;
  fs.writeFileSync(file, JSON.stringify(state));
}
console.log(`Password updated for ${email} (${driver}). You can log in now.`);
