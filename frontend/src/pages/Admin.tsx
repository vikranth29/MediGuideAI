import { useEffect, useState } from 'react';
import { ShieldCheck, Users, Activity, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, AdminDataResponse } from '../services/api';

function formatJoined(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';
}

export function Admin() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const response = await api.getAdminData();
        setData(response);
      } catch (err) {
        const apiError = err as Error & { status?: number };
        if (apiError.status === 401) {
          navigate('/login', { replace: true, state: { from: '/admin' } });
          return;
        }
        if (apiError.status === 403) {
          setAccessDenied(true);
          return;
        }
        setError(apiError.message || 'Unable to load administrator information.');
      } finally {
        setLoading(false);
      }
    };

    void loadAdminData();
  }, [navigate]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-r from-slate-800 to-medical-800 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-300">Administrator access</p>
        <h1 className="mt-2 text-3xl font-bold">Admin Panel</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200">
          Review registered accounts and aggregate application activity. This page is read-only.
        </p>
      </section>

      {loading && (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ShieldCheck className="mx-auto h-10 w-10 animate-pulse text-medical-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading administrator information...</p>
        </section>
      )}

      {!loading && accessDenied && (
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
          <ShieldCheck className="mx-auto h-10 w-10 text-red-600 dark:text-red-400" />
          <h2 className="mt-3 text-xl font-bold text-red-800 dark:text-red-200">Access Denied</h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">Administrator privileges are required to view this page.</p>
        </section>
      )}

      {!loading && !accessDenied && error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && !accessDenied && !error && data && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Total Users', value: data.summary.total_users, icon: Users },
              { label: 'Administrators', value: data.summary.admin_count, icon: ShieldCheck },
              { label: 'Total Assessments', value: data.summary.total_predictions, icon: Activity },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Icon className="h-8 w-8 text-medical-600 dark:text-medical-400" />
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white">Registered Accounts</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{data.users.length} accounts</p>
            </div>
            {data.users.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No registered accounts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Joined</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.users.map((user) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400">#{user.id}</td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-slate-400" />
                            {user.full_name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                        <td className="whitespace-nowrap px-6 py-4 capitalize text-slate-600 dark:text-slate-300">{user.role}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-300">{formatJoined(user.created_at)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-emerald-700 dark:text-emerald-400">{user.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
