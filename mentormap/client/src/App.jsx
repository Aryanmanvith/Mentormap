import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Mentors from './pages/Mentors.jsx';
import Requests from './pages/Requests.jsx';
import Sessions from './pages/Sessions.jsx';
import Goals from './pages/Goals.jsx';
import Resources from './pages/Resources.jsx';
import Profile from './pages/Profile.jsx';
import Feedback from './pages/Feedback.jsx';
import Admin from './pages/Admin.jsx';

const NAV = {
  student: [['/', 'Dashboard'], ['/mentors', 'Find mentors'], ['/sessions', 'Sessions'], ['/goals', 'Goals'], ['/resources', 'Resource hub'], ['/feedback', 'Feedback'], ['/profile', 'Profile']],
  mentor: [['/', 'Dashboard'], ['/requests', 'Mentees'], ['/sessions', 'Sessions'], ['/goals', 'Goals'], ['/resources', 'Resource hub'], ['/feedback', 'Feedback'], ['/profile', 'Profile & availability']],
  admin: [['/', 'Overview'], ['/resources', 'Resource hub']],
};

export default function App() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>;

  return (
    <div className="shell">
      <aside>
        <h1>Mentor<span>Map</span></h1>
        <nav>{NAV[user.role].map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
        <div className="me">
          <strong>{user.name}</strong>
          <small>{user.role}{user.role === 'mentor' && !user.verified ? ' · pending verification' : ''}</small>
          <button className="link" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={user.role === 'admin' ? <Admin /> : <Dashboard />} />
          {user.role === 'student' && <Route path="/mentors" element={<Mentors />} />}
          {user.role === 'mentor' && <Route path="/requests" element={<Requests />} />}
          {user.role !== 'admin' && <>
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/profile" element={<Profile />} />
          </>}
          <Route path="/resources" element={<Resources />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
