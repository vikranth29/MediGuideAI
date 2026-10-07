import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileClock, HeartPulse } from 'lucide-react';
import { api, HistoryPrediction } from '../services/api';

function formatPredictionDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Date unavailable';
}

export function History() {
  const [predictions, setPredictions] = useState<HistoryPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.getHistory();
        setPredictions(response.predictions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load medical history.');
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-r from-medical-700 to-teal-600 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-medical-100">Prediction records</p>
        <h1 className="mt-2 text-3xl font-bold">Medical History</h1>
        <p className="mt-3 max-w-2xl text-sm text-medical-50">
          Review prediction records available through MediGuide AI and download a report when needed.
        </p>
      </section>

      {loading && (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <FileClock className="mx-auto h-10 w-10 animate-pulse text-medical-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading medical history...</p>
        </section>
      )}

      {!loading && error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && predictions.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <HeartPulse className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-xl font-semibold">No Medical History Found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Start using the Symptom Checker to generate your first prediction.
          </p>
          <Link to="/symptom-checker" className="mt-5 inline-flex rounded-lg bg-medical-600 px-4 py-2 text-sm font-medium text-white hover:bg-medical-700">
            Open Symptom Checker
          </Link>
        </section>
      )}

      {!loading && !error && predictions.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Symptoms</th>
                  <th className="px-5 py-3">Predicted disease</th>
                  <th className="px-5 py-3">Medicine information</th>
                  <th className="px-5 py-3">Report</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                      {formatPredictionDate(prediction.prediction_date)}
                    </td>
                    <td className="max-w-xs px-5 py-4">{prediction.symptoms}</td>
                    <td className="px-5 py-4 font-medium text-medical-700 dark:text-medical-300">{prediction.disease}</td>
                    <td className="max-w-sm px-5 py-4 text-slate-500 dark:text-slate-400">{prediction.medicine || '—'}</td>
                    <td className="px-5 py-4">
                      <a
                        href={`/flask-api/download-report/${prediction.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-medical-200 px-3 py-2 text-sm font-medium text-medical-700 hover:bg-medical-50 dark:border-medical-800 dark:text-medical-300 dark:hover:bg-medical-950/40"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
