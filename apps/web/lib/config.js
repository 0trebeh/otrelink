// Central place for environment configuration.
export const config = {
  dbDriver: process.env.DB_DRIVER || (process.env.MONGODB_URI ? 'mongo' : 'file'),
  mongoUri: process.env.MONGODB_URI || '',
  mongoDb: process.env.MONGODB_DB || 'otrelink',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  pageUrl: (process.env.NEXT_PUBLIC_PAGE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  corsOrigins: (process.env.PUBLIC_CORS_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean),
  maxUploadBytes: 3 * 1024 * 1024,
  pagesPerUser: 10,
};

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) console.warn('[otrelink] JWT_SECRET is not set. Set it before deploying!');
  if (!process.env.NEXT_PUBLIC_PAGE_URL) console.warn('[otrelink] NEXT_PUBLIC_PAGE_URL is not set: "View page" links will point to http://localhost:5173');
}
