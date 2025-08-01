const express = require('express');
const { TestSession, User, Lesson, Attempt } = require('../models');
const router = express.Router();

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

// Get attempts
router.get('/attempts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Attempt.findAndCountAll({
      include: [
        { model: User, attributes: ['name', 'phone'] },
        { model: Lesson, attributes: ['title', 'lesson_number'] }
      ],
      order: [['started_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      attempts: rows,
      totalAttempts: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

module.exports = router; 