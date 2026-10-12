import { useState } from 'react';
import { api } from '../api.js';
import { Card, Empty, Err, Tags, useLoad } from '../components/ui.jsx';

export default function Requests() {
  const { data, reload } = useLoad(() => api.get('/mentorships'));
  const [error, setError] = useState('');
  const act = async (id, status) => {
    setError('');
    try { await api.patch(`/mentorships/${id}`, { status }); reload(); } catch (e) { setError(e.message); }
  };
  if (!data) return <p>Loading…</p>;
  const by = (s) => data.mentorships.filter((m) => m.status === s);

  return (
    <>
      <h2>Mentees</h2>
      <Err msg={error} />
      <Card title="Pending requests">
        {by('requested').length ? by('requested').map((m) => (
          <div key={m._id} className="row">
            <div><b>{m.student.name}</b> <small>wants to become {m.student.targetRole || 'a professional'}</small>
              {m.message && <p>“{m.message}”</p>}
              <ul className="reasons">{m.matchReasons?.map((r) => <li key={r}>{r}</li>)}</ul></div>
            <div><button className="primary" onClick={() => act(m._id, 'active')}>Accept</button> <button onClick={() => act(m._id, 'declined')}>Decline</button></div>
          </div>
        )) : <Empty>No pending requests.</Empty>}
      </Card>
      <Card title="Active mentees">
        {by('active').length ? by('active').map((m) => (
          <div key={m._id} className="row">
            <div><b>{m.student.name}</b><Tags items={m.student.skills} /></div>
            <button onClick={() => act(m._id, 'completed')}>Mark complete</button>
          </div>
        )) : <Empty>No active mentees.</Empty>}
      </Card>
    </>
  );
}
