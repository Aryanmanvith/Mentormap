import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Mentorship from '../models/Mentorship.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { httpError } from '../middleware/error.js';
import { scoreMentor } from '../services/matching.js';
import { audit } from '../utils/audit.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'mentor' ? { mentor: req.user._id } : req.user.role === 'student' ? { student: req.user._id } : {};
  const items = await Mentorship.find(filter).populate('student mentor').sort('-createdAt');
  res.json({ mentorships: items });
}));

r.post('/', requireRole('student'), validate(z.object({ mentorId: z.string(), message: z.string().max(1000).optional() })),
  asyncHandler(async (req, res) => {
    const mentor = await User.findOne({ _id: req.body.mentorId, role: 'mentor', verified: true, active: true });
    if (!mentor) throw httpError(404, 'Mentor not found or not verified');
    const { score, reasons } = scoreMentor(req.user, mentor);
    const m = await Mentorship.create({
      student: req.user._id, mentor: mentor._id, message: req.body.message, matchScore: score, matchReasons: reasons,
    });
    await audit(req.user, 'mentorship.request', m._id);
    res.status(201).json({ mentorship: m });
  }));

r.patch('/:id', requireRole('mentor'), validate(z.object({ status: z.enum(['active', 'declined', 'completed']) })),
  asyncHandler(async (req, res) => {
    const m = await Mentorship.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!m) throw httpError(404, 'Not found');
    if (req.body.status === 'active') {
      const load = await Mentorship.countDocuments({ mentor: req.user._id, status: 'active' });
      if (load >= req.user.maxMentees) throw httpError(409, 'Mentee capacity reached');
    }
    m.status = req.body.status;
    await m.save();
    await audit(req.user, `mentorship.${m.status}`, m._id);
    res.json({ mentorship: m });
  }));

export default r;
