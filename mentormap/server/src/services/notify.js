import cron from 'node-cron';
import Session from '../models/Session.js';

// Pluggable notifier: replace the console transport with email/push when SMTP_URL is configured.
export async function notify(user, subject, body) {
  console.log(`[notify] to=${user.email} subject="${subject}" body="${body}"`);
}

export async function sendDueReminders(now = new Date(), windowMin = 60) {
  const until = new Date(now.getTime() + windowMin * 60000);
  const due = await Session.find({
    status: 'scheduled',
    reminderSent: false,
    start: { $gt: now, $lte: until },
  }).populate('student mentor');
  for (const s of due) {
    const when = s.start.toISOString();
    await notify(s.student, 'Session reminder', `"${s.topic}" with ${s.mentor.name} at ${when}. ${s.meetingLink}`);
    await notify(s.mentor, 'Session reminder', `"${s.topic}" with ${s.student.name} at ${when}. ${s.meetingLink}`);
    s.reminderSent = true;
    await s.save();
  }
  return due.length;
}

export function startReminderJob() {
  cron.schedule('*/5 * * * *', () => sendDueReminders().catch(console.error));
}
