const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets from the React build folder
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

// Database connection
const { sequelize, User, Company } = require('./models');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/trainings', require('./routes/trainings'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

// Funkce pro vytvoření admin účtu a migraci dat
const createDefaultAdmin = async () => {
  try {
    // Vytvoř výchozí společnost
    let defaultCompany = await Company.findOne({ where: { name: 'Default Company' } });
    if (!defaultCompany) {
      defaultCompany = await Company.create({
        name: 'Default Company'
      });
      console.log('✅ Default company created');
    }

    // Zkontroluj, jestli už admin s emailem existuje
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lecture.app';
    let existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      return;
    }

    // Zkontroluj, jestli existuje nějaký admin podle role
    const adminByRole = await User.findOne({ where: { role: 'admin' } });
    if (adminByRole && !adminByRole.email) {
      // Aktualizuj existujícího admina s emailem a heslem
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await adminByRole.update({
        email: adminEmail,
        password: hashedPassword,
        companyId: defaultCompany.id
      });
      
      console.log('✅ Existing admin updated with email and password');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      return;
    }

    // Migrace existujících uživatelů bez emailu
    const usersWithoutEmail = await User.findAll({ 
      where: { 
        email: null 
      } 
    });

    for (const user of usersWithoutEmail) {
      // Vytvoř dočasný email z phone nebo id
      const tempEmail = user.phone 
        ? `user_${user.phone.replace(/\D/g, '')}@temp.lecture.app`
        : `user_${user.id}@temp.lecture.app`;
      
      // Vytvoř dočasné heslo
      const tempPassword = await bcrypt.hash('temp123', 12);
      
      await user.update({
        email: tempEmail,
        password: tempPassword,
        role: user.role || 'user',
        companyId: user.companyId || defaultCompany.id
      });
    }

    if (usersWithoutEmail.length > 0) {
      console.log(`✅ Updated ${usersWithoutEmail.length} existing users with temporary emails`);
    }

    // Vytvoř nového admin účtu, pokud žádný neexistuje
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      await User.create({
        name: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        companyId: defaultCompany.id
      });

      console.log('🎉 Default admin account created!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log('⚠️  Please change the password after first login!');
    }
    
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (bez force, aby se data neztratila)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized.');
    
    // Vytvoř výchozího admina
    await createDefaultAdmin();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer(); 