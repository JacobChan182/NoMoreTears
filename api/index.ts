// Vercel serverless function handler for Express app
// This file handles all /api/* routes

// For ES modules, use .js extension even when importing .ts files
// Vercel will handle TypeScript compilation at runtime
// @ts-expect-error - TypeScript doesn't resolve .js imports to .ts files, but Vercel/Node.js will at runtime
import app from '../server/index.js';

export default app;
