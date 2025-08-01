const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Company, TestSession, Attempt } = require('../models');
const { body, validationResult } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Get all users with pagination (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      [require('sequelize').Op.or]: [
        { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']],
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

// Get single user (admin only)
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Company,
          attributes: ['id', 'name']
        },
        {
          model: TestSession,
          limit: 10,
          order: [['started_at', 'DESC']],
          required: false
        },
        {
          model: Attempt,
          limit: 10,
          order: [['started_at', 'DESC']],
          required: false
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

// Create new user (admin only)
router.post('/', [
  auth,
  adminOnly,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Invalid role'),
  body('companyId').optional().isInt().withMessage('Invalid company ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'user', companyId, phone, language = 'cs' } = req.body;

    // Zkontroluj, jestli email už neexistuje
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hashuj heslo
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      companyId: companyId || null,
      phone: phone || null,
      language,
      current_lesson_level: 0
    });

    // Vrať data bez hesla
    const userData = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Company, attributes: ['name'] }]
    });

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/:id', [
  auth,
  adminOnly,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Invalid role'),
  body('companyId').optional().isInt().withMessage('Invalid company ID')
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

    const updateData = { ...req.body };

    // Hashuj heslo, pokud je poskytnuté
    if (updateData.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    await user.update(updateData);

    // Vrať data bez hesla
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Company, attributes: ['name'] }]
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { force } = req.query;
    
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: TestSession },
        { model: Attempt }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    const hasRelations = user.TestSessions.length > 0 || user.Attempts.length > 0;

    if (hasRelations && force !== 'true') {
      return res.status(400).json({
        error: 'User has related data. Use force=true to delete anyway.',
        details: {
          testSessions: user.TestSessions.length,
          attempts: user.Attempts.length
        }
      });
    }

    await user.destroy();
    res.json({ 
      message: `User deleted successfully${force === 'true' ? ' (forced)' : ''}` 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Call user (admin only) - zachováváme původní endpoint pro kompatibilitu
router.post('/:id/call', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Zde by měla být integrace s Twilio
    // Pro teď jen vracíme success
    res.json({
      message: 'Call initiated successfully',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Call user error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

module.exports = router;
