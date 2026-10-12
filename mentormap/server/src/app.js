import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import mentorships from './routes/mentorships.js';
import sessions from './routes/sessions.js';
import goals from './routes/goals.js';
import resources from './routes/resources.js';
import feedback from './routes/feedback.js';
import admin from './routes/admin.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: '100kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), auth);
  app.use('/api/users', users);
  app.use('/api/mentorships', mentorships);
  app.use('/api/sessions', sessions);
  app.use('/api/goals', goals);
  app.use('/api/resources', resources);
  app.use('/api/feedback', feedback);
  app.use('/api/admin', admin);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
