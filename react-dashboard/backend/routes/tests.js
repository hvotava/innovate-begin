const express = require('express');
const { body, validationResult } = require('express-validator');
const { Test, Lesson, Training, Company, TestSession, User, Attempt } = require('../models');
const { auth, adminOnly, superuserOrAdmin, contactPersonOrHigher, checkCompanyAccess } = require('../middleware/auth');
const router = express.Router();

// GET všechny testy s role-based přístupem
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const lessonId = req.query.lessonId || '';

    let whereClause = {};
    let includeClause = [
      {
        model: Lesson,
        attributes: ['id', 'title', 'trainingId'],
        include: [
          {
            model: Training,
            attributes: ['id', 'title', 'category', 'companyId'],
            include: [
              {
                model: Company,
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      }
    ];

    // Filtrování podle lessonId
    if (lessonId) {
      whereClause.lessonId = parseInt(lessonId);
    }

    // Vyhledávání podle názvu
    if (search) {
      whereClause.title = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    // Role-based přístup
    if (['regular_user', 'contact_person'].includes(req.user.role)) {
      includeClause[0].include[0].where = { companyId: req.user.companyId };
    }

    const { count, rows } = await Test.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit,
      offset,
      order: [['orderNumber', 'ASC'], ['id', 'DESC']]
    });

    res.json({
      tests: rows,
      totalTests: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// GET jednotlivý test
router.get('/:id', auth, async (req, res) => {
  try {
    let whereClause = { id: req.params.id };
    
    const test = await Test.findOne({
      where: whereClause,
      include: [
        {
          model: Lesson,
          attributes: ['id', 'title', 'content', 'trainingId'],
          include: [
            {
              model: Training,
              attributes: ['id', 'title', 'category', 'companyId'],
              include: [
                {
                  model: Company,
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // DEBUG: Log questions data for comparison
    console.log(`🔍 DEBUG: Test ${test.id} questions data:`, {
      testId: test.id,
      testTitle: test.title,
      lessonId: test.lessonId,
      questionsType: typeof test.questions,
      questionsLength: test.questions ? (Array.isArray(test.questions) ? test.questions.length : 'not array') : 'null',
      rawQuestions: test.questions
    });
    
    // Parse questions if it's a string
    let parsedQuestions = test.questions;
    if (typeof test.questions === 'string') {
      try {
        parsedQuestions = JSON.parse(test.questions);
        console.log(`🔍 DEBUG: Parsed questions from JSON string:`, parsedQuestions);
      } catch (error) {
        console.error(`❌ ERROR: Failed to parse questions JSON:`, error.message);
      }
    }
    
    // Add parsed questions to response
    test.dataValues.parsedQuestions = parsedQuestions;
    
    // ENSURE QUESTIONS ARE PROPERLY FORMATTED FOR DASHBOARD
    if (parsedQuestions && Array.isArray(parsedQuestions)) {
      const formattedQuestions = parsedQuestions.map((question, index) => {
        // Ensure correctAnswer is properly set
        const correctAnswerIndex = typeof question.correctAnswer === 'number' ? question.correctAnswer : 0;
        const correctAnswerText = question.options && question.options[correctAnswerIndex] ? question.options[correctAnswerIndex] : 'N/A';
        
        console.log(`🔍 DEBUG: Formatted question ${index + 1} for dashboard:`, {
          question: question.question,
          options: question.options,
          correctAnswer: correctAnswerIndex,
          correctAnswerText: correctAnswerText
        });
        
        return {
          ...question,
          correctAnswer: correctAnswerIndex,
          correctAnswerText: correctAnswerText
        };
      });
      
      test.dataValues.formattedQuestions = formattedQuestions;
      console.log(`✅ Formatted ${formattedQuestions.length} questions for dashboard display`);
    }

    // Role-based přístup
    if (['regular_user', 'contact_person'].includes(req.user.role)) {
      if (test.Lesson?.Training?.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// POST nový test (contact_person+ může vytvořit pro svou firmu)
router.post('/', [
  auth,
  contactPersonOrHigher,
  body('title').notEmpty().withMessage('Test title is required'),
  body('lessonId').isInt().withMessage('Valid lesson ID is required'),
  body('orderNumber').optional().isInt({ min: 0 }).withMessage('Order number must be non-negative integer'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('questions.*.question').notEmpty().withMessage('Question text is required'),
  body('questions.*.options').isArray({ min: 1 }).withMessage('At least 1 option is required'),
  body('questions.*.correctAnswer').isInt({ min: 0 }).withMessage('Correct answer index is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Test validation errors:', errors.array());
      console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, lessonId, orderNumber, questions } = req.body;
    
    console.log('✅ Test validation passed, creating test:', { title, lessonId, orderNumber, questionsCount: questions?.length });

    // Zkontroluj, jestli lekce existuje a přístup k ní
    const lesson = await Lesson.findByPk(lessonId, {
      include: [
        {
          model: Training,
          include: [{ model: Company, attributes: ['id', 'name'] }]
        }
      ]
    });

    if (!lesson) {
      return res.status(400).json({ error: 'Lesson not found' });
    }

    // Contact person může vytvářet pouze pro svou firmu
    if (req.user.role === 'contact_person' && req.user.companyId !== lesson.Training.companyId) {
      return res.status(403).json({ 
        error: 'You can only create tests for lessons in your own company' 
      });
    }

    // Automatické přiřazení order number pokud není zadané
    let finalOrderNumber = orderNumber;
    if (finalOrderNumber === undefined || finalOrderNumber === null) {
      const maxOrderTest = await Test.findOne({
        where: { lessonId },
        order: [['orderNumber', 'DESC']]
      });
      finalOrderNumber = maxOrderTest ? maxOrderTest.orderNumber + 1 : 0;
    }

    // VALIDATE AND NORMALIZE QUESTIONS DATA
    console.log('🔍 DEBUG: Questions before save:', {
      questionsType: typeof questions,
      questionsLength: Array.isArray(questions) ? questions.length : 'not array',
      sampleQuestion: Array.isArray(questions) && questions.length > 0 ? questions[0] : 'no questions'
    });
    
    // Ensure questions is properly formatted
    let normalizedQuestions = questions;
    if (Array.isArray(questions)) {
      // Validate each question structure
      normalizedQuestions = questions.map((question, index) => {
        console.log(`🔍 DEBUG: Validating question ${index + 1}:`, {
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          correctAnswerText: question.options ? question.options[question.correctAnswer] : 'N/A'
        });
        
        // Ensure correctAnswer is a number
        if (typeof question.correctAnswer !== 'number') {
          console.warn(`⚠️ WARNING: Question ${index + 1} correctAnswer is not a number:`, question.correctAnswer);
          question.correctAnswer = parseInt(question.correctAnswer) || 0;
        }
        
        return question;
      });
    }

    const test = await Test.create({
      title,
      lessonId,
      orderNumber: finalOrderNumber,
      questions: normalizedQuestions, // Save as normalized array
      trainingId: lesson.trainingId
    });

    const createdTest = await Test.findByPk(test.id, {
      include: [
        {
          model: Lesson,
          attributes: ['id', 'title'],
          include: [
            {
              model: Training,
              attributes: ['title', 'category'],
              include: [{ model: Company, attributes: ['name'] }]
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Test created successfully',
      test: createdTest
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// PUT aktualizace testu
router.put('/:id', [
  auth,
  contactPersonOrHigher,
  body('title').optional().notEmpty().withMessage('Test title cannot be empty'),
  body('orderNumber').optional().isInt({ min: 0 }).withMessage('Order number must be non-negative integer'),
  body('questions').optional().isArray({ min: 1 }).withMessage('At least one question is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const test = await Test.findByPk(req.params.id, {
      include: [
        {
          model: Lesson,
          include: [{ model: Training }]
        }
      ]
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Role-based přístup kontrola
    if (req.user.role === 'contact_person' && req.user.companyId !== test.Lesson.Training.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // VALIDATE QUESTIONS IF PROVIDED
    let updateData = { ...req.body };
    
    if (req.body.questions) {
      console.log('🔍 DEBUG: Updating questions:', {
        questionsType: typeof req.body.questions,
        questionsLength: Array.isArray(req.body.questions) ? req.body.questions.length : 'not array'
      });
      
      // Normalize questions data
      if (Array.isArray(req.body.questions)) {
        updateData.questions = req.body.questions.map((question, index) => {
          console.log(`🔍 DEBUG: Validating update question ${index + 1}:`, {
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            correctAnswerText: question.options ? question.options[question.correctAnswer] : 'N/A'
          });
          
          // Ensure correctAnswer is a number
          if (typeof question.correctAnswer !== 'number') {
            console.warn(`⚠️ WARNING: Update question ${index + 1} correctAnswer is not a number:`, question.correctAnswer);
            question.correctAnswer = parseInt(question.correctAnswer) || 0;
          }
          
          return question;
        });
      }
    }
    
    await test.update(updateData);

    const updatedTest = await Test.findByPk(test.id, {
      include: [
        {
          model: Lesson,
          include: [
            {
              model: Training,
              include: [{ model: Company, attributes: ['name'] }]
            }
          ]
        }
      ]
    });

    res.json({
      message: 'Test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ error: 'Failed to update test' });
  }
});

// DELETE test
router.delete('/:id', auth, contactPersonOrHigher, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id, {
      include: [
        {
          model: Lesson,
          include: [{ model: Training }]
        }
      ]
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Role-based přístup kontrola
    if (req.user.role === 'contact_person' && req.user.companyId !== test.Lesson.Training.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await test.destroy();

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// Legacy routes pro kompatibilitu
// Get all test sessions
router.get('/sessions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await TestSession.findAndCountAll({
      include: [
        { model: User, attributes: ['name', 'phone'] },
        { model: Lesson, attributes: ['title', 'lesson_number'] }
      ],
      order: [['started_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      testSessions: rows,
      totalSessions: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get test sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch test sessions' });
  }
});

// Get single test session  
router.get('/sessions/:id', async (req, res) => {
  try {
    const testSession = await TestSession.findByPk(req.params.id, {
      include: [
        { model: User },
        { model: Lesson },
        { model: Attempt }
      ]
    });

    if (!testSession) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    res.json(testSession);
  } catch (error) {
    console.error('Get test session error:', error);
    res.status(500).json({ error: 'Failed to fetch test session' });
  }
});

module.exports = router; 