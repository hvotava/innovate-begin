const express = require('express');
const { User, TestSession, Attempt } = require('../models');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all users with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      [require('sequelize').Op.or]: [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { phone: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    res.json({
      users: rows,
      totalUsers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: TestSession,
          limit: 10,
          order: [['started_at', 'DESC']]
        },
        {
          model: Attempt,
          limit: 10,
          order: [['started_at', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('language').optional().isIn(['cs', 'en']).withMessage('Invalid language')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, language = 'cs', current_lesson_level = 0 } = req.body;

    const user = await User.create({
      name,
      phone,
      language,
      current_lesson_level
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('language').optional().isIn(['cs', 'en']).withMessage('Invalid language'),
  body('current_lesson_level').optional().isInt({ min: 0 }).withMessage('Invalid lesson level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update(req.body);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for related records
    const testSessionsCount = await TestSession.count({ where: { user_id: req.params.id } });
    const attemptsCount = await Attempt.count({ where: { user_id: req.params.id } });

    if (testSessionsCount > 0 || attemptsCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete user with related records',
        details: {
          testSessions: testSessionsCount,
          attempts: attemptsCount
        },
        forceDeleteUrl: `/api/users/${req.params.id}/force`
      });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Force delete user (with all related records)
router.delete('/:id/force', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related records first
    await TestSession.destroy({ where: { user_id: req.params.id } });
    await Attempt.destroy({ where: { user_id: req.params.id } });
    
    // Delete user
    await user.destroy();
    
    res.json({ message: 'User and all related records deleted successfully' });
  } catch (error) {
    console.error('Force delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Call user via Twilio
router.post('/:id/call', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { lessonId } = req.body;

    // Here we would integrate with Twilio service
    // For now, return mock response
    const callResponse = {
      success: true,
      callId: `call_${Date.now()}`,
      message: `Volání zahájeno pro ${user.name} na číslo ${user.phone}`,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
      },
      lessonId: lessonId || null
    };

    // TODO: Integrate with actual Twilio service
    // const twilioService = require('../services/twilioService');
    // const result = await twilioService.initiateCall(user.phone, lessonId);

    res.json(callResponse);
  } catch (error) {
    console.error('Call user error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// Get user's call history
router.get('/:id/calls', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock call history - replace with actual call logs
    const callHistory = [
      {
        id: 1,
        callId: 'call_123456',
        status: 'completed',
        duration: 180,
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(Date.now() - 3420000),
        lessonId: 1
      },
      {
        id: 2,
        callId: 'call_123457',
        status: 'no-answer',
        duration: 0,
        startedAt: new Date(Date.now() - 7200000),
        endedAt: null,
        lessonId: 1
      }
    ];

    res.json(callHistory);
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// Get user's test sessions
router.get('/:id/test-sessions', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const testSessions = await TestSession.findAll({
      where: { user_id: req.params.id },
      order: [['started_at', 'DESC']],
      limit: 20
    });

    res.json(testSessions);
  } catch (error) {
    console.error('Get test sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch test sessions' });
  }
});

// Get user's progress
router.get('/:id/progress', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const testSessions = await TestSession.findAll({
      where: { 
        user_id: req.params.id,
        is_completed: true
      },
      order: [['completed_at', 'DESC']]
    });

    const progress = {
      totalTests: testSessions.length,
      averageScore: testSessions.length > 0 
        ? testSessions.reduce((sum, session) => sum + (session.current_score || 0), 0) / testSessions.length
        : 0,
      currentLevel: user.current_lesson_level,
      recentSessions: testSessions.slice(0, 5),
      progressOverTime: testSessions.map(session => ({
        date: session.completed_at,
        score: session.current_score
      }))
    };

    res.json(progress);
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

module.exports = router; 