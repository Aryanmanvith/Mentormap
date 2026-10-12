import Mentorship from '../models/Mentorship.js';
import { httpError } from '../middleware/error.js';

// Loads a mentorship and ensures the user is a participant (admins may read).
export async function getParticipantMentorship(id, user, { requireActive = false } = {}) {
  const m = await Mentorship.findById(id);
  if (!m) throw httpError(404, 'Mentorship not found');
  const isParticipant = [m.student, m.mentor].some((x) => x.equals(user._id));
  if (!isParticipant && user.role !== 'admin') throw httpError(403, 'Not part of this mentorship');
  if (requireActive && m.status !== 'active') throw httpError(409, 'Mentorship is not active');
  return m;
}
