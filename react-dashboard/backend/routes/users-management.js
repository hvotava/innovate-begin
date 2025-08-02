const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Company, Training, Lesson, Test, UserTraining, TestSession } = require('../models');
const { auth, adminOnly, superuserOrAdmin, contactPersonOrHigher, requireRoles, checkCompanyAccess } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { Op } = require('sequelize');

// Helper function to assign user to first available training and test
async function assignUserToFirstTrainingAndTest(userId, companyId) {
  try {
    // Find first training for the company
    const firstTraining = await Training.findOne({
      where: { companyId },
      order: [['id', 'ASC']],
      include: [
        {
          model: Lesson,
          order: [['lesson_number', 'ASC'], ['id', 'ASC']],
          limit: 1
        }
      ]
    });

    if (firstTraining) {
      // Create UserTraining record
      await UserTraining.create({
        userId,
        trainingId: firstTraining.id,
        progress: 0,
        completed: false
      });

      console.log(`✅ User ${userId} assigned to training ${firstTraining.id}`);

      // If training has a lesson, find first test
      if (firstTraining.Lessons && firstTraining.Lessons.length > 0) {
        const firstLesson = firstTraining.Lessons[0];
        
        const firstTest = await Test.findOne({
          where: { lessonId: firstLesson.id },
          order: [['orderNumber', 'ASC'], ['id', 'ASC']]
        });

        if (firstTest) {
          // Create TestSession for the test
          await TestSession.create({
            user_id: userId,
            lesson_id: firstLesson.id,
            total_questions: firstTest.questions ? firstTest.questions.length : 0,
            questions_data: firstTest.questions || [],
            current_question_index: 0,
            current_score: 0.0,
            is_completed: false
          });

          console.log(`✅ User ${userId} assigned to test ${firstTest.id} for lesson ${firstLesson.id}`);
        }
      }
    } else {
      console.log(`⚠️ No training found for company ${companyId}`);
    }
  } catch (error) {
    console.error('Error assigning user to training/test:', error);
    // Don't throw - user creation should still succeed even if assignment fails
  }
}

// GET všichni uživatelé s filtry (admin only)
router.get('/', [auth, adminOnly], async (req, res) => {
  try {
    const { search, role, company } = req.query;
    
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereConditions.role = role;
    }
    
    if (company) {
      whereConditions.companyId = company;
    }

    const users = await User.findAll({
      where: whereConditions,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['role', 'ASC'],
        ['name', 'ASC']
      ]
    });

    console.log(`📊 Found ${users.length} users matching filters`);
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT změna role uživatele (admin only)
router.put('/:id/role', [
  auth, 
  adminOnly,
  body('role').isIn(['admin', 'superuser', 'contact_person', 'regular_user'])
    .withMessage('Invalid role')
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

    const { role } = req.body;

    // Prevent removing the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot remove admin role from the last administrator' 
        });
      }
    }

    await user.update({ role });

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET uživatelé podle společnosti (contact_person+ může zobrazit svou firmu)
router.get('/company/:companyId', [auth, contactPersonOrHigher], async (req, res) => {
  try {
    const { companyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Contact person může zobrazit pouze svou firmu
    if (req.user.role === 'contact_person' && req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { count, rows } = await User.findAndCountAll({
      where: { companyId: parseInt(companyId) },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          attributes: ['id', 'name'],
          required: false
        }
      ],
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
    console.error('Get company users error:', error);
    res.status(500).json({ error: 'Failed to fetch company users' });
  }
});

// POST přidat uživatele do společnosti (contact_person+ může přidat do své firmy)
router.post('/company/:companyId', [
  auth,
  contactPersonOrHigher,
  checkCompanyAccess,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['regular_user', 'contact_person'])
    .withMessage('Only regular_user and contact_person roles can be assigned by contact persons')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyId } = req.params;
    const { name, email, password, role = 'regular_user', phone, language = 'cs' } = req.body;

    // Zkontroluj, jestli už uživatel neexistuje
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Zkontroluj, jestli společnost existuje
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Contact person může přidat pouze regular_user nebo contact_person
    if (req.user.role === 'contact_person' && !['regular_user', 'contact_person'].includes(role)) {
      return res.status(403).json({ 
        error: 'Contact persons can only assign regular_user or contact_person roles' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || null,
      language,
      companyId: parseInt(companyId),
      current_lesson_level: 0
    });

    // Automatically assign to first training and test
    await assignUserToFirstTrainingAndTest(user.id, parseInt(companyId));

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    res.status(201).json({
      message: 'User created successfully and assigned to first available training',
      user: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET statistiky uživatelů podle rolí (admin only)
router.get('/stats/roles', auth, adminOnly, async (req, res) => {
  try {
    const roleStats = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['role']
    });

    const companyStats = await Company.findAll({
      attributes: [
        'name',
        [require('sequelize').fn('COUNT', require('sequelize').col('Users.id')), 'userCount']
      ],
      include: [
        {
          model: User,
          attributes: []
        }
      ],
      group: ['Company.id', 'Company.name'],
      having: require('sequelize').literal('COUNT("Users"."id") > 0'),
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('Users.id')), 'DESC']]
    });

    res.json({
      roleStats: roleStats.map(stat => ({
        role: stat.role,
        count: parseInt(stat.dataValues.count)
      })),
      companyStats: companyStats.map(stat => ({
        companyName: stat.name,
        userCount: parseInt(stat.dataValues.userCount)
      }))
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// DELETE uživatel (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last admin user' 
        });
      }
    }

    // Delete related records first
    await UserTraining.destroy({ where: { userId: user.id } });
    await TestSession.destroy({ where: { user_id: user.id } });
    
    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router; 