const express = require('express');
const router = express.Router();

// Simple auth placeholder - můžeme rozšířit později
router.post('/login', async (req, res) => {
  try {
    // Pro teď jen vracíme success - později můžeme přidat JWT auth
    res.json({ 
      message: 'Login successful',
      user: { id: 1, name: 'Admin', role: 'admin' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router; 