import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Card, Empty, Err, fmt, useLoad } from '../components/ui.jsx';

export default function Sessions() {
  const { user } = useAuth();
  const { data, reload } = useLoad(async () => {
    const [s, m] = await Promise.all([api.get('/sessions'), api.get('/mentorships')]);
    return { sessions: s.sessions, mentorships: m.mentorships.filter((x) => x.status === 'active') };
  });
  const [form, setForm] = useState({ mentorshipId: '', topic: '', agenda: '', start: '', durationMin: 45 });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const book = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/sessions', { ...form, start: new Date(form.start).toISOString(), durationMin: Number(form.durationMin) });
      setForm({ ...form, topic: '', agenda: '', start: '' }); reload();
    } catch (err) { setError(err.message); }
  };
  const update = async (id, body) => { await api.patch(`/sessions/${id}`, body); reload(); };
  if (!data) return <p>Loading…</p>;
  const other = (s) => (user.role === 'student' ? s.mentor : s.student).name;

  return (
    <>
      <h2>Sessions</h2>
      <Card title="Book a session">
        {data.mentorships.length === 0 ? <Empty>You need an active mentorship to book sessions.</Empty> : (
          <form onSubmit={book}>
            <label>Mentorship
              <select value={form.mentorshipId} onChange={set('mentorshipId')} required>
                <option value="">Select…</option>
                {data.mentorships.map((m) => <option key={m._id} value={m._id}>{user.role === 'student' ? m.mentor.name : m.student.name}</option>)}
              </select></label>
            <label>Topic<input value={form.topic} onChange={set('topic')} required minLength={2} /></label>
            <label>Agenda<textarea value={form.agenda} onChange={set('agenda')} /></label>
            <label>Start<input type="datetime-local" value={form.start} onChange={set('start')} required /></label>
            <label>Duration (min)<input type="number" min="15" max="180" step="15" value={form.durationMin} onChange={set('durationMin')} /></label>
            <Err msg={error} />
            <button className="primary">Book</button>
          </form>
        )}
      </Card>
      <Card title="All sessions">
        {data.sessions.length ? [...data.sessions].reverse().map((s) => (
          <div key={s._id} className="row">
            <div><b>{s.topic}</b> <span className={`pill ${s.status}`}>{s.status}</span>
              <small>{fmt(s.start)} · with {other(s)}</small>
              {s.agenda && <small>Agenda: {s.agenda}</small>}</div>
            <div className="actions">
              {s.status === 'scheduled' && <>
                <a href={s.meetingLink} target="_blank" rel="noreferrer">Join</a>
                <button onClick={() => api.downloadIcs(s._id)}>Add to calendar</button>
                <button onClick={() => update(s._id, { status: 'completed' })}>Complete</button>
                <button onClick={() => update(s._id, { status: 'cancelled' })}>Cancel</button>
              </>}
            </div>
          </div>
        )) : <Empty>No sessions yet.</Empty>}
      </Card>
    </>
  );
}
