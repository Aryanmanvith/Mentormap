import { Router } from 'express';
import { z } from 'zod';
import Feedback from '../models/Feedback.js';
import Session from '../models/Session.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { httpError } from '../middleware/error.js';

const r = Router();
r.use(requireAuth);

r.post('/', validate(z.object({
  sessionId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  actionItems: z.array(z.string().max(300)).max(10).optional(),
})), asyncHandler(async (req, res) => {
  const s = await Session.findById(req.body.sessionId);
  if (!s || ![s.student, s.mentor].some((x) => x.equals(req.user._id))) throw httpError(404, 'Session not found');
  if (s.status !== 'completed') throw httpError(409, 'Feedback opens after the session is completed');
  const to = s.student.equals(req.user._id) ? s.mentor : s.student;
  const fb = await Feedback.create({
    session: s._id, from: req.user._id, to, rating: req.body.rating, comment: req.body.comment,
    actionItems: s.student.equals(req.user._id) ? [] : req.body.actionItems || [],
  });
  res.status(201).json({ feedback: fb });
}));

// Feedback received by me (mentors see student ratings; students see mentor action items)
r.get('/', asyncHandler(async (req, res) => {
  const items = await Feedback.find({ to: req.user._id }).populate('from', 'name').populate('session', 'topic start').sort('-createdAt');
  res.json({ feedback: items });
}));

export default r;
