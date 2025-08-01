const express = require('express');
const { Lesson, Training, Company, TestSession } = require('../models');
const { body, validationResult } = require('express-validator');
const { auth, adminOnly, superuserOrAdmin, contactPersonOrHigher, checkCompanyAccess } = require('../middleware/auth');
const router = express.Router();

// GET všechny lekce (s podporou role-based přístupu)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const trainingId = req.query.trainingId || '';

    let whereClause = {};
    let includeClause = [
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
    ];

    // Filtrování podle trainingId
    if (trainingId) {
      whereClause.trainingId = parseInt(trainingId);
    }

    // Vyhledávání podle názvu
    if (search) {
      whereClause.title = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    // Role-based přístup
    if (['regular_user', 'contact_person'].includes(req.user.role)) {
      includeClause[0].where = { companyId: req.user.companyId };
    }

    const { count, rows } = await Lesson.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    res.json({
      lessons: rows,
      totalLessons: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get single lesson
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// POST nová lekce (contact_person+ může vytvořit pro svou firmu)
router.post('/', [
  auth,
  contactPersonOrHigher,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('trainingId').isInt().withMessage('Valid training ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, trainingId } = req.body;

    // Zkontroluj, jestli školení existuje
    const training = await Training.findByPk(trainingId, {
      include: [{ model: Company, attributes: ['id', 'name'] }]
    });

    if (!training) {
      return res.status(400).json({ error: 'Training not found' });
    }

    // Contact person může vytvářet pouze pro svou firmu
    if (req.user.role === 'contact_person' && req.user.companyId !== training.companyId) {
      return res.status(403).json({ 
        error: 'You can only create lessons for trainings in your own company' 
      });
    }

    const lesson = await Lesson.create({
      title,
      content,
      trainingId,
      // Zachová původní pole pro kompatibilitu
      description: content,
      language: 'cs',
      level: 'beginner',
      lesson_number: 0,
      required_score: 90.0,
      lesson_type: 'standard'
    });

    const createdLesson = await Lesson.findByPk(lesson.id, {
      include: [
        {
          model: Training,
          attributes: ['id', 'title', 'category'],
          include: [{ model: Company, attributes: ['name'] }]
        }
      ]
    });

    res.status(201).json({
      message: 'Lesson created successfully',
      lesson: createdLesson
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson
router.put('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    await lesson.update(req.body);
    res.json(lesson);
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete lesson
router.delete('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check for related test sessions
    const testSessionsCount = await TestSession.count({ where: { lesson_id: req.params.id } });
    if (testSessionsCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete lesson with active test sessions',
        details: { testSessions: testSessionsCount }
      });
    }

    await lesson.destroy();
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

module.exports = router; 