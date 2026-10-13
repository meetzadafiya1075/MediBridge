const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user settings with populated hospital details
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('hospitalId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update user settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { name, email, notifications, mciRegistration, department } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (mciRegistration) user.mciRegistration = mciRegistration;
    if (department) user.department = department;
    if (notifications) {
      user.notifications = {
        ...user.notifications,
        ...notifications
      };
    }

    await user.save();
    const populated = await User.findById(user._id).populate('hospitalId');
    res.json(populated);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Change Password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new passwords are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate password (if password was hashed with matchPassword, or plain text comparison fallback)
    const isMatch = user.matchPassword ? await user.matchPassword(currentPassword) : (user.password === currentPassword);
    if (!isMatch && user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Request facility affiliation
router.post('/affiliations', auth, async (req, res) => {
  try {
    const { hospitalName, department, role } = req.body;
    // In a real app this creates a request ticket; for demo return success
    res.json({ 
      success: true, 
      message: `Affiliation request for ${hospitalName} submitted. Verification in progress.` 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

