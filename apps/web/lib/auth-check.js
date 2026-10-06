// Kept apart from auth.js so the startup check doesn't load Next's request APIs.
export function jwtSecretProblem(s = process.env.JWT_SECRET || '') {
  if (!s) return 'JWT_SECRET is not set';
  if (s.length < 32) return 'JWT_SECRET is too short (use 32+ random characters)';
  if (/change-me|dev-only/i.test(s)) return 'JWT_SECRET is a placeholder value';
  return '';
}
