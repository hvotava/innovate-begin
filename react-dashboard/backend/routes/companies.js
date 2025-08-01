const express = require('express');
const { body, validationResult } = require('express-validator');
const { Company, User, Training } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET všechny společnosti (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      name: { [require('sequelize').Op.iLike]: `%${search}%` }
    } : {};

    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Training,
          attributes: ['id', 'title'],
          required: false
        }
      ]
    });

    res.json({
      companies: rows,
      totalCompanies: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET jedna společnost (admin only)
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Training,
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// POST nová společnost (admin only)
router.post('/', [
  auth,
  adminOnly,
  body('name').notEmpty().withMessage('Company name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    // Zkontroluj, jestli společnost už neexistuje
    const existingCompany = await Company.findOne({ where: { name } });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this name already exists' });
    }

    const company = await Company.create({ name });

    res.status(201).json({
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// PUT update společnosti (admin only)
router.put('/:id', [
  auth,
  adminOnly,
  body('name').optional().notEmpty().withMessage('Company name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await company.update(req.body);
    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    console.error('Update company error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Company name already exists' });
    }
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// DELETE společnost (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: User },
        { model: Training }
      ]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Zkontroluj, jestli má společnost uživatele nebo školení
    if (company.Users.length > 0 || company.Trainings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete company with existing users or trainings',
        details: {
          users: company.Users.length,
          trainings: company.Trainings.length
        }
      });
    }

    await company.destroy();
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

module.exports = router; 