import React, { useState } from 'react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Login failed');
      window.location.href = '/admin/dashboard';
    } catch (err:any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 400, margin: '3rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 8 }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <label>Email<br />
          <input value={email} onChange={e=>setEmail(e.target.value)} required type="email" />
        </label>
        <br />
        <label>Password<br />
          <input value={password} onChange={e=>setPassword(e.target.value)} required type="password" />
        </label>
        <br />
        <button disabled={loading} type="submit">{loading ? 'Logging in...' : 'Login'}</button>
        {error && <p style={{ color:'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default AdminLogin;
