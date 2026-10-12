import { Router } from 'express';
import { z } from 'zod';
import Resource from '../models/Resource.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validate.js';
import { httpError } from '../middleware/error.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(async (req, res) => {
  const filter = { hidden: false };
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.tag) filter.tags = req.query.tag.toString().toLowerCase();
  if (req.query.q) filter.$text = { $search: req.query.q.toString() };
  const items = await Resource.find(filter).populate('author', 'name role').populate('answers.author', 'name role').sort('-createdAt').limit(100);
  res.json({ resources: items });
}));

const createSchema = z.object({
  kind: z.enum(['resource', 'question']).default('resource'),
  title: z.string().min(3).max(200),
  body: z.string().max(5000).optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string().max(30)).max(8).default([]),
});

r.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  if (req.body.kind === 'resource' && req.user.role === 'student')
    throw httpError(403, 'Students can ask questions; mentors and admins publish resources');
  const item = await Resource.create({ ...req.body, tags: req.body.tags.map((t) => t.toLowerCase()), author: req.user._id });
  res.status(201).json({ resource: item });
}));

r.post('/:id/answers', validate(z.object({ body: z.string().min(2).max(3000) })), asyncHandler(async (req, res) => {
  const item = await Resource.findOne({ _id: req.params.id, hidden: false, kind: 'question' });
  if (!item) throw httpError(404, 'Question not found');
  item.answers.push({ author: req.user._id, body: req.body.body });
  await item.save();
  res.status(201).json({ resource: item });
}));

r.post('/:id/flag', asyncHandler(async (req, res) => {
  const item = await Resource.findByIdAndUpdate(req.params.id, { flagged: true }, { new: true });
  if (!item) throw httpError(404, 'Not found');
  res.json({ resource: item });
}));

export default r;
