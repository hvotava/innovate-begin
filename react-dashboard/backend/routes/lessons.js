const express = require('express');
const { Lesson, TestSession } = require('../models');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get all lessons
router.get('/', async (req, res) => {
  try {
    const lessons = await Lesson.findAll({
      order: [['level', 'ASC']]
    });
    res.json(lessons);
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

// Create new lesson
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('level').isInt({ min: 0 }).withMessage('Invalid lesson number'),
  body('required_score').optional().isFloat({ min: 0, max: 100 }).withMessage('Invalid required score')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lesson = await Lesson.create(req.body);
    res.status(201).json(lesson);
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