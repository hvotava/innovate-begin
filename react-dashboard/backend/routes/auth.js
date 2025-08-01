const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User, Company } = require('../models');
const { generateToken, auth } = require('../middleware/auth');
const router = express.Router();

// LOGIN endpoint
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Najdi uživatele
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Company, attributes: ['name'] }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Ověř heslo
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generuj JWT token
    const token = generateToken(user.id, user.role);

    // Vrať data bez hesla
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.Company ? user.Company.name : null
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// REGISTER endpoint (pouze pro adminy)
router.post('/register', [
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

    const { name, email, password, role = 'user', companyId } = req.body;

    // Zkontroluj, jestli email už neexistuje
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hashuj heslo
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Vytvoř uživatele
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      companyId: companyId || null
    });

    // Vrať data bez hesla
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET profile endpoint (vyžaduje autentifikaci)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Company, attributes: ['name'] }]
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.Company ? user.Company.name : null
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// LOGOUT endpoint (jen pro klienta - server neukládá tokeny)
router.post('/logout', (req, res) => {
  // S JWT jen říkáme klientovi, aby token smazal
  res.json({ message: 'Logout successful' });
});

module.exports = router; 