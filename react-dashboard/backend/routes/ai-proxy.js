const express = require('express');
const router = express.Router();
const axios = require('axios'); // Added for OpenAI API call

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
    console.log('📚 Content GET for company:', req.params.companyId);
    res.json({
      company_id: parseInt(req.params.companyId),
      available_sources: [
        {
          id: 1,
          title: 'Sample Training Material',
          status: 'ready',
          file_size: 1024,
          word_count: 150,
          lesson_id: 1,
          content_preview: 'This is a sample training material...'
        }
      ]
    });
  } catch (error) {
    console.error('❌ Content GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced Content Upload with Automatic Test Generation
router.post('/content/upload', async (req, res) => {
  try {
    console.log('📤 Content upload request received');
    console.log('📋 Request body:', req.body);
    console.log('📁 Files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('🏢 Company ID:', req.body.company_id);
    console.log('📝 Title:', req.body.title);
    console.log('🔧 Content type:', req.body.content_type);

    let textContent = '';
    let fileName = '';

    // Extract text content from uploaded files
    if (req.files && req.files.files) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      
      for (const file of files) {
        fileName = file.name;
        console.log(`📄 Processing file: ${fileName}, type: ${file.mimetype}`);
        
        if (file.mimetype === 'text/plain') {
          textContent += file.data.toString('utf8') + '\n';
        } else if (file.mimetype === 'application/pdf') {
          // For now, just note that it's a PDF
          textContent += `[PDF Content from ${file.name}]\n`;
          console.log('📄 PDF upload detected, content extraction not yet implemented');
        }
      }
    }
    
    // Get lesson assignment parameters
    const lessonId = req.body.lessonId;
    const createNewLesson = req.body.createNewLesson === 'true';
    const newLessonTitle = req.body.newLessonTitle;
    const lessonCategory = req.body.lessonCategory || 'General';
    const generateTests = req.body.generateTests === 'true'; // NEW: Test generation flag
    
    console.log('📚 Lesson assignment:', {
      lessonId,
      createNewLesson,
      newLessonTitle,
      lessonCategory,
      generateTests
    });
    
    let targetLessonId = lessonId;
    
    // Create new lesson if requested
    if (createNewLesson && newLessonTitle) {
      console.log(`📚 Creating new lesson: ${newLessonTitle}`);
      
      // Find or create a default training for this content
      let training = await Training.findOne({ 
        where: { title: 'Uploaded Content Training' } 
      });
      
      if (!training) {
        training = await Training.create({
          title: 'Uploaded Content Training',
          description: 'Training created from uploaded content',
          category: lessonCategory,
          companyId: req.body.company_id || 1
        });
      }
      
      const newLesson = await Lesson.create({
        title: newLessonTitle,
        description: `Generated from uploaded file: ${fileName}`,
        content: textContent,
        lesson_type: 'lesson',
        level: 1,
        trainingId: training.id
      });
      
      targetLessonId = newLesson.id;
      console.log(`✅ New lesson created with ID: ${targetLessonId}`);
      
    } else if (lessonId) {
      // Update existing lesson with new content
      console.log(`📝 Updating existing lesson ID: ${lessonId}`);
      
      const lesson = await Lesson.findByPk(lessonId);
      if (lesson) {
        await lesson.update({
          content: (lesson.content || '') + '\n\n' + textContent,
          description: lesson.description + ` (Updated with ${fileName})`
        });
        console.log(`✅ Lesson ${lessonId} updated with new content`);
      }
    }

    // NEW: Automatic Test Generation
    let generatedTests = [];
    if (generateTests && textContent.length > 50) {
      console.log('🤖 Generating automatic tests from content...');
      
      try {
        // Generate questions using OpenAI
        const questions = await generateQuestionsFromContent(textContent, newLessonTitle || 'Generated Test');
        
        if (questions && questions.length > 0) {
          // Create test for the lesson
          const test = await Test.create({
            title: `${newLessonTitle || 'Generated'} Test`,
            description: `Automatically generated test from uploaded content`,
            questions: JSON.stringify(questions),
            lessonId: targetLessonId,
            type: 'multiple_choice',
            timeLimit: 600, // 10 minutes
            passingScore: 70
          });
          
          generatedTests.push({
            testId: test.id,
            title: test.title,
            questionCount: questions.length,
            type: 'multiple_choice'
          });
          
          console.log(`✅ Generated test with ${questions.length} questions`);
        }
      } catch (testGenError) {
        console.error('❌ Test generation failed:', testGenError.message);
        // Continue without test generation
      }
    }

    const uploadedSources = [{
      id: Date.now(),
      title: req.body.title || fileName || 'Uploaded Content',
      status: 'ready',
      file_size: req.files && req.files.files ? req.files.files.size || textContent.length : textContent.length,
      word_count: textContent.split(' ').length,
      lesson_id: targetLessonId,
      content_preview: textContent.substring(0, 200) + '...',
      generated_tests: generatedTests // NEW: Include generated tests
    }];

    console.log('✅ Content upload successful:', uploadedSources[0]);
    console.log('📊 Response data:', {
      success: true,
      uploadedSources,
      message: `Successfully uploaded ${fileName || 'content'}`
    });
    res.json({
      success: true,
      uploaded_sources: uploadedSources,
      message: `Successfully uploaded content: ${uploadedSources[0].title}`,
      lesson_assignment: targetLessonId ? `Assigned to lesson ID: ${targetLessonId}` : 'No lesson assignment',
      generated_tests: generatedTests.length > 0 ? `Generated ${generatedTests.length} test(s)` : 'No tests generated'
    });

  } catch (error) {
    console.error('❌ Content upload error:', error.message);
    console.error('📋 Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEW: Function to generate questions from content using OpenAI
async function generateQuestionsFromContent(content, lessonTitle) {
  try {
    console.log('🤖 Generating questions using OpenAI...');
    
    // Prepare prompt for OpenAI
    const prompt = `Based on the following educational content, generate 5 multiple choice questions. 
    Each question should have 4 options (A, B, C, D) with only one correct answer.
    
    Content: ${content.substring(0, 2000)} // Limit content length
    
    Requirements:
    - 5 questions total
    - Each question has 4 options (A, B, C, D)
    - Only one correct answer per question
    - Questions should test understanding of key concepts
    - Format as JSON array with structure:
    [
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0
      }
    ]
    
    Return only the JSON array, no additional text.`;
    
    // Call OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an educational content expert. Generate clear, accurate multiple choice questions based on provided content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const generatedText = response.data.choices[0].message.content;
    console.log('🤖 OpenAI response:', generatedText);
    
    // Parse JSON response
    const questions = JSON.parse(generatedText);
    
    // Validate questions structure
    if (Array.isArray(questions) && questions.length > 0) {
      const validatedQuestions = questions.map((q, index) => ({
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0
      }));
      
      console.log(`✅ Generated ${validatedQuestions.length} validated questions`);
      return validatedQuestions;
    }
    
    throw new Error('Invalid question format from OpenAI');
    
  } catch (error) {
    console.error('❌ Question generation error:', error.message);
    return [];
  }
}

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