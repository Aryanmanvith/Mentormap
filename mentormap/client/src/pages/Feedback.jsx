import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Card, Empty, Err, fmt, useLoad } from '../components/ui.jsx';

export default function Feedback() {
  const { user } = useAuth();
  const { data, reload } = useLoad(async () => {
    const [s, f] = await Promise.all([api.get('/sessions?status=completed'), api.get('/feedback')]);
    return { sessions: s.sessions, received: f.feedback };
  });
  const [form, setForm] = useState({ sessionId: '', rating: 5, comment: '', actionItems: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/feedback', {
        sessionId: form.sessionId, rating: Number(form.rating), comment: form.comment || undefined,
        actionItems: form.actionItems.split('\n').map((x) => x.trim()).filter(Boolean),
      });
      setForm({ sessionId: '', rating: 5, comment: '', actionItems: '' }); reload();
    } catch (err) { setError(err.message); }
  };
  if (!data) return <p>Loading…</p>;

  return (
    <>
      <h2>Feedback</h2>
      <Card title="Give feedback on a completed session">
        {data.sessions.length === 0 ? <Empty>Complete a session first.</Empty> : (
          <form onSubmit={submit}>
            <label>Session<select value={form.sessionId} onChange={(e) => setForm({ ...form, sessionId: e.target.value })} required>
              <option value="">Select…</option>
              {data.sessions.map((s) => <option key={s._id} value={s._id}>{s.topic} — {fmt(s.start)}</option>)}
            </select></label>
            <label>Rating (1–5)<input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></label>
            <label>Comment<textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></label>
            {user.role === 'mentor' && <label>Action items for the student (one per line)<textarea value={form.actionItems} onChange={(e) => setForm({ ...form, actionItems: e.target.value })} /></label>}
            <Err msg={error} />
            <button className="primary">Submit</button>
          </form>
        )}
      </Card>
      <Card title="Feedback you received">
        {data.received.length ? data.received.map((f) => (
          <div key={f._id} className="row"><div>
            <b>{'★'.repeat(f.rating)}</b> <small>from {f.from.name} · {f.session?.topic}</small>
            {f.comment && <p>{f.comment}</p>}
            {f.actionItems?.length > 0 && <ul>{f.actionItems.map((a) => <li key={a}>{a}</li>)}</ul>}
          </div></div>
        )) : <Empty>No feedback yet.</Empty>}
      </Card>
    </>
  );
}
