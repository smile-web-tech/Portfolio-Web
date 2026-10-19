// Vercel serverless entry. vercel.json rewrites /api/* here; Express routes on the original path.
import { createApp } from '../backend/app.js';

export default createApp();
