import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HeartPulse, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      const destination = (location.state as { from?: string } | null)?.from || '/dashboard';
      navigate(destination);
    } catch (err) {
      const authError = err as Error & { details?: Record<string, string> };
      const details = authError.details
        ? Object.values(authError.details).filter(Boolean).join(' ')
        : '';
      setError(details || authError.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-medical-600 to-teal-500 flex items-center justify-center text-white">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Sign in to access your MediGuide AI account.</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
        {error && <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <label className="block text-sm font-medium">
          Email Address
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2" autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2" autoComplete="current-password" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          Remember me on this device
        </label>
        <button disabled={loading} className="w-full rounded-lg bg-medical-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Sign In'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account? <Link to="/register" className="font-semibold text-medical-600">Create Account</Link>
        </p>
      </form>
    </div>
  );
}
