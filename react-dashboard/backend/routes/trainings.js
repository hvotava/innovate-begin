const express = require('express');
const { body, validationResult } = require('express-validator');
const { Training, Company, Lesson, Test, UserTraining, User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET všechna školení (admin vidí všechna, user jen svojí)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = {};
    
    // User vidí jen školení svojí společnosti
    if (req.user.role === 'user') {
      whereClause.companyId = req.user.companyId;
    }

    if (search) {
      whereClause.title = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Training.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        },
        {
          model: Lesson,
          attributes: ['id', 'title'],
          required: false
        },
        {
          model: Test,
          attributes: ['id', 'title'],
          required: false
        }
      ]
    });

    res.json({
      trainings: rows,
      totalTrainings: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get trainings error:', error);
    res.status(500).json({ error: 'Failed to fetch trainings' });
  }
});

// GET moje školení (jen pro přihlášeného uživatele)
router.get('/my-trainings', auth, async (req, res) => {
  try {
    const userTrainings = await UserTraining.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Training,
          include: [
            { model: Company, attributes: ['name'] },
            { model: Lesson, attributes: ['id', 'title'] },
            { model: Test, attributes: ['id', 'title'] }
          ]
        }
      ],
      order: [['started_at', 'DESC']]
    });

    res.json({
      trainings: userTrainings
    });
  } catch (error) {
    console.error('Get my trainings error:', error);
    res.status(500).json({ error: 'Failed to fetch user trainings' });
  }
});

// GET jedno školení
router.get('/:id', auth, async (req, res) => {
  try {
    let whereClause = { id: req.params.id };
    
    // User může vidět jen školení swojí společnosti
    if (req.user.role === 'user') {
      whereClause.companyId = req.user.companyId;
    }

    const training = await Training.findOne({
      where: whereClause,
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        },
        {
          model: Lesson,
          attributes: ['id', 'title', 'content']
        },
        {
          model: Test,
          attributes: ['id', 'title', 'questions']
        },
        {
          model: UserTraining,
          where: { userId: req.user.id },
          required: false,
          attributes: ['progress', 'completed', 'started_at', 'completed_at']
        }
      ]
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found or access denied' });
    }

    res.json(training);
  } catch (error) {
    console.error('Get training error:', error);
    res.status(500).json({ error: 'Failed to fetch training' });
  }
});

// POST nové školení (admin only)
router.post('/', [
  auth,
  adminOnly,
  body('title').notEmpty().withMessage('Training title is required'),
  body('description').optional(),
  body('companyId').isInt().withMessage('Valid company ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, companyId } = req.body;

    // Zkontroluj, jestli společnost existuje
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ error: 'Company not found' });
    }

    const training = await Training.create({
      title,
      description,
      companyId
    });

    const createdTraining = await Training.findByPk(training.id, {
      include: [{ model: Company, attributes: ['name'] }]
    });

    res.status(201).json({
      message: 'Training created successfully',
      training: createdTraining
    });
  } catch (error) {
    console.error('Create training error:', error);
    res.status(500).json({ error: 'Failed to create training' });
  }
});

// POST přiřadit školení uživateli
router.post('/:id/assign', auth, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    const trainingId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Zkontroluj, jestli už není přiřazeno
    const existingAssignment = await UserTraining.findOne({
      where: { userId, trainingId }
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Training already assigned to this user' });
    }

    const userTraining = await UserTraining.create({
      userId,
      trainingId
    });

    res.status(201).json({
      message: 'Training assigned successfully',
      userTraining
    });
  } catch (error) {
    console.error('Assign training error:', error);
    res.status(500).json({ error: 'Failed to assign training' });
  }
});

// PUT update školení (admin only)
router.put('/:id', [
  auth,
  adminOnly,
  body('title').optional().notEmpty().withMessage('Training title cannot be empty'),
  body('description').optional(),
  body('companyId').optional().isInt().withMessage('Valid company ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const training = await Training.findByPk(req.params.id);
    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    if (req.body.companyId) {
      const company = await Company.findByPk(req.body.companyId);
      if (!company) {
        return res.status(400).json({ error: 'Company not found' });
      }
    }

    await training.update(req.body);
    
    const updatedTraining = await Training.findByPk(training.id, {
      include: [{ model: Company, attributes: ['name'] }]
    });

    res.json({
      message: 'Training updated successfully',
      training: updatedTraining
    });
  } catch (error) {
    console.error('Update training error:', error);
    res.status(500).json({ error: 'Failed to update training' });
  }
});

// DELETE školení (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id, {
      include: [
        { model: Lesson },
        { model: Test },
        { model: UserTraining }
      ]
    });

    if (!training) {
      return res.status(404).json({ error: 'Training not found' });
    }

    // Zkontroluj závislosti
    if (training.Lessons.length > 0 || training.Tests.length > 0 || training.UserTrainings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete training with existing lessons, tests, or user assignments',
        details: {
          lessons: training.Lessons.length,
          tests: training.Tests.length,
          userAssignments: training.UserTrainings.length
        }
      });
    }

    await training.destroy();
    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    console.error('Delete training error:', error);
    res.status(500).json({ error: 'Failed to delete training' });
  }
});

module.exports = router; 