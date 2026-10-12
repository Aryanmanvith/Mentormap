import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Card, Empty, Stat, fmt, useLoad } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { data } = useLoad(async () => {
    const [m, s, g] = await Promise.all([api.get('/mentorships'), api.get('/sessions?status=scheduled'), api.get('/goals')]);
    return { mentorships: m.mentorships, sessions: s.sessions, goals: g.goals };
  });
  if (!data) return <p>Loading…</p>;
  const active = data.mentorships.filter((m) => m.status === 'active');
  const upcoming = data.sessions.filter((s) => new Date(s.start) > new Date());
  const open = data.goals.filter((g) => g.status === 'active');

  return (
    <>
      <h2>Welcome, {user.name.split(' ')[0]}</h2>
      {user.role === 'mentor' && !user.verified && <p className="notice">Your mentor profile is awaiting institution verification. You'll appear in student matches once approved.</p>}
      <div className="stats">
        <Stat label={user.role === 'student' ? 'Active mentors' : 'Active mentees'} value={active.length} />
        <Stat label="Upcoming sessions" value={upcoming.length} />
        <Stat label="Open goals" value={open.length} />
      </div>
      <div className="grid">
        <Card title="Next sessions" action={<Link to="/sessions">All sessions</Link>}>
          {upcoming.length ? upcoming.slice(0, 4).map((s) => (
            <div className="row" key={s._id}><div><b>{s.topic}</b><small>{fmt(s.start)} · with {user.role === 'student' ? s.mentor.name : s.student.name}</small></div><a href={s.meetingLink} target="_blank" rel="noreferrer">Join</a></div>
          )) : <Empty>No sessions booked.</Empty>}
        </Card>
        <Card title="Goal progress" action={<Link to="/goals">All goals</Link>}>
          {open.length ? open.slice(0, 4).map((g) => (
            <div key={g._id} className="goal-mini"><span>{g.title}</span><progress value={g.progress} max="100" /></div>
          )) : <Empty>No goals yet. Turn session advice into milestones.</Empty>}
        </Card>
      </div>
      {user.role === 'student' && !active.length && <p className="notice">You have no active mentor yet. <Link to="/mentors">Find a mentor →</Link></p>}
    </>
  );
}
