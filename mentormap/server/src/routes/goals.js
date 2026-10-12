import { Router } from 'express';
import { z } from 'zod';
import Goal from '../models/Goal.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { httpError } from '../middleware/error.js';
import { getParticipantMentorship } from '../utils/access.js';

const r = Router();
r.use(requireAuth);

const milestone = z.object({ title: z.string().min(1).max(200), done: z.boolean().optional(), dueDate: z.coerce.date().optional() });
const createSchema = z.object({
  mentorshipId: z.string(),
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  milestones: z.array(milestone).max(30).default([]),
});

r.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.mentorshipId) filter.mentorship = req.query.mentorshipId;
  else if (req.user.role === 'student') filter.student = req.user._id;
  else if (req.user.role === 'mentor') {
    const ids = (await (await import('../models/Mentorship.js')).default.find({ mentor: req.user._id }).select('_id')).map((m) => m._id);
    filter.mentorship = { $in: ids };
  }
  if (req.query.mentorshipId) await getParticipantMentorship(req.query.mentorshipId, req.user);
  res.json({ goals: await Goal.find(filter).sort('-createdAt') });
}));

r.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') throw httpError(403, 'Forbidden for your role');
  const { mentorshipId, ...rest } = req.body;
  const m = await getParticipantMentorship(mentorshipId, req.user, { requireActive: true });
  const goal = await Goal.create({ ...rest, mentorship: m._id, student: m.student, createdBy: req.user._id });
  res.status(201).json({ goal });
}));

r.patch('/:id', validate(z.object({
  title: z.string().min(2).max(160).optional(),
  status: z.enum(['active', 'achieved', 'dropped']).optional(),
  milestones: z.array(milestone.extend({ _id: z.string().optional() })).max(30).optional(),
})), asyncHandler(async (req, res) => {
  const g = await Goal.findById(req.params.id);
  if (!g) throw httpError(404, 'Not found');
  await getParticipantMentorship(g.mentorship, req.user);
  if (req.user.role === 'admin') throw httpError(403, 'Forbidden for your role');
  Object.assign(g, req.body);
  await g.save();
  res.json({ goal: g });
}));

r.delete('/:id', asyncHandler(async (req, res) => {
  const g = await Goal.findById(req.params.id);
  if (!g) throw httpError(404, 'Not found');
  if (!g.createdBy.equals(req.user._id)) throw httpError(403, 'Only the creator can delete a goal');
  await g.deleteOne();
  res.status(204).end();
}));

export default r;
