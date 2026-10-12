import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { Err } from '../components/ui.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try { mode === 'login' ? await login(form.email, form.password) : await register(form); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="login">
      <div className="hero">
        <h1>Mentor<span>Map</span></h1>
        <p>Structured mentorship that turns alumni experience into measurable student progress.</p>
        <p className="muted">Student → Mentor → Institution</p>
      </div>
      <form className="card" onSubmit={submit}>
        <h3>{mode === 'login' ? 'Sign in' : 'Create account'}</h3>
        {mode === 'register' && <>
          <label>Name<input value={form.name} onChange={set('name')} required minLength={2} /></label>
          <label>I am a
            <select value={form.role} onChange={set('role')}><option value="student">Student</option><option value="mentor">Alumni mentor</option></select>
          </label>
        </>}
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} required minLength={8} /></label>
        <Err msg={error} />
        <button className="primary">{mode === 'login' ? 'Sign in' : 'Sign up'}</button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
        {mode === 'login' && <small className="muted">Demo (after seeding): asha@mentormap.dev · priya@mentormap.dev · admin@mentormap.dev — password123</small>}
      </form>
    </div>
  );
}
