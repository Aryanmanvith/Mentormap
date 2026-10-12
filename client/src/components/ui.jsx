import { useEffect, useState } from 'react';

export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    fn().then((d) => alive && setData(d)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}

export const Card = ({ title, action, children }) => (
  <section className="card">
    {(title || action) && <header><h3>{title}</h3>{action}</header>}
    {children}
  </section>
);

export const Stat = ({ label, value }) => (
  <div className="stat"><b>{value ?? '—'}</b><span>{label}</span></div>
);

export const Err = ({ msg }) => (msg ? <p className="error">{msg}</p> : null);
export const Empty = ({ children }) => <p className="muted">{children}</p>;
export const Tags = ({ items = [] }) => <div className="tags">{items.map((t) => <span key={t}>{t}</span>)}</div>;
export const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
