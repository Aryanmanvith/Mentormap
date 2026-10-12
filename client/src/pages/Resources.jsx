import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Card, Empty, Err, Tags, useLoad } from '../components/ui.jsx';

export default function Resources() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const { data, reload } = useLoad(() => api.get(`/resources?q=${encodeURIComponent(q)}`), [q]);
  const [form, setForm] = useState({ kind: user.role === 'student' ? 'question' : 'resource', title: '', body: '', url: '', tags: '' });
  const [answer, setAnswer] = useState({});
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const post = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/resources', {
        kind: form.kind, title: form.title, body: form.body || undefined, url: form.url || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setForm({ ...form, title: '', body: '', url: '', tags: '' }); reload();
    } catch (err) { setError(err.message); }
  };
  const reply = async (id) => { await api.post(`/resources/${id}/answers`, { body: answer[id] }); setAnswer({ ...answer, [id]: '' }); reload(); };

  return (
    <>
      <h2>Resource hub</h2>
      <input placeholder="Search resources and Q&A…" value={q} onChange={(e) => setQ(e.target.value)} />
      {user.role !== 'admin' && (
        <Card title={form.kind === 'question' ? 'Ask a question' : 'Share a resource'}>
          <form onSubmit={post}>
            {user.role === 'mentor' && <label>Type<select value={form.kind} onChange={set('kind')}><option value="resource">Resource</option><option value="question">Question</option></select></label>}
            <label>Title<input value={form.title} onChange={set('title')} required minLength={3} /></label>
            <label>Details<textarea value={form.body} onChange={set('body')} /></label>
            {form.kind === 'resource' && <label>Link<input type="url" value={form.url} onChange={set('url')} /></label>}
            <label>Tags (comma separated)<input value={form.tags} onChange={set('tags')} /></label>
            <Err msg={error} />
            <button className="primary">Post</button>
          </form>
        </Card>
      )}
      {!data ? <p>Loading…</p> : data.resources.length === 0 ? <Empty>Nothing here yet.</Empty> : data.resources.map((r) => (
        <Card key={r._id} title={r.title} action={<button className="link" onClick={() => api.post(`/resources/${r._id}/flag`).then(reload)}>Flag</button>}>
          <small>{r.kind} · {r.author?.name}</small>
          {r.body && <p>{r.body}</p>}
          {r.url && <a href={r.url} target="_blank" rel="noreferrer">{r.url}</a>}
          <Tags items={r.tags} />
          {r.kind === 'question' && <>
            {r.answers.map((a) => <p key={a._id} className="answer"><b>{a.author?.name}:</b> {a.body}</p>)}
            {user.role !== 'admin' && <div className="inline">
              <input placeholder="Write an answer…" value={answer[r._id] || ''} onChange={(e) => setAnswer({ ...answer, [r._id]: e.target.value })} />
              <button disabled={!(answer[r._id] || '').trim()} onClick={() => reply(r._id)}>Reply</button>
            </div>}
          </>}
        </Card>
      ))}
    </>
  );
}
