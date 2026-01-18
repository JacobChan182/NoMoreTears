// Vercel serverless function handler for Express app
// This file handles all /api/* routes

// Import from the local server directory (copied into api/ for Vercel compilation)
import app from './server/index.js';

export default app;
