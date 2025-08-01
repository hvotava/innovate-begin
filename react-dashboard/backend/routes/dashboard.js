const express = require('express');
const { Op } = require('sequelize');
const { User, Lesson, Attempt, TestSession, Answer, sequelize } = require('../models');
const router = express.Router();

// Dashboard overview stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalLessons,
      totalAttempts,
      completedTests,
      activeTests,
      averageScore,
      recentActivity
    ] = await Promise.all([
      // Total users
      User.count(),
      
      // Total lessons
      Lesson.count(),
      
      // Total attempts
      Attempt.count(),
      
      // Completed tests
      TestSession.count({ where: { is_completed: true } }),
      
      // Active tests
      TestSession.count({ where: { is_completed: false } }),
      
      // Average score
      TestSession.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('current_score')), 'avgScore']],
        where: { is_completed: true }
      }),
      
      // Recent activity (last 7 days)
      TestSession.count({
        where: {
          started_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      totalUsers,
      totalLessons,
      totalAttempts,
      completedTests,
      activeTests,
      averageScore: averageScore?.dataValues?.avgScore || 0,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// User performance analytics
router.get('/user-performance', async (req, res) => {
  try {
    const userPerformance = await User.findAll({
      attributes: [
        'id',
        'name',
        'current_lesson_level',
        [sequelize.fn('COUNT', sequelize.col('TestSessions.id')), 'totalTests'],
        [sequelize.fn('AVG', sequelize.col('TestSessions.current_score')), 'avgScore'],
        [sequelize.fn('MAX', sequelize.col('TestSessions.completed_at')), 'lastActivity']
      ],
      include: [{
        model: TestSession,
        attributes: [],
        where: { is_completed: true },
        required: false
      }],
      group: ['User.id'],
      order: [[sequelize.fn('AVG', sequelize.col('TestSessions.current_score')), 'DESC']]
    });

    res.json(userPerformance);
  } catch (error) {
    console.error('User performance error:', error);
    res.status(500).json({ error: 'Failed to fetch user performance' });
  }
});

// Lesson analytics
router.get('/lesson-analytics', async (req, res) => {
  try {
    const lessonAnalytics = await Lesson.findAll({
      attributes: [
        'id',
        'title',
        'lesson_number',
        'lesson_type',
        [sequelize.fn('COUNT', sequelize.col('TestSessions.id')), 'totalAttempts'],
        [sequelize.fn('AVG', sequelize.col('TestSessions.current_score')), 'avgScore'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN TestSessions.is_completed = true THEN 1 END')), 'completedAttempts']
      ],
      include: [{
        model: TestSession,
        attributes: [],
        required: false
      }],
      group: ['Lesson.id'],
      order: [['lesson_number', 'ASC']]
    });

    res.json(lessonAnalytics);
  } catch (error) {
    console.error('Lesson analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson analytics' });
  }
});

// Recent activity feed
router.get('/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const recentActivity = await TestSession.findAll({
      attributes: [
        'id',
        'current_score',
        'is_completed',
        'started_at',
        'completed_at'
      ],
      include: [
        {
          model: User,
          attributes: ['name', 'phone']
        },
        {
          model: Lesson,
          attributes: ['title', 'lesson_number']
        }
      ],
      order: [['started_at', 'DESC']],
      limit
    });

    res.json(recentActivity);
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Score distribution
router.get('/score-distribution', async (req, res) => {
  try {
    const scoreDistribution = await sequelize.query(`
      SELECT 
        CASE 
          WHEN current_score >= 90 THEN 'Excellent (90-100%)'
          WHEN current_score >= 80 THEN 'Good (80-89%)'
          WHEN current_score >= 70 THEN 'Average (70-79%)'
          WHEN current_score >= 60 THEN 'Below Average (60-69%)'
          ELSE 'Poor (<60%)'
        END as score_range,
        COUNT(*) as count
      FROM test_sessions 
      WHERE is_completed = true AND current_score IS NOT NULL
      GROUP BY score_range
      ORDER BY MIN(current_score) DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json(scoreDistribution);
  } catch (error) {
    console.error('Score distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch score distribution' });
  }
});

// Progress over time
router.get('/progress-over-time', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const progressData = await sequelize.query(`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as completed_tests,
        AVG(current_score) as avg_score
      FROM test_sessions 
      WHERE is_completed = true 
        AND completed_at >= :startDate
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `, {
      replacements: { startDate },
      type: sequelize.QueryTypes.SELECT
    });

    res.json(progressData);
  } catch (error) {
    console.error('Progress over time error:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

// Failed categories analysis
router.get('/failed-categories', async (req, res) => {
  try {
    const failedCategories = await sequelize.query(`
      SELECT 
        category,
        COUNT(*) as failure_count
      FROM (
        SELECT jsonb_array_elements_text(failed_categories) as category
        FROM test_sessions 
        WHERE failed_categories IS NOT NULL 
          AND jsonb_array_length(failed_categories) > 0
      ) as categories
      GROUP BY category
      ORDER BY failure_count DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    res.json(failedCategories);
  } catch (error) {
    console.error('Failed categories error:', error);
    res.status(500).json({ error: 'Failed to fetch failed categories' });
  }
});

module.exports = router; 