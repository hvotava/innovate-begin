const express = require('express');
const { TestResponse, User, sequelize } = require('../models');
const router = express.Router();

console.log('📊 Test Results API loading...');

// Get test results for specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📊 Getting test results for user: ${userId}`);
    
    const testResponses = await TestResponse.findAll({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'training_type']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Group by test sessions and calculate statistics
    const sessionStats = {};
    testResponses.forEach(response => {
      const session = response.testSession;
      if (!sessionStats[session]) {
        sessionStats[session] = {
          sessionId: session,
          trainingType: response.trainingType,
          lessonTitle: response.lessonTitle,
          startTime: response.createdAt,
          responses: [],
          totalQuestions: 0,
          completedQuestions: 0,
          averageCompletion: 0,
          averageQuality: 0,
          overallFeedback: []
        };
      }
      
      sessionStats[session].responses.push(response);
      sessionStats[session].totalQuestions++;
      if (response.isCompleted) {
        sessionStats[session].completedQuestions++;
      }
    });
    
    // Calculate averages for each session
    Object.values(sessionStats).forEach(session => {
      const completions = session.responses.map(r => r.completionPercentage || 0);
      const qualities = session.responses.map(r => r.qualityScore || 0);
      
      session.averageCompletion = completions.length > 0 
        ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length)
        : 0;
      session.averageQuality = qualities.length > 0
        ? Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length)
        : 0;
      
      // Collect unique feedback messages
      session.overallFeedback = [...new Set(
        session.responses
          .map(r => r.aiEvaluation?.feedback)
          .filter(f => f)
      )];
    });
    
    res.json({
      userId,
      totalSessions: Object.keys(sessionStats).length,
      totalResponses: testResponses.length,
      sessions: Object.values(sessionStats)
    });
    
  } catch (error) {
    console.error('❌ Error getting test results:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get test results for specific training type
router.get('/training/:trainingType', async (req, res) => {
  try {
    const { trainingType } = req.params;
    console.log(`📊 Getting test results for training: ${trainingType}`);
    
    const results = await TestResponse.findAll({
      where: { trainingType },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate training type statistics
    const stats = {
      trainingType,
      totalResponses: results.length,
      totalUsers: new Set(results.map(r => r.userId)).size,
      averageCompletion: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + (r.completionPercentage || 0), 0) / results.length)
        : 0,
      averageQuality: results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / results.length)
        : 0,
      completedCount: results.filter(r => r.isCompleted).length,
      recentResults: results.slice(0, 10) // Last 10 results
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error getting training results:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed test response by ID
router.get('/response/:responseId', async (req, res) => {
  try {
    const { responseId } = req.params;
    
    const response = await TestResponse.findByPk(responseId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'training_type']
        }
      ]
    });
    
    if (!response) {
      return res.status(404).json({ error: 'Test response not found' });
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error getting test response:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get overall progress statistics
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📈 Getting overall test statistics');
    
    const totalResponses = await TestResponse.count();
    const totalUsers = await TestResponse.count({
      distinct: true,
      col: 'userId'
    });
    
    const trainingTypeStats = await sequelize.query(`
      SELECT 
        training_type,
        COUNT(*) as response_count,
        COUNT(DISTINCT user_id) as user_count,
        AVG(completion_percentage) as avg_completion,
        AVG(quality_score) as avg_quality,
        COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_count
      FROM test_responses 
      GROUP BY training_type
      ORDER BY response_count DESC
    `, { type: sequelize.QueryTypes.SELECT });
    
    const recentActivity = await TestResponse.findAll({
      include: [
        {
          model: User,
          attributes: ['name', 'training_type']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    res.json({
      overview: {
        totalResponses,
        totalUsers,
        trainingTypes: trainingTypeStats.length
      },
      trainingTypeStats,
      recentActivity
    });
    
  } catch (error) {
    console.error('❌ Error getting overview stats:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Export test results to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { userId, trainingType, dateFrom, dateTo } = req.query;
    
    let whereClause = {};
    if (userId) whereClause.userId = userId;
    if (trainingType) whereClause.trainingType = trainingType;
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[sequelize.Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[sequelize.Op.lte] = new Date(dateTo);
    }
    
    const results = await TestResponse.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Generate CSV
    const csvHeader = 'Date,User,Email,Training Type,Lesson,Question,Response,Completion %,Quality %,Feedback\n';
    const csvRows = results.map(r => [
      r.createdAt.toISOString(),
      r.User?.name || '',
      r.User?.email || '',
      r.trainingType,
      r.lessonTitle || '',
      `"${r.question.replace(/"/g, '""')}"`,
      `"${r.userResponse?.replace(/"/g, '""') || ''}"`,
      r.completionPercentage || 0,
      r.qualityScore || 0,
      `"${r.aiEvaluation?.feedback?.replace(/"/g, '""') || ''}"`
    ].join(',')).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="test-results.csv"');
    res.send(csv);
    
  } catch (error) {
    console.error('❌ Error exporting CSV:', error.message);
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ Test Results API loaded successfully');
module.exports = router; 