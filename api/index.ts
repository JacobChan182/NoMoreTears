// Vercel serverless function handler for Express app
// This file handles all /api/* routes

// Import from the local server directory (copied into api/ for Vercel compilation)
// @ts-expect-error - TypeScript doesn't resolve .js imports to .ts files, but Vercel/Node.js will at runtime
import app from './server/index.js';

export default app;
