import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNoindex } from '../../useSEO';

export default function AdminLogin() {
  const { login, isAuth, loading } = useAuth();
  const [email, setEmail] = useState('admin@kasconplc.com');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useNoindex();

  if (!loading && isAuth) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success('Welcome back');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen hero-mesh grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-3xl shadow-soft p-8 space-y-5">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand text-white grid place-items-center font-bold mb-3">KS</div>
          <h1 className="font-display text-2xl font-bold text-navy">Admin Sign In</h1>
          <p className="text-sm text-slate-400 mt-1">Kassa & Sons Construction PLC</p>
        </div>
        <div>
          <label htmlFor="admin-email" className="label">Email</label>
          <input id="admin-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="admin-password" className="label">Password</label>
          <input id="admin-password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
