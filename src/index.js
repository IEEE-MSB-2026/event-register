#!/usr/bin/node

const dotenv = require("dotenv");
const config = require('./config');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require('fs');
const path = require('path');

const eventRoutes = require('./api/routes/eventRoutes');
const baseRoutes = require('./api/routes/baseRoutes');
const adminRoutes = require('./api/routes/adminRoutes');
const { authMiddleware, assertAuthConfig } = require('./middlewares/auth');
const { openConnection, bootstrapDefaultRoleKeys } = require("./services/keydbService");
dotenv.config();

try {
  assertAuthConfig();
} catch (err) {
  console.error(`❌ Auth configuration error: ${err.message}`);
  process.exit(1);
}


const app = express();

// Connect to MongoDB
const Port = config.port;
const MONGO_URI = config.mongo.uri;
if (!MONGO_URI || typeof MONGO_URI !== 'string') {
  console.error('❌ MongoDB connection skipped: MONGO_URI is missing or invalid.');
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB connected");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
}

// Connect to Redis (handle async errors and missing config)
const hasRedisConfig = process.env.REDIS_URL || (config.redis && config.redis.host);
if (!hasRedisConfig) {
  console.warn('⚠️ Redis config missing; skipping Redis connection.');
} else {
  openConnection()
    .then(() => bootstrapDefaultRoleKeys())
    .catch((err) => {
      console.error('❌ Redis initialization skipped due to error:', err.message);
    });
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(authMiddleware);

// Routes
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1', baseRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: config.env === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// 404 Handler
app.use((req, res) => {
  const imagePath = path.join(__dirname, '../', '404.jpg');

  fs.readFile(imagePath, (err, data) => {
    if (err) {
      res.status(500).send('Error loading 404 image.');
    } else {
      res.writeHead(404, {
        'Content-Type': 'image/jpeg',
        'Content-Length': data.length
      });
      res.end(data);
    }
  });
});

// Start the server
app.listen(Port, '0.0.0.0', () => {
  console.log(`Server is running on port ${Port}`);
});

module.exports = app;
