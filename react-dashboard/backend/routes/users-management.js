const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { User, Company } = require('../models');
const { auth, adminOnly, superuserOrAdmin, contactPersonOrHigher, checkCompanyAccess } = require('../middleware/auth');
const router = express.Router();

// GET všichni uživatelé s pokročilým filtrováním (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const roleFilter = req.query.role || '';
    const companyFilter = req.query.company || '';

    let whereClause = {};
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    if (roleFilter) {
      whereClause.role = roleFilter;
    }

    if (companyFilter) {
      whereClause.companyId = parseInt(companyFilter);
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']],
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          attributes: ['id', 'name', 'ico'],
          required: false
        }
      ]
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

// PUT změna role uživatele (admin only)
router.put('/:id/role', [
  auth,
  adminOnly,
  body('role').isIn(['admin', 'superuser', 'contact_person', 'regular_user'])
    .withMessage('Invalid role specified')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const userId = parseInt(req.params.id);

    // Nemohou změnit sami sobě roli
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Zkontroluj, jestli není posledním adminem
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot change role of the last admin user' 
        });
      }
    }

    await user.update({ role });

    const updatedUser = await User.findByPk(userId, {
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

// GET uživatelé podle společnosti (contact_person+ může vidět svou firmu)
router.get('/company/:companyId', auth, contactPersonOrHigher, checkCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { companyId: parseInt(companyId) },
      limit,
      offset,
      order: [['name', 'ASC']],
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          attributes: ['id', 'name', 'ico'],
          required: true
        }
      ]
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
    const { name, email, password, role = 'regular_user', phone } = req.body;

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
      companyId: parseInt(companyId)
    });

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
      message: 'User created successfully',
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
        [require('sequelize').fn('COUNT', require('sequelize').col('role')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const companyStats = await User.findAll({
      attributes: [
        [require('sequelize').col('Company.name'), 'companyName'],
        [require('sequelize').fn('COUNT', require('sequelize').col('User.id')), 'userCount']
      ],
      include: [
        {
          model: Company,
          attributes: [],
          required: true
        }
      ],
      group: ['Company.id', 'Company.name'],
      raw: true
    });

    res.json({
      roleStats,
      companyStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// DELETE uživatel (admin only, s ochranou posledního admina)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Nemohou smazat sami sebe
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Zkontroluj, jestli není posledním adminem
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last admin user' 
        });
      }
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router; 