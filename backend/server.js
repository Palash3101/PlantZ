// server.js
import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";

import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import plantRouter from "./routes/plantRoutes.js";
import diseaseRouter from "./routes/diseaseRoutes.js";
import rewardsRoutes from './routes/rewardsRoutes.js';
import stressRouter from './routes/stressRoutes.js';
import chatRouter from './routes/chatRoutes.js';

const app = express();
const port = 4000;

// Validate essential environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: true,
  exposedHeaders: ['set-cookie']
}));

// Database connection
connectDB().then(() => {
  console.log('Database connected successfully');
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

// Routes
app.get('/', (req, res) => res.send("API WORKING"));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api', plantRouter);
app.use('/api/disease', diseaseRouter);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/stress', stressRouter);
app.use('/api/chat', chatRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});