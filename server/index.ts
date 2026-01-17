import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db';
import analyticsRoutes from './routes/analytics';
import loginsRoutes from './routes/logins';
import lecturersRoutes from './routes/lecturers';
import studentsRoutes from './routes/students';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB().catch(console.error);

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logins', loginsRoutes);
app.use('/api/lecturers', lecturersRoutes);
app.use('/api/students', studentsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
