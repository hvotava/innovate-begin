const express = require('express');
const router = express.Router();

console.log('🤖 AI Proxy routes loading...');

// Placement Test API
router.get('/placement-test/:companyId', async (req, res) => {
  try {
    console.log('📝 Placement test GET for company:', req.params.companyId);
    res.json({
      id: 1,
      company_id: parseInt(req.params.companyId),
      questions: "Please write about your experience with English. Describe your daily activities, hobbies, and goals. This will help us determine your current level.",
      time_limit: 1800,
      min_text_length: 100,
      is_active: true,
      ai_analysis_prompt: "Analyze this text for English proficiency level"
    });
  } catch (error) {
    console.error('❌ Placement test GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/placement-test/analyze', async (req, res) => {
  try {
    console.log('🧠 Placement test analysis:', {
      user_id: req.body.user_id,
      company_id: req.body.company_id,
      text_length: req.body.text?.length || 0
    });

    const text = req.body.text || '';
    const textLength = text.length;
    
    // Simple level determination based on text analysis
    let level, confidence;
    if (textLength < 50) {
      level = 'A1';
      confidence = 0.6;
    } else if (textLength < 150) {
      level = 'A2';
      confidence = 0.75;
    } else if (textLength < 300) {
      level = 'B1';
      confidence = 0.85;
    } else {
      level = 'B2';
      confidence = 0.9;
    }

    // Count sentences and words for basic analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

    // Adjust level based on complexity
    if (avgWordsPerSentence > 15 && level === 'B1') {
      level = 'B2';
      confidence = Math.min(confidence + 0.1, 0.95);
    }

    const response = {
      success: true,
      analysis: {
        determined_level: level,
        confidence_score: confidence,
        strengths: [
          "Basic vocabulary usage",
          "Sentence structure",
          textLength > 200 ? "Text length demonstrates effort" : "Willingness to communicate"
        ],
        weaknesses: [
          textLength < 100 ? "Text length could be longer" : "Complex grammar structures",
          "Advanced vocabulary",
          "Idiomatic expressions"
        ],
        recommended_focus: level === 'A1' ? "Basic vocabulary and simple sentences" :
                          level === 'A2' ? "Past tenses and question forms" :
                          level === 'B1' ? "Complex sentences and connectors" :
                          "Advanced grammar and fluency",
        text_stats: {
          word_count: words.length,
          sentence_count: sentences.length,
          avg_words_per_sentence: Math.round(avgWordsPerSentence * 10) / 10
        }
      }
    };

    console.log('✅ Analysis complete:', { level, confidence, word_count: words.length });
    res.json(response);

  } catch (error) {
    console.error('❌ Placement analysis error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Content Management API
router.get('/content/company/:companyId', async (req, res) => {
  try {
    console.log('📚 Content sources GET for company:', req.params.companyId);
    res.json({
      content_sources: [
        {
          id: 1,
          title: "Sample English Content",
          status: "ready",
          company_id: parseInt(req.params.companyId),
          file_size: 15420,
          word_count: 850,
          created_at: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    console.error('❌ Content sources error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/content/upload', async (req, res) => {
  try {
    console.log('📁 Content upload request:', {
      files: req.files ? Object.keys(req.files) : 'none',
      body: Object.keys(req.body)
    });

    // Mock successful upload
    const uploadedSources = [{
      id: Date.now(),
      title: req.body.title || 'Uploaded Content',
      status: 'ready',
      file_size: req.files && req.files.files ? req.files.files.size || 1000 : 1000,
      word_count: Math.floor(Math.random() * 500) + 100
    }];

    console.log('✅ Content upload successful:', uploadedSources[0]);
    res.json({
      success: true,
      uploaded_sources: uploadedSources,
      message: `Successfully uploaded content: ${uploadedSources[0].title}`
    });

  } catch (error) {
    console.error('❌ Content upload error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint
router.get('/debug/status', (req, res) => {
  res.json({
    status: 'AI Proxy routes are working!',
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /placement-test/:companyId',
      'POST /placement-test/analyze', 
      'GET /content/company/:companyId',
      'POST /content/upload'
    ]
  });
});

console.log('✅ AI Proxy routes loaded successfully');
module.exports = router; 