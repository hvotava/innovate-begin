const express = require('express');
const router = express.Router();
const { User, Company } = require('../models');
const TestResult = require('../models/TestResult');
const { Op } = require('sequelize');

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