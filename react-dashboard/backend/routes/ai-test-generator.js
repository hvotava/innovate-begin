const express = require('express');
const router = express.Router();
const { AIQuestionGenerator, QUESTION_TYPES } = require('../services/ai-question-generator');
const { Lesson } = require('../models');

/**
 * Generate AI test questions based on main question and context
 * POST /api/ai-test-generator/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { 
      mainQuestion, 
      context = '', 
      requestedTypes = [], 
      language = 'cs',
      lessonId 
    } = req.body;

    console.log('🤖 AI Test Generator API called with:', {
      mainQuestion,
      requestedTypes,
      requestedTypesArray: Array.isArray(requestedTypes),
      requestedTypesLength: requestedTypes.length,
      language,
      lessonId
    });

    // Validation
    if (!mainQuestion || mainQuestion.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Main question is required'
      });
    }

    // Get lesson context if lessonId provided
    let lessonContext = context;
    if (lessonId) {
      try {
        const lesson = await Lesson.findByPk(lessonId);
        if (lesson) {
          lessonContext = `${lessonContext}\n\nLesson: ${lesson.title}\nContent: ${lesson.content || lesson.description || ''}`.trim();
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch lesson context:', error.message);
      }
    }

    // Generate questions using AI
    const generatedQuestions = await AIQuestionGenerator.generateQuestions(
      mainQuestion,
      lessonContext,
      requestedTypes,
      language
    );

    console.log('✅ Successfully generated', generatedQuestions.length, 'questions');

    res.json({
      success: true,
      questions: generatedQuestions,
      metadata: {
        mainQuestion,
        context: lessonContext,
        requestedTypes,
        language,
        generatedAt: new Date().toISOString(),
        count: generatedQuestions.length
      }
    });

  } catch (error) {
    console.error('❌ AI Test Generator API error:', error.message);
    
    // If OpenAI is not available, return fallback questions as success
    if (error.message.includes('OpenAI') || error.message.includes('openai')) {
      const fallbackQuestions = AIQuestionGenerator.getFallbackQuestions(req.body.language || 'cs');
      return res.json({
        success: true,
        questions: fallbackQuestions,
        fallbackMode: true,
        message: 'AI služba není dostupná. Použity náhradní otázky.',
        metadata: {
          mainQuestion,
          requestedTypes,
          language,
          generatedAt: new Date().toISOString(),
          count: fallbackQuestions.length
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      fallbackQuestions: AIQuestionGenerator.getFallbackQuestions(req.body.language || 'cs')
    });
  }
});

/**
 * Get available question types
 * GET /api/ai-test-generator/types
 */
router.get('/types', (req, res) => {
  const language = req.query.language || 'cs';
  
  const typeDescriptions = {
    cs: {
      [QUESTION_TYPES.MULTIPLE_CHOICE]: {
        name: 'Multiple Choice',
        description: 'Otázka s jednou správnou a několika špatnými odpověďmi',
        icon: 'radio_button_checked',
        example: 'Jaký je hlavní účel obráběcích kapalin? A) Chlazení B) Mazání C) Odvod třísek D) Všechny uvedené'
      },
      [QUESTION_TYPES.FREE_TEXT]: {
        name: 'Volná odpověď',
        description: 'Otázka, na kterou student odpovídá vlastními slovy',
        icon: 'edit',
        example: 'Popište hlavní výhody použití obráběcích kapalin při obrábění kovů.'
      },
      [QUESTION_TYPES.FILL_IN_BLANK]: {
        name: 'Doplňovačka',
        description: 'Věta nebo text s chybějícími slovy',
        icon: 'text_fields',
        example: 'Obráběcí kapaliny slouží především k _____ a _____ obráběcího procesu.'
      },
      [QUESTION_TYPES.MATCHING]: {
        name: 'Přiřazování',
        description: 'Přiřazování pojmů k jejich definicím',
        icon: 'compare_arrows',
        example: 'Přiřaďte typy kapalin k jejich vlastnostem: Olejová - Vysoká mazivost, Vodní - Dobré chlazení'
      }
    },
    en: {
      [QUESTION_TYPES.MULTIPLE_CHOICE]: {
        name: 'Multiple Choice',
        description: 'Question with one correct and several wrong answers',
        icon: 'radio_button_checked',
        example: 'What is the main purpose of cutting fluids? A) Cooling B) Lubrication C) Chip removal D) All mentioned'
      },
      [QUESTION_TYPES.FREE_TEXT]: {
        name: 'Free Text',
        description: 'Question answered in student\'s own words',
        icon: 'edit',
        example: 'Describe the main advantages of using cutting fluids in metal machining.'
      },
      [QUESTION_TYPES.FILL_IN_BLANK]: {
        name: 'Fill in the Blank',
        description: 'Sentence or text with missing words',
        icon: 'text_fields',
        example: 'Cutting fluids serve primarily for _____ and _____ of the machining process.'
      },
      [QUESTION_TYPES.MATCHING]: {
        name: 'Matching',
        description: 'Matching terms to their definitions',
        icon: 'compare_arrows',
        example: 'Match fluid types to properties: Oil-based - High lubricity, Water-based - Good cooling'
      }
    }
  };

  res.json({
    success: true,
    types: QUESTION_TYPES,
    descriptions: typeDescriptions[language] || typeDescriptions.cs
  });
});

/**
 * Preview question format for a specific type
 * GET /api/ai-test-generator/preview/:type
 */
router.get('/preview/:type', (req, res) => {
  const { type } = req.params;
  const language = req.query.language || 'cs';

  if (!Object.values(QUESTION_TYPES).includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid question type'
    });
  }

  // Generate sample question structure for preview
  const sampleQuestions = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: {
      type: QUESTION_TYPES.MULTIPLE_CHOICE,
      question: 'Ukázková multiple choice otázka?',
      options: ['Možnost A', 'Možnost B', 'Možnost C', 'Možnost D'],
      correctAnswer: 'Možnost A',
      explanation: 'Vysvětlení správné odpovědi',
      difficulty: 'medium',
      keyWords: ['klíčové', 'pojmy']
    },
    [QUESTION_TYPES.FREE_TEXT]: {
      type: QUESTION_TYPES.FREE_TEXT,
      question: 'Ukázková otázka pro volnou odpověď?',
      correctAnswer: 'Vzorová správná odpověď',
      keyWords: ['důležité', 'pojmy', 'pro', 'hodnocení'],
      explanation: 'Co by měla odpověď obsahovat',
      difficulty: 'medium'
    },
    [QUESTION_TYPES.FILL_IN_BLANK]: {
      type: QUESTION_TYPES.FILL_IN_BLANK,
      question: 'Ukázková věta s _____ a _____ pro doplnění.',
      correctAnswer: 'prvním slovem',
      alternatives: ['alternativní', 'odpovědi'],
      explanation: 'Vysvětlení správných odpovědí',
      difficulty: 'medium',
      keyWords: ['kontext', 'slova']
    },
    [QUESTION_TYPES.MATCHING]: {
      type: QUESTION_TYPES.MATCHING,
      question: 'Přiřaďte pojmy k jejich definicím',
      pairs: [
        { term: 'Pojem 1', definition: 'Definice prvního pojmu' },
        { term: 'Pojem 2', definition: 'Definice druhého pojmu' },
        { term: 'Pojem 3', definition: 'Definice třetího pojmu' }
      ],
      explanation: 'Vysvětlení správného párování',
      difficulty: 'medium',
      keyWords: ['související', 'pojmy']
    }
  };

  res.json({
    success: true,
    preview: sampleQuestions[type],
    type: type
  });
});

module.exports = router; 