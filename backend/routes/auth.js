const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const LabTechnician = require('../models/LabTechnician');
const generatePatientUid = require('../utils/generatePatientUid');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Generate JWT
const generateToken = (profile) => {
  return jwt.sign(
    { id: profile._id, email: profile.email, role: profile.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register — Supabase signUp equivalent
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, full_name, age, gender, blood_group, phone, role } = req.body;
    const name = fullName || full_name;

    // Check if user exists
    const existing = await Profile.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: { message: 'User with this email already exists' } });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create profile
    const profile = await Profile.create({
      email: email.toLowerCase(),
      full_name: name,
      role: role || 'patient',
      password: hashedPassword,
    });

    // If patient, create patient record
    if ((role || 'patient') === 'patient') {
      const patient_uid = await generatePatientUid();
      await Patient.create({
        user_id: profile._id,
        patient_uid,
        full_name: name,
        age: age || null,
        gender: gender || 'male',
        blood_group: blood_group || null,
        phone: phone || null,
      });
    }

    const token = generateToken(profile);

    res.status(201).json({
      data: {
        user: {
          id: profile._id,
          email: profile.email,
          user_metadata: { full_name: name, role: profile.role },
        },
        session: {
          access_token: token,
          user: {
            id: profile._id,
            email: profile.email,
            user_metadata: { full_name: name, role: profile.role },
          }
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// POST /api/auth/login — Supabase signInWithPassword equivalent
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const profile = await Profile.findOne({ email: email.toLowerCase() }).select('+password');
    if (!profile) {
      return res.status(400).json({ error: { message: 'Invalid login credentials' } });
    }

    const validPassword = await bcrypt.compare(password, profile.password);
    if (!validPassword) {
      return res.status(400).json({ error: { message: 'Invalid login credentials' } });
    }

    const token = generateToken(profile);

    res.json({
      data: {
        user: {
          id: profile._id,
          email: profile.email,
          user_metadata: { full_name: profile.full_name, role: profile.role },
        },
        session: {
          access_token: token,
          user: {
            id: profile._id,
            email: profile.email,
            user_metadata: { full_name: profile.full_name, role: profile.role },
          }
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// GET /api/auth/session — Supabase getSession equivalent
router.get('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ data: { session: null }, error: null });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const profile = await Profile.findById(decoded.id);

    if (!profile) {
      return res.json({ data: { session: null }, error: null });
    }

    res.json({
      data: {
        session: {
          access_token: token,
          user: {
            id: profile._id,
            email: profile.email,
            user_metadata: { full_name: profile.full_name, role: profile.role },
          }
        }
      },
      error: null
    });
  } catch (error) {
    // Token expired or invalid -> no session
    res.json({ data: { session: null }, error: null });
  }
});

// GET /api/auth/user — Supabase getUser equivalent
router.get('/user', authMiddleware, async (req, res) => {
  res.json({
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        user_metadata: { full_name: req.user.full_name, role: req.user.role },
      }
    },
    error: null
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ error: null });
});

// POST /api/auth/create-staff — replaces supabase.rpc('create_user_with_password')
router.post('/create-staff', authMiddleware, async (req, res) => {
  try {
    // Check if caller is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Access Denied: Only Admins can create users.' } });
    }

    const { email, password, name, role_name } = req.body;

    // Check duplicate
    const existing = await Profile.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: { message: 'User with this email already exists.' } });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const profile = await Profile.create({
      email: email.toLowerCase(),
      full_name: name,
      role: role_name,
      password: hashedPassword,
    });

    res.json({ data: profile._id, error: null });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
