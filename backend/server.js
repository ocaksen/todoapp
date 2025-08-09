const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const { initProductionDatabase } = require('./scripts/init-production-db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const backupRoutes = require('./routes/backup');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  trustProxy: true, // Trust proxy headers for Render
  skipSuccessfulRequests: true
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(limiter);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });
  
  socket.on('task-updated', (data) => {
    socket.to(`project-${data.projectId}`).emit('task-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/backup', backupRoutes);

console.log('✅ Admin routes registered at /api/admin');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API-only backend - frontend will be deployed separately

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// This is now handled above in the production static serving

// Initialize database before starting server
const startServer = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // First initialize database connection
      await require('./config/database').initializeDatabase();
      
      // Then check if tables exist
      const db = require('./config/database').getConnection();
      const [tables] = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      
      if (tables.length === 0) {
        console.log('🔄 First time setup - creating tables and sample data...');
        await require('./scripts/init-production-db').initProductionDatabase();
      } else {
        console.log('✅ Database already exists - skipping table creation');
      }
    } else {
      await initializeDatabase();
    }
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      
      // Skip backup service on free hosting plans
      if (process.env.NODE_ENV === 'production' && process.env.ENABLE_BACKUPS === 'true') {
        console.log('🔄 Initializing automated backup system...');
        require('./services/backupService');
      }
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, io };