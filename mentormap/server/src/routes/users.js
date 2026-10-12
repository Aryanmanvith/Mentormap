import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Mentorship from '../models/Mentorship.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { rankMentors } from '../services/matching.js';

const r = Router();
r.use(requireAuth);

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  headline: z.string().max(140).optional(),
  bio: z.string().max(2000).optional(),
  industry: z.string().max(80).optional(),
  interests: z.array(z.string().max(40)).max(20).optional(),
  skills: z.array(z.string().max(40)).max(30).optional(),
  targetRole: z.string().max(80).optional(),
  currentRole: z.string().max(80).optional(),
  company: z.string().max(80).optional(),
  gradYear: z.number().int().min(1950).max(2100).optional(),
  maxMentees: z.number().int().min(1).max(20).optional(),
  availability: z.array(z.object({ day: z.number().int().min(0).max(6), start: time, end: time })).max(30).optional(),
});

r.put('/me', validate(profileSchema), asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ user: req.user.toSafe() });
}));

// Match: ranked, explainable list of verified mentors for the logged-in student
r.get('/mentors/match', requireRole('student'), asyncHandler(async (req, res) => {
  const mentors = await User.find({ role: 'mentor', verified: true, active: true });
  const active = await Mentorship.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$mentor', n: { $sum: 1 } } },
  ]);
  const load = Object.fromEntries(active.map((a) => [a._id.toString(), a.n]));
  const ranked = rankMentors(req.user, mentors, load).map(({ mentor, score, reasons, openSlots }) => ({
    mentor, score, reasons, openSlots,
  }));
  const q = (req.query.q || '').toString().toLowerCase();
  const industry = (req.query.industry || '').toString().toLowerCase();
  res.json({
    matches: ranked.filter(({ mentor: m }) =>
      (!industry || m.industry?.toLowerCase() === industry) &&
      (!q || [m.name, m.company, m.currentRole, ...(m.skills || []), ...(m.interests || [])].join(' ').toLowerCase().includes(q))
    ),
  });
}));

r.get('/:id', asyncHandler(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ user: u.toSafe() });
}));

export default r;
