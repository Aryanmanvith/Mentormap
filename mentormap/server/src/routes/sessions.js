import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import Session from '../models/Session.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { httpError } from '../middleware/error.js';
import { getParticipantMentorship } from '../utils/access.js';
import { sessionToIcs } from '../services/ics.js';
import { notify } from '../services/notify.js';
import { audit } from '../utils/audit.js';

const r = Router();
r.use(requireAuth);

const createSchema = z.object({
  mentorshipId: z.string(),
  topic: z.string().min(2).max(140),
  agenda: z.string().max(2000).optional(),
  start: z.coerce.date(),
  durationMin: z.number().int().min(15).max(180).default(45),
});

r.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'mentor' ? { mentor: req.user._id } : req.user.role === 'student' ? { student: req.user._id } : {};
  if (req.query.status) filter.status = req.query.status;
  const sessions = await Session.find(filter).populate('student mentor', 'name email').sort('start');
  res.json({ sessions });
}));

r.post('/', requireRole('student', 'mentor'), validate(createSchema), asyncHandler(async (req, res) => {
  const { mentorshipId, topic, agenda, start, durationMin } = req.body;
  const m = await getParticipantMentorship(mentorshipId, req.user, { requireActive: true });
  if (start <= new Date()) throw httpError(400, 'Session must be in the future');
  const end = new Date(start.getTime() + durationMin * 60000);

  // Prevent double-booking either participant
  const clash = await Session.findOne({
    status: 'scheduled',
    $or: [{ mentor: m.mentor }, { student: m.student }],
    start: { $lt: end }, end: { $gt: start },
  });
  if (clash) throw httpError(409, 'Time slot conflicts with another session');

  const session = await Session.create({
    mentorship: m._id, student: m.student, mentor: m.mentor, topic, agenda, start, end,
    meetingLink: `https://meet.jit.si/mentormap-${crypto.randomBytes(5).toString('hex')}`,
  });
  await session.populate('student mentor', 'name email');
  await Promise.all([
    notify(session.student, 'Session booked', `${topic} on ${start.toISOString()}`),
    notify(session.mentor, 'Session booked', `${topic} on ${start.toISOString()}`),
  ]);
  await audit(req.user, 'session.create', session._id);
  res.status(201).json({ session });
}));

r.patch('/:id', validate(z.object({
  status: z.enum(['completed', 'cancelled']).optional(),
  notes: z.string().max(5000).optional(),
})), asyncHandler(async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s || ![s.student, s.mentor].some((x) => x.equals(req.user._id))) throw httpError(404, 'Not found');
  if (req.body.status) s.status = req.body.status;
  if (req.body.notes !== undefined) s.notes = req.body.notes;
  await s.save();
  res.json({ session: s });
}));

r.get('/:id/ics', asyncHandler(async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s || ![s.student, s.mentor].some((x) => x.equals(req.user._id))) throw httpError(404, 'Not found');
  res.type('text/calendar').attachment('mentormap-session.ics').send(sessionToIcs(s));
}));

export default r;
