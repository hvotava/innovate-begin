const express = require('express');
const { body, validationResult } = require('express-validator');
const { Company, User, Training } = require('../models');
const { auth, adminOnly, superuserOrAdmin } = require('../middleware/auth');
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
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        },
        {
          model: User,
          as: 'ContactPerson',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Training,
          attributes: ['id', 'title', 'category'],
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

// POST nová společnost (superuser nebo admin)
router.post('/', [
  auth,
  superuserOrAdmin,
  body('name').notEmpty().withMessage('Company name is required'),
  body('ico').optional().isLength({ min: 8, max: 8 }).isNumeric()
    .withMessage('IČO must be exactly 8 digits'),
  body('contactPersonId').optional().isInt()
    .withMessage('Contact person ID must be a valid integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, ico, contactPersonId } = req.body;

    // Zkontroluj, jestli společnost už neexistuje
    const existingCompany = await Company.findOne({ 
      where: { 
        [require('sequelize').Op.or]: [
          { name },
          ...(ico ? [{ ico }] : [])
        ]
      } 
    });
    
    if (existingCompany) {
      if (existingCompany.name === name) {
        return res.status(400).json({ error: 'Company with this name already exists' });
      }
      if (existingCompany.ico === ico) {
        return res.status(400).json({ error: 'Company with this IČO already exists' });
      }
    }

    // Zkontroluj contact person, pokud je zadán
    if (contactPersonId) {
      const contactPerson = await User.findByPk(contactPersonId);
      if (!contactPerson) {
        return res.status(400).json({ error: 'Contact person not found' });
      }
      if (!['contact_person', 'superuser', 'admin'].includes(contactPerson.role)) {
        return res.status(400).json({ 
          error: 'Contact person must have appropriate role (contact_person, superuser, or admin)' 
        });
      }
    }

    const company = await Company.create({ name, ico, contactPersonId });

    // Include contact person data in response
    const createdCompany = await Company.findByPk(company.id, {
      include: [
        {
          model: User,
          as: 'ContactPerson',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    res.status(201).json({
      message: 'Company created successfully',
      company: createdCompany
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// PUT update společnosti (superuser nebo admin)
router.put('/:id', [
  auth,
  superuserOrAdmin,
  body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('ico').optional().isLength({ min: 8, max: 8 }).isNumeric()
    .withMessage('IČO must be exactly 8 digits'),
  body('contactPersonId').optional().isInt()
    .withMessage('Contact person ID must be a valid integer')
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

    const { name, ico, contactPersonId } = req.body;

    // Zkontroluj contact person, pokud je zadán
    if (contactPersonId) {
      const contactPerson = await User.findByPk(contactPersonId);
      if (!contactPerson) {
        return res.status(400).json({ error: 'Contact person not found' });
      }
      if (!['contact_person', 'superuser', 'admin'].includes(contactPerson.role)) {
        return res.status(400).json({ 
          error: 'Contact person must have appropriate role (contact_person, superuser, or admin)' 
        });
      }
    }

    await company.update({ name, ico, contactPersonId });

    // Fetch updated company with contact person data
    const updatedCompany = await Company.findByPk(company.id, {
      include: [
        {
          model: User,
          as: 'ContactPerson',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    res.json({
      message: 'Company updated successfully',
      company: updatedCompany
    });
  } catch (error) {
    console.error('Update company error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Company name or IČO already exists' });
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

// GET možné contact persons pro dropdown (superuser nebo admin)
router.get('/contact-persons/available', auth, superuserOrAdmin, async (req, res) => {
  try {
    const contactPersons = await User.findAll({
      where: {
        role: {
          [require('sequelize').Op.in]: ['contact_person', 'superuser', 'admin']
        }
      },
      attributes: ['id', 'name', 'email', 'role', 'companyId'],
      include: [
        {
          model: Company,
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      contactPersons: contactPersons.map(person => ({
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        companyName: person.Company?.name || null,
        isAvailable: !person.Company || person.Company.contactPersonId !== person.id
      }))
    });
  } catch (error) {
    console.error('Get contact persons error:', error);
    res.status(500).json({ error: 'Failed to fetch contact persons' });
  }
});

module.exports = router; 