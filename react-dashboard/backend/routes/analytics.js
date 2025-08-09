const express = require('express');
const router = express.Router();
const { User, Company, Lesson, Training } = require('../models');
const TestResult = require('../models/TestResult');
const { Op } = require('sequelize');

// Get detailed user progress analytics
router.get('/users/progress', async (req, res) => {
  try {
    const { companyId, userId, limit = 50 } = req.query;
    
    let whereCondition = {};
    if (companyId) whereCondition.companyId = parseInt(companyId);
    if (userId) whereCondition.id = parseInt(userId);
    
    const users = await User.findAll({ 
      where: whereCondition,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    const userProgress = await Promise.all(users.map(async (user) => {
      // Get all test results for this user
      const testResults = await TestResult.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']]
      });
      
      // Group by session to get test attempts
      const sessionStats = {};
      const lessonProgress = {};
      
      testResults.forEach(result => {
        const sessionId = result.sessionId;
        const lessonTitle = result.lessonTitle || 'Unknown Lesson';
        
        // Session statistics
        if (!sessionStats[sessionId]) {
          sessionStats[sessionId] = {
            sessionId,
            lessonTitle,
            trainingType: result.trainingType,
            startTime: result.createdAt,
            questions: [],
            totalQuestions: 0,
            correctAnswers: 0,
            score: 0,
            duration: result.recordingDuration || 0
          };
        }
        
        // Add question to session
        if (result.questionText !== 'TEST SUMMARY') {
          sessionStats[sessionId].questions.push({
            question: result.questionText,
            userAnswer: result.userAnswer,
            isCorrect: result.aiEvaluation?.isCorrect || false,
            timestamp: result.createdAt
          });
          sessionStats[sessionId].totalQuestions++;
          if (result.aiEvaluation?.isCorrect) {
            sessionStats[sessionId].correctAnswers++;
          }
        }
        
        // Lesson progress tracking
        if (!lessonProgress[lessonTitle]) {
          lessonProgress[lessonTitle] = {
            lessonTitle,
            trainingType: result.trainingType,
            attempts: 0,
            bestScore: 0,
            lastAttempt: null,
            totalQuestions: 0,
            averageScore: 0
          };
        }
        
        lessonProgress[lessonTitle].attempts++;
        lessonProgress[lessonTitle].lastAttempt = result.createdAt;
      });
      
      // Calculate scores for each session
      Object.values(sessionStats).forEach(session => {
        if (session.totalQuestions > 0) {
          session.score = Math.round((session.correctAnswers / session.totalQuestions) * 100);
        }
      });
      
      // Calculate lesson progress statistics
      Object.values(lessonProgress).forEach(lesson => {
        const lessonSessions = Object.values(sessionStats).filter(s => s.lessonTitle === lesson.lessonTitle);
        if (lessonSessions.length > 0) {
          lesson.bestScore = Math.max(...lessonSessions.map(s => s.score));
          lesson.averageScore = Math.round(lessonSessions.reduce((sum, s) => sum + s.score, 0) / lessonSessions.length);
          lesson.totalQuestions = lessonSessions[0]?.totalQuestions || 0;
        }
      });
      
      // Calculate overall user statistics
      const allSessions = Object.values(sessionStats);
      const totalAttempts = allSessions.length;
      const averageScore = totalAttempts > 0 
        ? Math.round(allSessions.reduce((sum, s) => sum + s.score, 0) / totalAttempts)
        : 0;
      const bestScore = totalAttempts > 0 ? Math.max(...allSessions.map(s => s.score)) : 0;
      const lastActivity = totalAttempts > 0 ? Math.max(...allSessions.map(s => new Date(s.startTime).getTime())) : null;
      
      // Determine performance trend (last 5 attempts)
      const recentSessions = allSessions.slice(0, 5);
      let trend = 'stable';
      if (recentSessions.length >= 3) {
        const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2));
        const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2));
        const firstAvg = firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 10) trend = 'improving';
        else if (secondAvg < firstAvg - 10) trend = 'declining';
      }
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          training_type: user.training_type,
          language: user.language,
          companyId: user.companyId,
          createdAt: user.createdAt
        },
        progress: {
          totalAttempts,
          averageScore,
          bestScore,
          lastActivity: lastActivity ? new Date(lastActivity) : null,
          trend,
          completedLessons: Object.keys(lessonProgress).length,
          totalStudyTime: allSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
        },
        lessonProgress: Object.values(lessonProgress),
        recentSessions: allSessions.slice(0, 10), // Last 10 sessions
        performanceHistory: allSessions.map(s => ({
          date: s.startTime,
          score: s.score,
          lessonTitle: s.lessonTitle,
          totalQuestions: s.totalQuestions
        }))
      };
    }));
    
    res.json({ success: true, users: userProgress });
  } catch (error) {
    console.error('User progress analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get aggregated user test stats for a company
router.get('/company/:companyId/users', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const users = await User.findAll({ where: { companyId } });
    const userIds = users.map(u => u.id);

    const results = await TestResult.findAll({
      where: { userId: { [Op.in]: userIds } },
      order: [['createdAt', 'DESC']]
    });

    const byUser = {};
    for (const u of users) {
      byUser[u.id] = { userId: u.id, name: u.name, phone: u.phone, tests: [], avg: null };
    }
    for (const r of results) {
      if (!byUser[r.userId]) continue;
      byUser[r.userId].tests.push({
        lessonId: r.lessonId,
        question: r.question,
        correct: r.isCorrect,
        score: r.scorePercentage,
        at: r.createdAt
      });
    }
    for (const u of Object.values(byUser)) {
      const scores = u.tests.map(t => t.score).filter(s => typeof s === 'number');
      u.avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
    }

    res.json({ success: true, users: Object.values(byUser) });
  } catch (e) {
    console.error('Analytics error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router; 