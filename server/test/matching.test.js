import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMentor, rankMentors } from '../src/services/matching.js';
import { sessionToIcs } from '../src/services/ics.js';

const student = { industry: 'Technology', targetRole: 'Software Engineer', interests: ['Backend'], skills: ['node.js'] };
const good = { _id: 'a', industry: 'Technology', currentRole: 'Software Engineer', interests: ['backend'], skills: ['Node.js'], availability: [{ day: 1 }], maxMentees: 3 };
const poor = { _id: 'b', industry: 'Finance', currentRole: 'Analyst', interests: [], skills: [], availability: [], maxMentees: 3 };

test('better-fit mentors score higher and explain why', () => {
  const g = scoreMentor(student, good);
  assert.equal(g.score, 100);
  assert.ok(g.reasons.length >= 4);
  assert.ok(scoreMentor(student, poor).score < g.score);
});

test('rankMentors sorts by score and reports capacity', () => {
  const r = rankMentors(student, [poor, good], { a: 3 });
  assert.equal(r[0].mentor._id, 'a');
  assert.equal(r[0].openSlots, 0);
});

test('ics contains event fields', () => {
  const ics = sessionToIcs({ _id: '1', topic: 'Hi', start: new Date(0), end: new Date(60000), meetingLink: 'x' });
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:19700101T000000Z/);
});
