import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Only accept tokens for admins that still exist, so deleted/revoked
    // users lose access immediately instead of after token expiry.
    const admin = await Admin.findById(payload.id).select('_id');
    if (!admin) return res.status(401).json({ message: 'Invalid token' });
    req.adminId = admin._id;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function attachAdmin(req, res, next) {
  if (!req.adminId) return next();
  req.admin = await Admin.findById(req.adminId).select('-password');
  next();
}
