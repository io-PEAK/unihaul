import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './src/routes/auth.js';
import itemRoutes from './src/routes/items.js';
import messageRoutes from './src/routes/messages.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/messages', messageRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Student Shop API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});