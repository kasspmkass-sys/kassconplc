import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Brute-force protection for the admin login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Pre-hashed random value. When the email doesn't exist we still run bcrypt so
// response timing does not reveal whether an account exists (user enumeration).
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = admin ? await admin.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH);
    if (!admin || !passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const admin = await Admin.findById(req.adminId).select('-password');
  res.json(admin);
});

export default router;
