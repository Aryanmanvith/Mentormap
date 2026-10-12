import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import User from '../src/models/User.js';
import Mentorship from '../src/models/Mentorship.js';
import Session from '../src/models/Session.js';
import Goal from '../src/models/Goal.js';
import Resource from '../src/models/Resource.js';
import Feedback from '../src/models/Feedback.js';
import AuditLog from '../src/models/AuditLog.js';

await mongoose.connect(config.mongoUri);
await Promise.all([User, Mentorship, Session, Goal, Resource, Feedback, AuditLog].map((m) => m.deleteMany({})));

const passwordHash = await bcrypt.hash('password123', 10);
const avail = [{ day: 2, start: '18:00', end: '20:00' }, { day: 4, start: '17:00', end: '19:00' }, { day: 6, start: '10:00', end: '12:00' }];
const mk = (d) => User.create({ passwordHash, ...d });

const admin = await mk({ name: 'Institution Admin', email: 'admin@mentormap.dev', role: 'admin', verified: true });
const [priya, daniel, meera, sam] = await Promise.all([
  mk({ name: 'Priya Nair', email: 'priya@mentormap.dev', role: 'mentor', verified: true, headline: 'Senior Software Engineer', currentRole: 'Software Engineer', company: 'Stripe', industry: 'Technology', gradYear: 2015, interests: ['backend', 'system design', 'careers'], skills: ['node.js', 'system design', 'mongodb', 'interviewing'], availability: avail, bio: 'Happy to help with backend roles and interview prep.' }),
  mk({ name: 'Daniel Okafor', email: 'daniel@mentormap.dev', role: 'mentor', verified: true, headline: 'Product Manager', currentRole: 'Product Manager', company: 'Atlassian', industry: 'Technology', gradYear: 2012, interests: ['product', 'strategy', 'startups'], skills: ['roadmapping', 'user research', 'sql'], availability: avail, bio: 'Moving from engineering to product.' }),
  mk({ name: 'Meera Iyer', email: 'meera@mentormap.dev', role: 'mentor', verified: true, headline: 'Data Scientist', currentRole: 'Data Scientist', company: 'Flipkart', industry: 'E-commerce', gradYear: 2018, interests: ['machine learning', 'analytics'], skills: ['python', 'sql', 'statistics'], availability: avail, bio: 'Analytics and ML career paths.' }),
  mk({ name: 'Sam Rivera', email: 'sam@mentormap.dev', role: 'mentor', verified: false, headline: 'UX Designer', currentRole: 'Designer', company: 'Figma', industry: 'Technology', interests: ['design'], skills: ['figma'], availability: avail }),
]);
const asha = await mk({ name: 'Asha Verma', email: 'asha@mentormap.dev', role: 'student', verified: true, industry: 'Technology', targetRole: 'Software Engineer', interests: ['backend', 'system design'], skills: ['node.js', 'mongodb', 'interviewing'], gradYear: 2027, bio: 'Final-year CS student.' });
const ravi = await mk({ name: 'Ravi Kumar', email: 'ravi@mentormap.dev', role: 'student', verified: true, industry: 'E-commerce', targetRole: 'Data Scientist', interests: ['machine learning'], skills: ['python', 'statistics'], gradYear: 2027 });
await mk({ name: 'Lena Park', email: 'lena@mentormap.dev', role: 'student', verified: true, industry: 'Technology', targetRole: 'Product Manager', interests: ['product'], skills: ['user research'], gradYear: 2026 });

const m1 = await Mentorship.create({ student: asha._id, mentor: priya._id, status: 'active', matchScore: 90, matchReasons: ['Works in your target industry (Technology)', 'Shared interests: backend, system design'] });
await Mentorship.create({ student: ravi._id, mentor: meera._id, status: 'requested', message: 'Would love guidance on breaking into data science.' });

const day = 86400000;
const past = await Session.create({ mentorship: m1._id, student: asha._id, mentor: priya._id, topic: 'Resume and interview roadmap', start: new Date(Date.now() - 3 * day), end: new Date(Date.now() - 3 * day + 45 * 60000), status: 'completed', meetingLink: 'https://meet.jit.si/mentormap-demo1' });
await Session.create({ mentorship: m1._id, student: asha._id, mentor: priya._id, topic: 'System design fundamentals', agenda: 'Walk through a URL shortener design', start: new Date(Date.now() + 2 * day), end: new Date(Date.now() + 2 * day + 45 * 60000), meetingLink: 'https://meet.jit.si/mentormap-demo2' });
await Feedback.create({ session: past._id, from: asha._id, to: priya._id, rating: 5, comment: 'Very actionable.' });
await Feedback.create({ session: past._id, from: priya._id, to: asha._id, rating: 4, comment: 'Prepared and curious.', actionItems: ['Build one project with auth + tests', 'Practise 2 system design questions a week'] });
await Goal.create({ mentorship: m1._id, student: asha._id, createdBy: priya._id, title: 'Land a backend internship interview', dueDate: new Date(Date.now() + 45 * day), milestones: [{ title: 'Polish resume', done: true }, { title: 'Ship MERN portfolio project', done: false }, { title: 'Complete 10 mock interviews', done: false }] });
await Resource.create({ kind: 'resource', author: priya._id, title: 'How I prepare for system design interviews', body: 'A checklist: requirements, estimation, API, data model, scaling.', url: 'https://github.com/donnemartin/system-design-primer', tags: ['interviews', 'system design'] });
await Resource.create({ kind: 'question', author: asha._id, title: 'How many projects should a fresher resume have?', tags: ['resume'], answers: [{ author: priya._id, body: 'Two or three strong ones with measurable outcomes beat many shallow ones.' }] });

console.log('Seeded. Demo logins (password: password123): admin@, priya@, daniel@, asha@, ravi@ mentormap.dev');
await mongoose.disconnect();
