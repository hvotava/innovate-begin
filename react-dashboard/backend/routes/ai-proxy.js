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

    res.json({
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
    
    // Create new lesson if requested
    if (createNewLesson && newLessonTitle && textContent.trim().length > 10) {
      console.log(`📚 BACKGROUND JOB: Creating new lesson: ${newLessonTitle}`);
      
      // Find or create a default training for this content
      let training = await Training.findOne({ 
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

      // Generate AI lesson if requested
      let lessonContent = textContent;
      let lessonDescription = `Generated from uploaded file: ${fileName}`;
      
      if (generateAILesson && textContent.trim().length > 50) {
        console.log('🤖 BACKGROUND JOB: Generating AI lesson from content...');
        
        try {
          generatedLesson = await AILessonGenerator.generateLesson(
            textContent,
            newLessonTitle,
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
      
      const newLesson = await Lesson.create({
        title: generatedLesson?.title || newLessonTitle,
        description: lessonDescription,
        content: lessonContent,
        lesson_type: 'lesson',
        level: 1,
        trainingId: training.id,
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
      console.log(`✅ BACKGROUND JOB: New lesson created with ID: ${targetLessonId}`, {
        aiGenerated: !!generatedLesson,
        sectionsCount: generatedLesson?.sections?.length || 0
      });
      
    } else if (lessonId) {
      // Update existing lesson with new content
      console.log(`📝 BACKGROUND JOB: Updating existing lesson ID: ${lessonId}`);
      
      const lesson = await Lesson.findByPk(lessonId);
      if (lesson) {
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
      
      try {
        const questions = await generateQuestionsFromContent(textContent, newLessonTitle || 'Generated Test');
        if (questions && questions.length > 0) {
          const test = await Test.create({
            title: `${newLessonTitle || 'Generated'} Test`,
            description: `Automatically generated test from uploaded content`,
            questions: JSON.stringify(questions),
            lessonId: targetLessonId,
            type: 'multiple_choice',
            timeLimit: 600,
            passingScore: 70
          });
          generatedTests.push({
            testId: test.id,
            title: test.title,
            questionCount: questions.length,
            type: 'multiple_choice'
          });
          console.log(`✅ BACKGROUND JOB: Generated test with ${questions.length} questions`);
        }
      } catch (testGenError) {
        console.error('❌ BACKGROUND JOB: Test generation failed:', testGenError.message);
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