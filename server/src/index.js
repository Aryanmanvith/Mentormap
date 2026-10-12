import mongoose from 'mongoose';
import { config } from './config.js';
import { createApp } from './app.js';
import { startReminderJob } from './services/notify.js';

await mongoose.connect(config.mongoUri);
console.log('MongoDB connected');
startReminderJob();
createApp().listen(config.port, () => console.log(`API listening on :${config.port}`));
