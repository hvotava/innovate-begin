const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production';

// Middleware pro ověření JWT tokenu
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Middleware pro admin-only routy
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  next();
};

// Middleware pro superuser a admin
const superuserOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!['admin', 'superuser'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Superuser or admin access required.' });
  }

  next();
};

// Middleware pro contact_person, superuser a admin
const contactPersonOrHigher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!['admin', 'superuser', 'contact_person'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Contact person, superuser or admin access required.' });
  }

  next();
};

// Middleware pro kontrolu rolí (přijímá pole rolí)
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware pro kontrolu vlastnictví firmy (pro contact_person)
const checkCompanyAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admin a superuser mají přístup ke všemu
  if (['admin', 'superuser'].includes(req.user.role)) {
    return next();
  }

  // Contact person má přístup pouze ke své firmě
  if (req.user.role === 'contact_person') {
    const { companyId } = req.params || req.body;
    
    if (companyId && parseInt(companyId) !== req.user.companyId) {
      return res.status(403).json({ 
        error: 'Access denied. You can only manage your own company.' 
      });
    }
  }

  next();
};

// Utility funkce pro generování JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  auth,
  adminOnly,
  superuserOrAdmin,
  contactPersonOrHigher,
  requireRoles,
  checkCompanyAccess,
  generateToken,
  JWT_SECRET
}; 