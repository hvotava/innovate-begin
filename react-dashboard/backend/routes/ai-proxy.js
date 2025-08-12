const express = require('express');
const router = express.Router();
const axios = require('axios'); // Added for OpenAI API call
const { Training, Lesson, Test } = require('../models');
const { AILessonGenerator } = require('../services/ai-lesson-generator');
const { PDFExtractor } = require('../services/pdf-extractor');

console.log('🤖 AI Proxy routes loading...');

// In-memory store of uploaded sources per company (simple cache for dashboard listing)
const uploadedMemory = [];

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
    const companyId = parseInt(req.params.companyId);
    console.log('📚 Content GET for company:', companyId);
    console.log('📚 uploadedMemory length:', uploadedMemory.length);

    const items = uploadedMemory
      .filter(i => i.company_id === companyId)
      .sort((a, b) => b.created_at - a.created_at)
      .map(i => ({
        id: i.id,
        title: i.title,
        status: i.status,
        file_size: i.file_size,
        word_count: i.word_count,
        lesson_id: i.lesson_id,
        content_preview: i.content_preview
      }));

    console.log('📚 Returning', items.length, 'content sources for company', companyId);

    res.json({
      success: true,
      company_id: companyId,
      content_sources: items
    });
  } catch (error) {
    console.error('❌ Content GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced Content Upload with AI Lesson Generation
router.post('/content/upload', async (req, res) => {
  // Immediately respond to client to avoid timeouts
  res.status(202).json({ 
    success: true, 
    message: 'Content upload received. Processing will continue in the background. Check the content list for updates.',
    status: 'processing'
  });

  // --- Process upload in the background after responding ---
  try {
    console.log('📤 BACKGROUND JOB: Starting enhanced content upload processing');
    console.log('📋 Request body:', req.body);
    console.log('📁 Files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('🏢 Company ID:', req.body.company_id);
    console.log('📝 Title:', req.body.title);
    console.log('🔧 Content type:', req.body.content_type);

    let textContent = '';
    let fileName = '';
    let extractionMetadata = null;

    // Extract text content from uploaded files
    if (req.files && req.files.files && (Array.isArray(req.files.files) ? req.files.files.length > 0 : true)) {
      const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
      
      for (const file of files) {
        fileName = file.name;
        console.log(`📄 BACKGROUND JOB: Processing file: ${fileName}, type: ${file.mimetype}, size: ${file.size}`);
        
        if (file.mimetype === 'text/plain') {
          textContent += file.data.toString('utf8') + '\n';
          console.log('✅ BACKGROUND JOB: Text file processed');
          
        } else if (file.mimetype === 'application/pdf') {
          console.log('📄 BACKGROUND JOB: Processing PDF file...');
          
          try {
            // Validate PDF
            const validation = PDFExtractor.validatePDF(file.data);
            if (!validation.valid) {
              console.error('❌ BACKGROUND JOB: PDF validation failed:', validation.error);
              textContent += `[PDF Error: ${validation.error}]\n`;
              continue;
            }

            // Extract text from PDF
            const extraction = await PDFExtractor.extractStructuredText(file.data);
            
            if (extraction.success) {
              textContent += extraction.text + '\n';
              extractionMetadata = extraction.metadata;
              console.log('✅ BACKGROUND JOB: PDF text extraction successful:', {
                pages: extraction.metadata.pages,
                textLength: extraction.text.length,
                sectionsCount: extraction.sections?.length || 0
              });
            } else {
              textContent += extraction.text + '\n';
              console.warn('⚠️ BACKGROUND JOB: PDF extraction used fallback:', extraction.warning);
            }
            
          } catch (pdfError) {
            console.error('❌ BACKGROUND JOB: PDF processing failed:', pdfError.message);
            textContent += `[PDF Content from ${file.name} - extraction failed: ${pdfError.message}]\n`;
          }
          
        } else {
          console.warn('⚠️ BACKGROUND JOB: Unsupported file type:', file.mimetype);
          textContent += `[Unsupported file type: ${file.name}]\n`;
        }
      }
    }

    // Handle direct text input
    if (req.body.textContent && req.body.textContent.trim()) {
      textContent += req.body.textContent + '\n';
      fileName = 'Direct Text Input';
      console.log('📝 BACKGROUND JOB: Direct text content added');
    }
    
    // Get lesson assignment parameters
    const lessonId = req.body.lessonId;
    const createNewLesson = req.body.createNewLesson === 'true';
    const newLessonTitle = req.body.newLessonTitle;
    const lessonCategory = req.body.lessonCategory || 'General';
    const generateTests = req.body.generateTests === 'true';
    const generateAILesson = req.body.generateAILesson === 'true'; // NEW: AI lesson generation option
    const language = req.body.language || 'cs';
    
    console.log('📚 BACKGROUND JOB: Lesson assignment:', {
      lessonId,
      createNewLesson,
      newLessonTitle,
      lessonCategory,
      generateTests,
      generateAILesson,
      language
    });
    
    let targetLessonId = lessonId;
    let generatedLesson = null;
    let training = null; // Define training in outer scope for test generation
    
    // Create new lesson if requested OR if no lesson assignment is provided (fallback)
    if ((createNewLesson && newLessonTitle && textContent.trim().length > 10) || 
        (!lessonId && !createNewLesson && textContent.trim().length > 10)) {
      
      // Use provided title or generate one from filename
      const actualLessonTitle = newLessonTitle || 
        fileName.replace(/\.[^/.]+$/, "") || // Remove file extension
        'Generated Lesson';
        
      console.log(`📚 BACKGROUND JOB: Creating new lesson: ${actualLessonTitle} (auto-created: ${!createNewLesson})`);
      
      // Find or create a default training for this content
      training = await Training.findOne({ 
        where: { 
          title: 'AI Generated Content',
          companyId: req.body.company_id || 1
        } 
      });
      
      if (!training) {
        training = await Training.create({
          title: 'AI Generated Content',
          description: 'Training created from AI-generated lessons',
          category: lessonCategory,
          companyId: req.body.company_id || 1
        });
        console.log('✅ BACKGROUND JOB: Created new training for AI content');
      }

      // Generate AI lesson if requested or if no specific instructions
      let lessonContent = textContent;
      let lessonDescription = `Generated from uploaded file: ${fileName}`;
      
      if ((generateAILesson || !createNewLesson) && textContent.trim().length > 50) {
        console.log('🤖 BACKGROUND JOB: Generating AI lesson from content...');
        
        try {
          generatedLesson = await AILessonGenerator.generateLesson(
            textContent,
            actualLessonTitle,
            language,
            {
              includeMetadata: true,
              structureContent: true
            }
          );
          
          lessonContent = generatedLesson.content;
          lessonDescription = `AI-generated lesson from ${fileName}. ${generatedLesson.metadata?.estimatedReadingTime || ''}`;
          
          console.log('✅ BACKGROUND JOB: AI lesson generation successful:', {
            type: generatedLesson.type,
            sectionsCount: generatedLesson.sections?.length || 0,
            contentLength: generatedLesson.content.length
          });
          
        } catch (aiError) {
          console.error('❌ BACKGROUND JOB: AI lesson generation failed:', aiError.message);
          console.log('📝 BACKGROUND JOB: Using original content as fallback');
          // Continue with original content
        }
      }
      
      // Find the highest lesson_number in this training
      const maxLessonNumber = await Lesson.findOne({
        where: { trainingId: training.id },
        order: [['lesson_number', 'DESC']]
      });
      const nextLessonNumber = (maxLessonNumber?.lesson_number || 0) + 1;
      
      console.log(`🔢 BACKGROUND JOB: Creating lesson with lesson_number: ${nextLessonNumber} for training: ${training.id}`);
      
      const newLesson = await Lesson.create({
        title: generatedLesson?.title || actualLessonTitle,
        description: lessonDescription,
        content: lessonContent,
        lesson_type: 'lesson',
        level: 1,
        trainingId: training.id,
        lesson_number: nextLessonNumber, // Add proper lesson number
        order_in_course: nextLessonNumber, // Also set order_in_course for consistency
        duration: generatedLesson?.metadata?.estimatedReadingTime ? 
          parseInt(generatedLesson.metadata.estimatedReadingTime) * 60 : 300, // Convert minutes to seconds
        metadata: JSON.stringify({
          generatedBy: 'AI',
          sourceFile: fileName,
          extractionMetadata: extractionMetadata,
          aiGenerated: !!generatedLesson,
          generationType: generatedLesson?.type || 'manual',
          sections: generatedLesson?.sections || [],
          language: language
        })
      });
      
      targetLessonId = newLesson.id;
      console.log(`✅ BACKGROUND JOB: New lesson created with ID: ${targetLessonId}`);

      // AUTO-MIGRATION: Ensure database schema is synchronized after lesson creation
      try {
        console.log('🔄 BACKGROUND JOB: Running automatic database migration...');
        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://lecture-app-production.up.railway.app';
        const migrationUrl = `${pythonBackendUrl}/admin/migrate-db`;
        
        const migrationResponse = await axios.get(migrationUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'NodeJS-Auto-Migration'
          }
        });
        
        console.log('✅ BACKGROUND JOB: Automatic migration completed successfully');
        console.log('📊 Migration results:', migrationResponse.data?.migrations || []);
        
      } catch (migrationError) {
        console.error('⚠️ BACKGROUND JOB: Automatic migration failed (non-critical):', migrationError.message);
        // Don't fail the entire process if migration fails - it's non-critical
      }
      
    } else if (lessonId) {
      // Update existing lesson with new content
      console.log(`📝 BACKGROUND JOB: Updating existing lesson ID: ${lessonId}`);
      
      const lesson = await Lesson.findByPk(lessonId, {
        include: [{ model: Training }]
      });
      if (lesson) {
        // Set training for test generation
        training = lesson.Training || await Training.findByPk(lesson.trainingId);
        let updatedContent = (lesson.content || '') + '\n\n' + textContent;
        
        // Generate AI lesson for updated content if requested
        if (generateAILesson && textContent.trim().length > 50) {
          console.log('🤖 BACKGROUND JOB: Generating AI lesson for updated content...');
          
          try {
            generatedLesson = await AILessonGenerator.generateLesson(
              updatedContent,
              lesson.title,
              language
            );
            
            updatedContent = generatedLesson.content;
            
            console.log('✅ BACKGROUND JOB: AI lesson update successful');
            
          } catch (aiError) {
            console.error('❌ BACKGROUND JOB: AI lesson update failed:', aiError.message);
            // Continue with original content
          }
        }
        
        await lesson.update({
          content: updatedContent,
          description: lesson.description + ` (Updated with ${fileName})`,
          metadata: JSON.stringify({
            ...JSON.parse(lesson.metadata || '{}'),
            lastUpdated: new Date().toISOString(),
            updatedWith: fileName,
            aiGenerated: !!generatedLesson
          })
        });
        console.log(`✅ BACKGROUND JOB: Lesson ${lessonId} updated with new content`);
      }
    }

    // Generate tests if requested
    let generatedTests = [];
    if (generateTests && textContent && textContent.trim().length > 50) {
      console.log('🤖 BACKGROUND JOB: Generating automatic tests from content...');
      
      // Ensure we have training for test generation
      if (!training && targetLessonId) {
        console.log('🔍 BACKGROUND JOB: Looking up training for lesson to generate tests...');
        const lesson = await Lesson.findByPk(targetLessonId, {
          include: [{ model: Training }]
        });
        training = lesson?.Training || await Training.findByPk(lesson?.trainingId);
      }
      
      try {
        const questions = await generateQuestionsFromContent(textContent, newLessonTitle || 'Generated Test');
        console.log(`✅ BACKGROUND JOB: Generated ${questions.length} validated questions`);
        
        if (questions && questions.length > 0 && targetLessonId && training) {
          console.log(`🔢 BACKGROUND JOB: Creating test with ID ${targetLessonId} (same as lesson ID) for training: ${training.id}`);
          
          // Check if test with same ID as lesson already exists
          const existingTest = await Test.findByPk(targetLessonId);
          
          let test;
          if (existingTest) {
            console.log(`⚠️ BACKGROUND JOB: Test with ID ${targetLessonId} already exists, updating it`);
            test = await existingTest.update({
              title: `${newLessonTitle || 'Generated'} Test`,
              questions: questions,
              lessonId: targetLessonId,
              trainingId: training.id
            });
          } else {
            // Create test with specific ID (same as lesson ID)
            test = await Test.create({
              id: targetLessonId, // Set specific ID to match lesson
              title: `${newLessonTitle || 'Generated'} Test`,
              questions: questions,
              lessonId: targetLessonId,
              trainingId: training.id,
              orderNumber: targetLessonId // Use lesson ID as order number too
            });
          }
          
          generatedTests.push({
            testId: test.id,
            title: test.title,
            questionCount: questions.length,
            type: 'multiple_choice'
          });
          console.log(`✅ BACKGROUND JOB: Generated test with ID ${test.id} containing ${questions.length} questions`);
        } else {
          console.log(`⚠️ BACKGROUND JOB: Cannot create test - missing requirements:`, {
            questionsCount: questions?.length || 0,
            targetLessonId,
            trainingId: training?.id
          });
        }
      } catch (testGenError) {
        console.error('❌ BACKGROUND JOB: Test generation failed:', testGenError.message, testGenError.stack);
      }
    }

    const uploadedSources = [{
      id: Date.now(),
      company_id: parseInt(req.body.company_id || '0') || 0,
      title: req.body.title || fileName || 'Uploaded Content',
      status: 'ready',
      file_size: req.files && req.files.files ? (Array.isArray(req.files.files) ? req.files.files[0]?.size : req.files.files.size) || (textContent ? Buffer.byteLength(textContent, 'utf8') : 0) : (textContent ? Buffer.byteLength(textContent, 'utf8') : 0),
      word_count: (textContent || '').split(' ').filter(Boolean).length,
      lesson_id: targetLessonId,
      content_preview: (textContent || '').substring(0, 200) + '...',
      generated_tests: generatedTests,
      ai_generated: !!generatedLesson,
      extraction_metadata: extractionMetadata,
      created_at: Date.now()
    }];

    // Save to in-memory store for listing
    uploadedMemory.push(uploadedSources[0]);

    console.log('✅ BACKGROUND JOB: Enhanced content upload successful:', {
      ...uploadedSources[0],
      aiGenerated: !!generatedLesson,
      pdfExtracted: !!extractionMetadata
    });

  } catch (error) {
    console.error('❌ BACKGROUND JOB ERROR: Enhanced content upload error:', error.message);
    console.error('Stack trace:', error.stack);
  }
});

// NEW: Function to generate questions from content using OpenAI
async function generateQuestionsFromContent(content, lessonTitle) {
  try {
    console.log('🤖 BACKGROUND JOB: Generating questions using OpenAI...');
    
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
    console.log('🤖 BACKGROUND JOB: OpenAI response:', generatedText);
    
    // Parse JSON response
    const questions = JSON.parse(generatedText);
    
    // Validate questions structure
    if (Array.isArray(questions) && questions.length > 0) {
      const validatedQuestions = questions.map((q, index) => ({
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0
      }));
      
      console.log(`✅ BACKGROUND JOB: Generated ${validatedQuestions.length} validated questions`);
      return validatedQuestions;
    }
    
    throw new Error('Invalid question format from OpenAI');
    
  } catch (error) {
    console.error('❌ BACKGROUND JOB: Question generation error:', error.message);
    return [];
  }
}

// AI Lesson Generation endpoint
router.post('/lesson/generate-structured', async (req, res) => {
  try {
    console.log('🧠 AI Lesson Generation request:', {
      title: req.body.title,
      contentLength: req.body.content?.length || 0,
      language: req.body.language || 'cs'
    });

    const { title, content, language = 'cs', companyId = 1 } = req.body;
    
    if (!title || !content) {
      console.error('❌ Missing required fields: title or content');
      return res.status(400).json({ 
        error: 'Title and content are required',
        received: { title: !!title, content: !!content }
      });
    }

    // Generate lesson using AI service
    console.log('🤖 Calling AILessonGenerator...');
    const generatedLesson = await AILessonGenerator.generateLesson(
      content, 
      title, 
      language,
      {
        includeQuestions: false,
        maxSections: 8,
        targetLength: 'medium'
      }
    );

    console.log('✅ AI lesson generated successfully:', {
      title: generatedLesson.title,
      sectionsCount: generatedLesson.sections?.length || 0,
      contentLength: generatedLesson.content?.length || 0
    });

    // Find or create a default training for AI-generated lessons
    console.log('🔍 Finding or creating default training for AI lessons...');
    let defaultTraining = await Training.findOne({
      where: { 
        companyId: companyId,  // Fixed: use camelCase
        title: 'AI Generated Lessons'
      }
    });

    if (!defaultTraining) {
      console.log('📝 Creating default AI training...');
      defaultTraining = await Training.create({
        title: 'AI Generated Lessons',
        description: 'Automatically generated lessons using AI',
        companyId: companyId,  // Fixed: use camelCase
        category: 'AI Generated',
        created_at: new Date()
      });
      console.log('✅ Default AI training created:', defaultTraining.id);
    } else {
      console.log('✅ Found existing AI training:', defaultTraining.id);
    }

    // Find the highest lesson_number in this training for proper sequencing
    const maxLessonNumber = await Lesson.findOne({
      where: { trainingId: defaultTraining.id },
      order: [['lesson_number', 'DESC']]
    });
    const nextLessonNumber = (maxLessonNumber?.lesson_number || 0) + 1;
    
    console.log(`🔢 Creating AI lesson with lesson_number: ${nextLessonNumber} for training: ${defaultTraining.id}`);

    // Create lesson in database
    const lessonData = {
      title: generatedLesson.title || title,
      content: generatedLesson.content || content,
      trainingId: defaultTraining.id, // Add required trainingId
      lesson_number: nextLessonNumber, // Add proper lesson number
      order_in_course: nextLessonNumber, // Also set order_in_course for consistency
      description: `AI Generated lesson: ${generatedLesson.title || title}`,
      language: language,
      level: generatedLesson.difficulty || 'beginner',
      base_difficulty: generatedLesson.difficulty || 'medium',
      lesson_type: 'ai_generated',
      script: JSON.stringify({
        aiGenerated: true,
        originalTitle: title,
        language: language,
        sections: generatedLesson.sections || [],
        keyTopics: generatedLesson.keyTopics || [],
        generatedAt: new Date().toISOString(),
        estimatedDuration: generatedLesson.estimatedDuration || 10
      }),
      created_at: new Date()
    };

    console.log('💾 Creating lesson in database...');
    const savedLesson = await Lesson.create(lessonData);
    
    console.log('✅ Lesson saved to database:', {
      id: savedLesson.id,
      title: savedLesson.title
    });

    // AUTO-MIGRATION: Ensure database schema is synchronized after AI lesson creation
    try {
      console.log('🔄 Running automatic database migration after AI lesson creation...');
      const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'https://lecture-app-production.up.railway.app';
      const migrationUrl = `${pythonBackendUrl}/admin/migrate-db`;
      
      const migrationResponse = await axios.get(migrationUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'NodeJS-Auto-Migration-AI'
        }
      });
      
      console.log('✅ Automatic migration completed successfully after AI lesson creation');
      console.log('📊 Migration results:', migrationResponse.data?.migrations || []);
      
    } catch (migrationError) {
      console.error('⚠️ Automatic migration failed after AI lesson creation (non-critical):', migrationError.message);
      // Don't fail the response if migration fails - it's non-critical
    }

    res.json({
      success: true,
      lesson: {
        id: savedLesson.id,
        title: savedLesson.title,
        content: savedLesson.content,
        difficulty: savedLesson.difficulty,
        estimated_duration: savedLesson.estimated_duration,
        sections: generatedLesson.sections || [],
        keyTopics: generatedLesson.keyTopics || []
      },
      message: 'AI lesson generated and saved successfully'
    });

  } catch (error) {
    console.error('❌ AI Lesson Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI lesson',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
      'POST /content/upload',
      'POST /lesson/generate-structured'
    ]
  });
});

console.log('✅ AI Proxy routes loaded successfully');
module.exports = router; 