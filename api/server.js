const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const applyRouter = require('../routes/apply');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and request parsing middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"]
    }
  }
}));
app.use(cors());
app.use(express.json());

// Serve frontend static files relative to root
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/v1', applyRouter);

// Fallback to index.html for single-page applications
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Database connection
const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vanguard';

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  console.log('[DATABASE] Connecting to MongoDB locally...');
  mongoose.connect(dbURI)
    .then(() => {
      console.log('[DATABASE] Connected to MongoDB database successfully.');
      app.listen(PORT, () => {
        console.log(`[SERVER] Vanguard secure network listening on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[DATABASE] Connection failed:', err.message);
      console.log('[SERVER] Server starting in offline mode...');
      app.listen(PORT, () => {
        console.log(`[SERVER] Vanguard offline mode listening on http://localhost:${PORT}`);
      });
    });
} else {
  // In serverless production environments (Vercel), Mongoose buffers operations automatically
  mongoose.connect(dbURI).catch(err => console.error('[DATABASE] Serverless connection error:', err));
}

module.exports = app;
