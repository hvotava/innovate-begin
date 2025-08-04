const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// Get Python backend URL
const getPythonBackendUrl = () => {
  return process.env.PYTHON_BACKEND_URL || 'https://lecture-app-production.up.railway.app';
};

// Proxy for content upload
router.post('/upload', async (req, res) => {
  try {
    console.log('📁 Content upload proxy called');
    console.log('🔧 Files:', req.files);
    console.log('📝 Body:', req.body);

    const pythonBackendUrl = getPythonBackendUrl();
    
    // Create FormData for forwarding to Python backend
    const formData = new FormData();
    
    // Add form fields
    if (req.body.company_id) formData.append('company_id', req.body.company_id);
    if (req.body.title) formData.append('title', req.body.title);
    if (req.body.content_type) formData.append('content_type', req.body.content_type);
    
    // Add files
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      files.forEach(file => {
        formData.append('files', file.data, {
          filename: file.name,
          contentType: file.mimetype
        });
      });
    }

    console.log('🚀 Forwarding to Python backend:', `${pythonBackendUrl}/api/content/upload`);

    // Forward to Python backend
    const response = await axios.post(`${pythonBackendUrl}/api/content/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    console.log('✅ Python backend response:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('❌ Content upload proxy error:', error.message);
    console.error('📋 Error details:', error.response?.data);
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message || 'Upload failed'
    });
  }
});

// Proxy for getting company content sources
router.get('/company/:companyId', async (req, res) => {
  try {
    const pythonBackendUrl = getPythonBackendUrl();
    const response = await axios.get(`${pythonBackendUrl}/api/content/company/${req.params.companyId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Content sources proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message
    });
  }
});

// Proxy for course generation
router.post('/:contentSourceId/generate-course', async (req, res) => {
  try {
    const pythonBackendUrl = getPythonBackendUrl();
    const response = await axios.post(
      `${pythonBackendUrl}/api/content/${req.params.contentSourceId}/generate-course`, 
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error('Course generation proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message
    });
  }
});

module.exports = router; 