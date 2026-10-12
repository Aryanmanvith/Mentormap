import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { httpError } from '../middleware/error.js';
import { audit } from '../utils/audit.js';

const r = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['student', 'mentor']), // admins are provisioned by the institution, never self-registered
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

r.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) throw httpError(409, 'Email already registered');
  const user = await User.create({
    name, email, role,
    passwordHash: await bcrypt.hash(password, 10),
    verified: role === 'student',
  });
  await audit(user, 'user.register', user._id, { role });
  res.status(201).json({ token: signToken(user), user: user.toSafe() });
}));

r.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    throw httpError(401, 'Invalid email or password');
  if (!user.active) throw httpError(403, 'Account deactivated');
  res.json({ token: signToken(user), user: user.toSafe() });
}));

r.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toSafe() }));

export default r;
