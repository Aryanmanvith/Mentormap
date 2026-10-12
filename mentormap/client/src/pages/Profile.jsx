import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Card, Err } from '../components/ui.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function Profile() {
  const { user, setUser } = useAuth();
  const isMentor = user.role === 'mentor';
  const [f, setF] = useState({
    headline: user.headline || '', bio: user.bio || '', industry: user.industry || '',
    interests: (user.interests || []).join(', '), skills: (user.skills || []).join(', '),
    targetRole: user.targetRole || '', currentRole: user.currentRole || '', company: user.company || '',
    maxMentees: user.maxMentees || 3,
  });
  const [availability, setAvailability] = useState(user.availability || []);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try {
      const body = { headline: f.headline, bio: f.bio, industry: f.industry, interests: list(f.interests), skills: list(f.skills) };
      if (isMentor) Object.assign(body, { currentRole: f.currentRole, company: f.company, maxMentees: Number(f.maxMentees), availability });
      else body.targetRole = f.targetRole;
      setUser((await api.put('/users/me', body)).user);
      setMsg('Saved');
    } catch (err) { setError(err.message); }
  };
  const setSlot = (i, k, v) => setAvailability(availability.map((s, j) => (j === i ? { ...s, [k]: k === 'day' ? Number(v) : v } : s)));

  return (
    <>
      <h2>Profile</h2>
      <Card><form onSubmit={save}>
        <label>Headline<input value={f.headline} onChange={set('headline')} /></label>
        <label>Bio<textarea value={f.bio} onChange={set('bio')} /></label>
        <label>Industry<input value={f.industry} onChange={set('industry')} /></label>
        {isMentor ? <>
          <label>Current role<input value={f.currentRole} onChange={set('currentRole')} /></label>
          <label>Company<input value={f.company} onChange={set('company')} /></label>
          <label>Max mentees<input type="number" min="1" max="20" value={f.maxMentees} onChange={set('maxMentees')} /></label>
        </> : <label>Target role<input value={f.targetRole} onChange={set('targetRole')} /></label>}
        <label>Interests (comma separated)<input value={f.interests} onChange={set('interests')} /></label>
        <label>Skills (comma separated)<input value={f.skills} onChange={set('skills')} /></label>
        {isMentor && <fieldset><legend>Weekly availability</legend>
          {availability.map((s, i) => (
            <div className="inline" key={i}>
              <select value={s.day} onChange={(e) => setSlot(i, 'day', e.target.value)}>{DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}</select>
              <input type="time" value={s.start} onChange={(e) => setSlot(i, 'start', e.target.value)} />
              <input type="time" value={s.end} onChange={(e) => setSlot(i, 'end', e.target.value)} />
              <button type="button" onClick={() => setAvailability(availability.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setAvailability([...availability, { day: 1, start: '18:00', end: '19:00' }])}>Add slot</button>
        </fieldset>}
        <Err msg={error} />{msg && <p className="ok">{msg}</p>}
        <button className="primary">Save profile</button>
      </form></Card>
    </>
  );
}
