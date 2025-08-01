const express = require('express');
const { User, Company, Training, Lesson, Test, TestSession, Attempt } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// GET dashboard statistiky (pouze pro admin)
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    // Základní počty
    const [
      totalUsers,
      totalCompanies,
      totalTrainings,
      totalLessons,
      totalTests,
      recentUsers,
      recentTrainings
    ] = await Promise.all([
      User.count(),
      Company.count(),
      Training.count(),
      Lesson.count(),
      Test.count(),
      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Posledních 30 dní
          }
        }
      }),
      Training.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Posledních 30 dní
          }
        }
      })
    ]);

    // Uživatelé podle rolí
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['role']
    });

    // Společnosti s počtem uživatelů
    const companiesWithUsers = await Company.findAll({
      attributes: [
        'id',
        'name',
        [require('sequelize').fn('COUNT', require('sequelize').col('Users.id')), 'userCount']
      ],
      include: [
        {
          model: User,
          attributes: []
        }
      ],
      group: ['Company.id'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('Users.id')), 'DESC']],
      limit: 5
    });

    // Aktivita za posledních 7 dní
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayUsers = await User.count({
        where: {
          created_at: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      });

      const dayTrainings = await Training.count({
        where: {
          created_at: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      });

      last7Days.push({
        date: startOfDay.toISOString().split('T')[0],
        users: dayUsers,
        trainings: dayTrainings,
        lessons: 0, // Placeholder
        tests: 0    // Placeholder
      });
    }

    // Sestavení response
    const stats = {
      overview: {
        totalUsers,
        totalCompanies,
        totalTrainings,
        totalLessons,
        totalTests,
        recentUsers,
        recentTrainings
      },
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: parseInt(item.dataValues.count)
      })),
      topCompanies: companiesWithUsers.map(company => ({
        id: company.id,
        name: company.name,
        userCount: parseInt(company.dataValues.userCount)
      })),
      activityChart: last7Days,
      growth: {
        usersGrowth: recentUsers > 0 ? `+${recentUsers}` : '0',
        trainingsGrowth: recentTrainings > 0 ? `+${recentTrainings}` : '0'
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// GET rychlé akce pro dashboard
router.get('/quick-actions', auth, adminOnly, async (req, res) => {
  try {
    // Posledních 5 uživatelů
    const recentUsers = await User.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Company,
          attributes: ['name']
        }
      ]
    });

    // Nejnovější školení
    const recentTrainings = await Training.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Company,
          attributes: ['name']
        }
      ]
    });

    res.json({
      recentUsers,
      recentTrainings
    });
  } catch (error) {
    console.error('Dashboard quick actions error:', error);
    res.status(500).json({ error: 'Failed to fetch quick actions' });
  }
});

module.exports = router; 
module.exports = router; 