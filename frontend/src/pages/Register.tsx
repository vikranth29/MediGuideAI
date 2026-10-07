import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.fullName.trim(), form.email.trim(), form.password, form.confirmPassword);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const authError = err as Error & { details?: Record<string, string> };
      const details = authError.details
        ? Object.values(authError.details).filter(Boolean).join(' ')
        : '';
      setError(details || authError.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-br from-medical-600 to-teal-500 flex items-center justify-center text-white">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Your Account</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Join MediGuide AI for personalized healthcare assistance.</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
        {error && <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
        <label className="block text-sm font-medium">Full Name<input required minLength={2} value={form.fullName} onChange={(event) => update('fullName', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2" autoComplete="name" /></label>
        <label className="block text-sm font-medium">Email Address<input type="email" required value={form.email} onChange={(event) => update('email', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2" autoComplete="email" /></label>
        <label className="block text-sm font-medium">Password<input type="password" required value={form.password} onChange={(event) => update('password', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2" autoComplete="new-password" /></label>
        <label className="block text-sm font-medium">Confirm Password<input type="password" required value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2" autoComplete="new-password" /></label>
        <button disabled={loading} className="w-full rounded-lg bg-medical-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Create Account'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-medical-600">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
