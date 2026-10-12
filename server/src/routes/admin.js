import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Mentorship from '../models/Mentorship.js';
import Session from '../models/Session.js';
import Goal from '../models/Goal.js';
import Feedback from '../models/Feedback.js';
import Resource from '../models/Resource.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { httpError } from '../middleware/error.js';
import { audit } from '../utils/audit.js';

const r = Router();
r.use(requireAuth, requireRole('admin'));

// Engagement, session health, outcomes, and areas needing support
r.get('/analytics', asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 86400000);
  const [students, mentors, pendingMentors, active, requested, sessionsByStatus, ratingAgg, goalsByStatus, flagged, recent] =
    await Promise.all([
      User.countDocuments({ role: 'student', active: true }),
      User.countDocuments({ role: 'mentor', verified: true, active: true }),
      User.countDocuments({ role: 'mentor', verified: false }),
      Mentorship.countDocuments({ status: 'active' }),
      Mentorship.countDocuments({ status: 'requested' }),
      Session.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]),
      Goal.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Resource.countDocuments({ flagged: true, hidden: false }),
      Session.countDocuments({ start: { $gte: since }, status: 'completed' }),
    ]);
  const toMap = (a) => Object.fromEntries(a.map((x) => [x._id, x.n]));
  const sessions = toMap(sessionsByStatus);
  const finished = (sessions.completed || 0) + (sessions.cancelled || 0);

  // Students with no active mentorship = areas that need support
  const matchedIds = await Mentorship.distinct('student', { status: { $in: ['active', 'requested'] } });
  const unmatched = await User.find({ role: 'student', active: true, _id: { $nin: matchedIds } }).select('name email industry').limit(20);

  res.json({
    users: { students, mentors, pendingMentors },
    mentorships: { active, requested },
    sessions: { ...sessions, completionRate: finished ? Math.round(((sessions.completed || 0) / finished) * 100) : null, completedLast30Days: recent },
    outcomes: { goals: toMap(goalsByStatus), avgRating: ratingAgg[0] ? +ratingAgg[0].avg.toFixed(2) : null, feedbackCount: ratingAgg[0]?.n || 0 },
    needsSupport: { unmatchedStudents: unmatched, flaggedResources: flagged },
  });
}));

r.get('/mentors/pending', asyncHandler(async (_req, res) => {
  res.json({ mentors: await User.find({ role: 'mentor', verified: false, active: true }).sort('createdAt') });
}));

r.patch('/mentors/:id/verify', validate(z.object({ verified: z.boolean() })), asyncHandler(async (req, res) => {
  const m = await User.findOneAndUpdate({ _id: req.params.id, role: 'mentor' }, { verified: req.body.verified }, { new: true });
  if (!m) throw httpError(404, 'Mentor not found');
  await audit(req.user, req.body.verified ? 'mentor.verify' : 'mentor.unverify', m._id);
  res.json({ mentor: m });
}));

r.patch('/users/:id/active', validate(z.object({ active: z.boolean() })), asyncHandler(async (req, res) => {
  const u = await User.findOneAndUpdate({ _id: req.params.id, role: { $ne: 'admin' } }, { active: req.body.active }, { new: true });
  if (!u) throw httpError(404, 'User not found');
  await audit(req.user, 'user.setActive', u._id, { active: req.body.active });
  res.json({ user: u });
}));

r.get('/resources/flagged', asyncHandler(async (_req, res) => {
  res.json({ resources: await Resource.find({ flagged: true, hidden: false }).populate('author', 'name') });
}));

r.patch('/resources/:id', validate(z.object({ hidden: z.boolean() })), asyncHandler(async (req, res) => {
  const item = await Resource.findByIdAndUpdate(req.params.id, { hidden: req.body.hidden, flagged: false }, { new: true });
  if (!item) throw httpError(404, 'Not found');
  await audit(req.user, 'resource.moderate', item._id, { hidden: req.body.hidden });
  res.json({ resource: item });
}));

r.get('/audit', asyncHandler(async (_req, res) => {
  res.json({ logs: await AuditLog.find().populate('actor', 'name role').sort('-createdAt').limit(100) });
}));

export default r;
