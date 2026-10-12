import { useState } from 'react';
import { api } from '../api.js';
import { Card, Empty, Err, fmt, useLoad } from '../components/ui.jsx';

export default function Goals() {
  const { data, reload } = useLoad(async () => {
    const [g, m] = await Promise.all([api.get('/goals'), api.get('/mentorships')]);
    return { goals: g.goals, mentorships: m.mentorships.filter((x) => x.status === 'active') };
  });
  const [form, setForm] = useState({ mentorshipId: '', title: '', milestones: '' });
  const [error, setError] = useState('');

  const create = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/goals', {
        mentorshipId: form.mentorshipId, title: form.title,
        milestones: form.milestones.split('\n').map((t) => t.trim()).filter(Boolean).map((title) => ({ title })),
      });
      setForm({ ...form, title: '', milestones: '' }); reload();
    } catch (err) { setError(err.message); }
  };
  const toggle = async (g, i) => {
    const milestones = g.milestones.map((m, j) => (j === i ? { ...m, done: !m.done } : m));
    const done = milestones.length && milestones.every((m) => m.done);
    await api.patch(`/goals/${g._id}`, { milestones, ...(done ? { status: 'achieved' } : { status: 'active' }) });
    reload();
  };
  if (!data) return <p>Loading…</p>;

  return (
    <>
      <h2>Goals & action items</h2>
      <Card title="New goal">
        <form onSubmit={create}>
          <label>Mentorship
            <select value={form.mentorshipId} onChange={(e) => setForm({ ...form, mentorshipId: e.target.value })} required>
              <option value="">Select…</option>
              {data.mentorships.map((m) => <option key={m._id} value={m._id}>{m.mentor.name} & {m.student.name}</option>)}
            </select></label>
          <label>Goal<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={2} /></label>
          <label>Milestones (one per line)<textarea value={form.milestones} onChange={(e) => setForm({ ...form, milestones: e.target.value })} /></label>
          <Err msg={error} />
          <button className="primary">Add goal</button>
        </form>
      </Card>
      {data.goals.length ? data.goals.map((g) => (
        <Card key={g._id} title={g.title} action={<span className={`pill ${g.status}`}>{g.status}</span>}>
          <progress value={g.progress} max="100" /> <small>{g.progress}%{g.dueDate && ` · due ${fmt(g.dueDate).split(',')[0]}`}</small>
          {g.milestones.map((m, i) => (
            <label key={m._id} className="check"><input type="checkbox" checked={m.done} onChange={() => toggle(g, i)} /> {m.title}</label>
          ))}
        </Card>
      )) : <Empty>No goals yet.</Empty>}
    </>
  );
}
