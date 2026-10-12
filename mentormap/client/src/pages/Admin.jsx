import { api } from '../api.js';
import { Card, Empty, Stat, useLoad } from '../components/ui.jsx';

export default function Admin() {
  const { data, reload } = useLoad(async () => {
    const [a, p, f, l] = await Promise.all([api.get('/admin/analytics'), api.get('/admin/mentors/pending'), api.get('/admin/resources/flagged'), api.get('/admin/audit')]);
    return { a, pending: p.mentors, flagged: f.resources, logs: l.logs };
  });
  if (!data) return <p>Loading…</p>;
  const { a } = data;
  const verify = (id, verified) => api.patch(`/admin/mentors/${id}/verify`, { verified }).then(reload);
  const moderate = (id, hidden) => api.patch(`/admin/resources/${id}`, { hidden }).then(reload);

  return (
    <>
      <h2>Program overview</h2>
      <div className="stats">
        <Stat label="Students" value={a.users.students} />
        <Stat label="Verified mentors" value={a.users.mentors} />
        <Stat label="Active mentorships" value={a.mentorships.active} />
        <Stat label="Completed sessions (30d)" value={a.sessions.completedLast30Days} />
        <Stat label="Completion rate" value={a.sessions.completionRate != null ? `${a.sessions.completionRate}%` : null} />
        <Stat label="Avg rating" value={a.outcomes.avgRating} />
        <Stat label="Goals achieved" value={a.outcomes.goals.achieved || 0} />
      </div>
      <div className="grid">
        <Card title={`Mentor verification (${data.pending.length})`}>
          {data.pending.length ? data.pending.map((m) => (
            <div className="row" key={m._id}><div><b>{m.name}</b><small>{m.currentRole} {m.company && `@ ${m.company}`} · {m.email}</small></div>
              <div><button className="primary" onClick={() => verify(m._id, true)}>Verify</button></div></div>
          )) : <Empty>No mentors awaiting verification.</Empty>}
        </Card>
        <Card title="Needs support">
          <p><b>{a.mentorships.requested}</b> pending mentorship requests</p>
          <p><b>{a.needsSupport.unmatchedStudents.length}</b> students without a mentor</p>
          <ul>{a.needsSupport.unmatchedStudents.map((s) => <li key={s._id}>{s.name} <small>{s.industry}</small></li>)}</ul>
        </Card>
        <Card title={`Flagged content (${data.flagged.length})`}>
          {data.flagged.length ? data.flagged.map((r) => (
            <div className="row" key={r._id}><div><b>{r.title}</b><small>by {r.author?.name}</small></div>
              <div><button onClick={() => moderate(r._id, true)}>Hide</button> <button onClick={() => moderate(r._id, false)}>Dismiss</button></div></div>
          )) : <Empty>Nothing flagged.</Empty>}
        </Card>
        <Card title="Audit log">
          {data.logs.slice(0, 10).map((l) => <p key={l._id}><small>{new Date(l.createdAt).toLocaleString()}</small> {l.actor?.name || 'system'} — {l.action}</p>)}
        </Card>
      </div>
    </>
  );
}
