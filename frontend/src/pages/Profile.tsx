import { useEffect, useState } from 'react';
import { Mail, ShieldCheck, UserCircle } from 'lucide-react';
import { api, ProfileResponse } from '../services/api';

function formatMemberSince(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Date unavailable';
}

export function Profile() {
  const [profile, setProfile] = useState<ProfileResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.getProfile();
        setProfile(response.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile information.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-r from-medical-700 to-teal-600 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-medical-100">Account information</p>
        <h1 className="mt-2 text-3xl font-bold">User Profile</h1>
        <p className="mt-3 max-w-2xl text-sm text-medical-50">
          Review the account details currently associated with your MediGuide AI session.
        </p>
      </section>

      {loading && (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <UserCircle className="mx-auto h-10 w-10 animate-pulse text-medical-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading profile information...</p>
        </section>
      )}

      {!loading && error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && profile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-medical-50 text-medical-700 dark:bg-medical-950/60 dark:text-medical-300">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile.full_name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Account profile</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="mt-2 break-words font-medium">{profile.email}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                Role
              </div>
              <p className="mt-2 font-medium capitalize">{profile.role}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Member since</p>
              <p className="mt-2 font-medium">{formatMemberSince(profile.created_at)}</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            This page is read-only. It displays only the account information currently available from your MediGuide AI account.
          </p>
        </section>
      )}
    </div>
  );
}
