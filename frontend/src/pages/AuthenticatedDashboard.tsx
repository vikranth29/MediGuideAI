import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, FileText, HeartPulse, MessageSquareHeart, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, DashboardPrediction } from '../services/api';

export function AuthenticatedDashboard() {
  const { user } = useAuth();
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [predictions, setPredictions] = useState<DashboardPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const summary = await api.getDashboardSummary();
      setTotalPredictions(summary.total_predictions);
      setPredictions(summary.recent_predictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-medical-700 to-teal-600 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-medical-100">Authenticated Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome, {user?.full_name}</h1>
        <p className="mt-2 text-sm text-medical-50">{user?.email}</p>
        <p className="mt-5 max-w-2xl text-sm text-medical-50">
          Review the latest MediGuide AI prediction activity and continue to the tools you need.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total predictions</p>
            <Activity className="h-5 w-5 text-medical-600" />
          </div>
          <p className="mt-3 text-3xl font-bold">{loading ? '—' : totalPredictions}</p>
        </div>
        <Link to="/chat" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-medical-300 dark:border-slate-800 dark:bg-slate-900">
          <MessageSquareHeart className="h-5 w-5 text-medical-600" />
          <p className="mt-3 font-semibold">Ask AI Doctor</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get structured educational guidance.</p>
        </Link>
        <Link to="/reports" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-medical-300 dark:border-slate-800 dark:bg-slate-900">
          <FileText className="h-5 w-5 text-teal-600" />
          <p className="mt-3 font-semibold">Analyze a report</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review a report with the analysis tools.</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-semibold">Recent predictions</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The five most recent records available to the application.</p>
          </div>
          <button onClick={() => void loadSummary()} aria-label="Refresh predictions" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && <p role="alert" className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {!loading && !error && predictions.length === 0 && (
          <div className="p-10 text-center">
            <HeartPulse className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 font-medium">No predictions available yet.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Continue exploring MediGuide AI features to get started.</p>
          </div>
        )}
        {!loading && !error && predictions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Symptoms</th>
                  <th className="px-5 py-3">Prediction</th>
                  <th className="px-5 py-3">Medicine</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                      {prediction.prediction_date ? new Date(prediction.prediction_date).toLocaleString() : '—'}
                    </td>
                    <td className="max-w-xs px-5 py-4">{prediction.symptoms}</td>
                    <td className="px-5 py-4 font-medium text-medical-700 dark:text-medical-300">{prediction.disease}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{prediction.medicine || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
