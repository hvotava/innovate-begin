const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug: Log the static path
const staticPath = path.join(__dirname, '..', 'frontend', 'build');
console.log('🔍 Static files path:', staticPath);
console.log('🔍 Current directory (__dirname):', __dirname);

// Check if build directory exists
const fs = require('fs');
if (fs.existsSync(staticPath)) {
  console.log('✅ Build directory exists');
} else {
  console.log('❌ Build directory does NOT exist');
  console.log('📁 Trying alternative paths...');
  
  // Try other possible paths
  const altPaths = [
    path.join(__dirname, 'frontend', 'build'),
    path.join(__dirname, '..', '..', 'frontend', 'build'),
    '/application/frontend/build'
  ];
  
  altPaths.forEach(altPath => {
    console.log(`🔍 Checking: ${altPath} - ${fs.existsSync(altPath) ? 'EXISTS' : 'NOT FOUND'}`);
  });
}

// Serve static assets from the React build folder
app.use(express.static(staticPath));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});

// Database connection
const { sequelize } = require('./models');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (bez force, aby se data neztratila)
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer(); 