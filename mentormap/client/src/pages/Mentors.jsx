import { useState } from 'react';
import { api } from '../api.js';
import { Card, Empty, Err, Tags, useLoad } from '../components/ui.jsx';

export default function Mentors() {
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const { data, reload } = useLoad(async () => {
    const [m, ms] = await Promise.all([api.get(`/users/mentors/match?q=${encodeURIComponent(q)}`), api.get('/mentorships')]);
    return { matches: m.matches, requested: new Set(ms.mentorships.map((x) => x.mentor._id)) };
  }, [q]);

  const request = async (mentorId) => {
    setError('');
    try { await api.post('/mentorships', { mentorId, message: msg || undefined }); reload(); }
    catch (e) { setError(e.message); }
  };

  return (
    <>
      <h2>Find a mentor</h2>
      <p className="muted">Ranked by compatibility with your profile. Complete your <a href="/profile">profile</a> for better matches.</p>
      <input placeholder="Search by name, company, skill…" value={q} onChange={(e) => setQ(e.target.value)} />
      <textarea placeholder="Optional intro message sent with your request" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <Err msg={error} />
      {!data ? <p>Loading…</p> : data.matches.length === 0 ? <Empty>No mentors found.</Empty> : data.matches.map(({ mentor: m, score, reasons, openSlots }) => (
        <Card key={m._id} title={`${m.name} — ${m.currentRole || ''}${m.company ? ' @ ' + m.company : ''}`}
          action={<span className="score">{score}% match</span>}>
          <p>{m.bio || m.headline}</p>
          <Tags items={m.skills} />
          <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          <button className="primary" disabled={data.requested.has(m._id) || openSlots === 0} onClick={() => request(m._id)}>
            {data.requested.has(m._id) ? 'Requested' : openSlots === 0 ? 'At capacity' : 'Request mentorship'}
          </button>
        </Card>
      ))}
    </>
  );
}
