// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const tcfRoutes = require('./routes/tcf.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));
app.use(express.json());

// Rutas
app.use('/api/tcf', tcfRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TCF Validation Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});