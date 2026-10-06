// Startup checks (Node.js only). In production the app refuses to start without
// a strong JWT_SECRET: with the public fallback anyone could forge a session.
import { jwtSecretProblem } from './lib/auth-check.js';

if (process.env.NODE_ENV === 'production') {
  const problem = jwtSecretProblem();
  if (problem) {
    console.error(`\n[otrelink] FATAL: ${problem}.`);
    console.error('[otrelink] Set JWT_SECRET to a long random string, e.g.:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
  }
}
