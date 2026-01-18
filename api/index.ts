// Vercel serverless function handler for Express app
// This file handles all /api/* routes

// For ES modules, use .js extension even when importing .ts files
// TypeScript will resolve this to .ts during compilation
import app from '../server/index.js';

export default app;
