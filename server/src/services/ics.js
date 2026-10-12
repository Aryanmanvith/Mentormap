// Minimal iCalendar export so sessions sync into any calendar provider.
const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s = '') => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

export function sessionToIcs(session) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MentorMap//EN',
    'BEGIN:VEVENT',
    `UID:${session._id}@mentormap`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(session.start)}`,
    `DTEND:${fmt(session.end)}`,
    `SUMMARY:${esc('MentorMap: ' + session.topic)}`,
    `DESCRIPTION:${esc((session.agenda || '') + '\n' + (session.meetingLink || ''))}`,
    `URL:${session.meetingLink || ''}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Mentoring session starts soon',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
