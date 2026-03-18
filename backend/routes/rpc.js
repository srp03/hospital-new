const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const Profile = require('../models/Profile');
const Doctor = require('../models/Doctor');
const LabTechnician = require('../models/LabTechnician');

const router = express.Router();

// POST /api/rpc/:functionName — Supabase RPC equivalent
router.post('/:functionName', authMiddleware, async (req, res) => {
  try {
    const { functionName } = req.params;
    const params = req.body;

    switch (functionName) {
      case 'create_user_with_password': {
        // Only admins can call this
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            data: null,
            error: { message: 'Access Denied: Only Admins can create users.' }
          });
        }

        const { email, password, name, role_name } = params;

        // Check duplicate
        const existing = await Profile.findOne({ email: email.toLowerCase() });
        if (existing) {
          return res.status(400).json({
            data: null,
            error: { message: 'User with this email already exists.' }
          });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const profile = await Profile.create({
          email: email.toLowerCase(),
          full_name: name,
          role: role_name,
          password: hashedPassword,
        });

        // Return the new user ID (mimics Supabase RPC return)
        return res.json({ data: profile._id, error: null });
      }

      default:
        return res.status(404).json({
          data: null,
          error: { message: `Unknown RPC function: ${functionName}` }
        });
    }
  } catch (error) {
    console.error('RPC error:', error);
    return res.status(500).json({ data: null, error: { message: error.message } });
  }
});

module.exports = router;
