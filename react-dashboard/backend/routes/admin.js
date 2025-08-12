const express = require('express');
const axios = require('axios');
const { auth, adminOnly } = require('../middleware/auth');
const { fixLessonNumbering } = require('../scripts/fix-lesson-numbering');
const router = express.Router();

// Run database migration by calling Python backend
router.post('/run-migration', auth, adminOnly, async (req, res) => {
  try {
    console.log('🔄 Admin migration request received');
    console.log('👤 User:', req.user ? { id: req.user.id, role: req.user.role, email: req.user.email } : 'No user');

    // Call Python backend migration endpoint
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://lecture-app-production.up.railway.app';
    const migrationUrl = `${pythonBackendUrl}/admin/migrate-db`;

    console.log('🐍 Calling Python migration:', migrationUrl);

    const response = await axios.get(migrationUrl, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'NodeJS-Admin-Migration'
      }
    });

    console.log('✅ Python migration response:', response.data);

    // Return success response with migration results
    res.json({
      success: true,
      message: 'Database migration completed successfully',
      migrations: response.data.migrations || [],
      details: response.data
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    
    let errorMessage = 'Failed to run database migration';
    let errorDetails = {};

    if (error.response) {
      // Python backend returned an error response
      console.error('🐍 Python backend error:', error.response.status, error.response.data);
      errorMessage = error.response.data?.error || `Python backend error: ${error.response.status}`;
      errorDetails = error.response.data || {};
    } else if (error.request) {
      // Network error
      console.error('🌐 Network error:', error.message);
      errorMessage = 'Could not connect to Python backend for migration';
    } else {
      // Other error
      console.error('⚠️ Other error:', error.message);
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails
    });
  }
});

// Health check endpoint for admin features
router.get('/health', auth, adminOnly, async (req, res) => {
  try {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://lecture-app-production.up.railway.app';
    
    // Test connection to Python backend
    const response = await axios.get(`${pythonBackendUrl}/health`, {
      timeout: 10000
    });

    res.json({
      success: true,
      nodeBackend: 'healthy',
      pythonBackend: response.status === 200 ? 'healthy' : 'error',
      pythonResponse: response.data
    });

  } catch (error) {
    console.error('❌ Health check error:', error.message);
    
    res.json({
      success: false,
      nodeBackend: 'healthy',
      pythonBackend: 'error',
      error: error.message
    });
  }
});

// Fix lesson numbering (admin only)
router.post('/fix-lesson-numbering', [auth, adminOnly], async (req, res) => {
  try {
    console.log('🔢 Admin triggered lesson renumbering migration');
    
    // Run the migration in background
    fixLessonNumbering()
      .then(() => {
        console.log('✅ Lesson renumbering migration completed successfully');
      })
      .catch(error => {
        console.error('❌ Lesson renumbering migration failed:', error);
      });
    
    res.json({
      success: true,
      message: 'Lesson renumbering migration started. Check server logs for progress.',
      details: 'This will renumber all lessons starting from 1 and create missing tests with matching IDs.'
    });
    
  } catch (error) {
    console.error('❌ Error starting lesson renumbering:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 