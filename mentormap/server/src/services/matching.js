// Mentor ranking with explainable compatibility signals (slide 4, step 02).
const norm = (arr = []) => arr.map((s) => s.trim().toLowerCase()).filter(Boolean);
const overlap = (a, b) => {
  const B = new Set(norm(b));
  return norm(a).filter((x) => B.has(x));
};

const WEIGHTS = { industry: 30, interests: 25, skills: 25, role: 10, availability: 10 };

export function scoreMentor(student, mentor, { openSlots = 1 } = {}) {
  let score = 0;
  const reasons = [];

  if (student.industry && mentor.industry && student.industry.toLowerCase() === mentor.industry.toLowerCase()) {
    score += WEIGHTS.industry;
    reasons.push(`Works in your target industry (${mentor.industry})`);
  }

  const shared = overlap(student.interests, mentor.interests);
  if (shared.length) {
    score += Math.min(1, shared.length / Math.max(1, norm(student.interests).length)) * WEIGHTS.interests;
    reasons.push(`Shared interests: ${shared.join(', ')}`);
  }

  // Skills the student wants to build that the mentor already has
  const skills = overlap(student.skills, mentor.skills);
  if (skills.length) {
    score += Math.min(1, skills.length / Math.max(1, norm(student.skills).length)) * WEIGHTS.skills;
    reasons.push(`Can coach skills: ${skills.join(', ')}`);
  }

  if (student.targetRole && mentor.currentRole) {
    const t = student.targetRole.toLowerCase();
    const r = mentor.currentRole.toLowerCase();
    if (t.includes(r) || r.includes(t)) {
      score += WEIGHTS.role;
      reasons.push(`Holds the role you're aiming for (${mentor.currentRole})`);
    }
  }

  if (mentor.availability?.length && openSlots > 0) {
    score += WEIGHTS.availability;
    reasons.push('Has open availability and mentee capacity');
  }

  return { score: Math.round(score), reasons };
}

export function rankMentors(student, mentors, loadByMentor = {}) {
  return mentors
    .map((m) => {
      const load = loadByMentor[m._id.toString()] || 0;
      const openSlots = (m.maxMentees ?? 3) - load;
      const { score, reasons } = scoreMentor(student, m, { openSlots });
      return { mentor: m, score, reasons, openSlots: Math.max(0, openSlots) };
    })
    .sort((a, b) => b.score - a.score);
}
