const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Company, Training, Lesson, Test, UserTraining, TestSession, Attempt } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Import Twilio 
const twilio = require('twilio');

// Twilio configuration
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Get all users (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      include: [
        { 
          model: Company, 
          attributes: ['name'],
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
          attributes: ['name'],
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

// Create new user (admin only)
router.post('/', [
  auth,
  adminOnly,
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'superuser', 'contact_person', 'regular_user']).withMessage('Invalid role'),
  body('companyId').optional().isInt().withMessage('Invalid company ID'),
  body('phone').optional(), // Odstranit notEmpty() - prázdný string je OK
  body('current_lesson_level').optional().isInt({ min: 1 }).withMessage('Current lesson level must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Create user validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'regular_user', companyId, phone, language = 'cs', current_lesson_level = 1 } = req.body;

    console.log('🔄 Backend creating user with body:', req.body);

    // Zkontroluj, jestli email už neexistuje
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Convert empty phone string to null
    const phoneValue = phone && phone.trim() ? phone.trim() : null;

    // Hashuj heslo
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      companyId: companyId || null,
      phone: phoneValue, // Použít null pro prázdný phone
      language,
      current_lesson_level
    });

    console.log('🔄 Backend user created:', user.id);

    // Automatically assign to first training and test if user has a company
    if (companyId) {
      await assignUserToFirstTrainingAndTest(user.id, companyId);
    }

    // Vrať data bez hesla
    const userData = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Company, attributes: ['name'] }]
    });

    console.log('✅ Backend user created successfully');
    res.status(201).json({
      message: 'User created successfully and assigned to first available training',
      user: userData
    });
  } catch (error) {
    console.error('❌ Backend create user error:', error);
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
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'superuser', 'contact_person', 'regular_user']).withMessage('Invalid role'),
  body('companyId').optional().isInt().withMessage('Invalid company ID'),
  body('phone').optional(), // Odstranit notEmpty() - prázdný string je OK
  body('current_lesson_level').optional().isInt({ min: 1 }).withMessage('Current lesson level must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, email, password, role, companyId, phone, language, current_lesson_level } = req.body;
    
    console.log('🔄 Backend updating user:', req.params.id, 'with body:', req.body);
    
    // Check if email is being changed and if new email already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Convert empty phone string to null
    const phoneValue = phone && phone.trim() ? phone.trim() : null;
    
    const updateData = { 
      name, 
      email, 
      role, 
      companyId, 
      phone: phoneValue, // Použít null pro prázdný phone
      language, 
      current_lesson_level 
    };

    // Hashuj heslo, pokud je zadané
    if (password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    console.log('🔄 Backend updateData:', updateData);

    // Check if company changed and reassign training if needed
    const oldCompanyId = user.companyId;
    const newCompanyId = companyId;

    await user.update(updateData);

    // If company changed, reassign to new company's training
    if (oldCompanyId !== newCompanyId && newCompanyId) {
      await assignUserToFirstTrainingAndTest(user.id, newCompanyId);
    }

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Company, attributes: ['name'] }]
    });

    console.log('✅ Backend user updated successfully');
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Backend update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
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
    await Attempt.destroy({ where: { user_id: user.id } });

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Call user with Twilio integration (admin only)
router.post('/:id/call', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.phone) {
      return res.status(400).json({ error: 'User has no phone number' });
    }

    // Get lesson info from request body
    const { lessonId } = req.body;
    let lessonInfo = '';
    
    if (lessonId) {
      const lesson = await Lesson.findByPk(lessonId, {
        include: [{ model: Training, attributes: ['title'] }]
      });
      if (lesson) {
        lessonInfo = `pro lekci "${lesson.title}" ze školení "${lesson.Training?.title}"`;
      }
    }

    // Twilio integration
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        // Určit správnou backend URL pro webhooks
        const getBackendUrl = () => {
          if (process.env.BACKEND_URL) {
            // Zajistit, že URL má protokol
            return process.env.BACKEND_URL.startsWith('http') ? process.env.BACKEND_URL : `https://${process.env.BACKEND_URL}`;
          }
          // Railway automaticky nastavuje RAILWAY_STATIC_URL
          if (process.env.RAILWAY_STATIC_URL) {
            // Railway URL může být bez protokolu
            return process.env.RAILWAY_STATIC_URL.startsWith('http') ? process.env.RAILWAY_STATIC_URL : `https://${process.env.RAILWAY_STATIC_URL}`;
          }
          // Pro lokální development
          if (process.env.NODE_ENV === 'development') {
            return 'http://localhost:5000';
          }
          // Fallback pro Railway (používáme správnou lecture-app doménu)
          return 'https://lecture-app-production.up.railway.app';
        };

        const backendUrl = getBackendUrl();
        console.log('🔍 Using backend URL for Twilio webhooks:', backendUrl);

        const call = await twilioClient.calls.create({
          to: user.phone,
          from: process.env.TWILIO_PHONE_NUMBER,
          url: `${backendUrl}/audio/`,
          method: 'POST',
          record: true,
          statusCallback: `${backendUrl}/api/twilio/status`,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          statusCallbackMethod: 'POST'
        });

        console.log(`✅ Twilio call initiated to ${user.name} (${user.phone}): ${call.sid}`);
        console.log(`📞 Voice webhook: ${backendUrl}/api/twilio/voice`);
        console.log(`📊 Status webhook: ${backendUrl}/api/twilio/status`);

        res.json({
          message: `Volání úspěšně zahájeno pro uživatele ${user.name} ${lessonInfo}`,
          callSid: call.sid,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone
          }
        });
      } catch (twilioError) {
        console.error('❌ Twilio call error:', twilioError);
        res.status(500).json({ 
          error: 'Nepodařilo se zahájit Twilio volání',
          details: twilioError.message || 'Neznámá chyba'
        });
      }
    } else {
      // Mock response when Twilio is not configured
      console.log('📞 Mock Twilio call for user:', user.name, user.phone);
      res.json({
        message: `Mock volání zahájeno pro uživatele ${user.name} ${lessonInfo} (Twilio není nakonfigurováno)`,
        callSid: 'mock-call-' + Date.now(),
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone
        }
      });
    }
  } catch (error) {
    console.error('Call user error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

module.exports = router;
