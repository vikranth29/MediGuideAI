import { FormEvent, useState } from 'react';
import { AlertCircle, Loader2, Pill, Search, ShieldCheck } from 'lucide-react';
import { api, MedicineSearchResponse } from '../services/api';

export function Medicine() {
  const [disease, setDisease] = useState('');
  const [result, setResult] = useState<MedicineSearchResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const query = disease.trim();
    setError('');
    setResult(null);

    if (!query) {
      setError('Please enter a disease name.');
      return;
    }

    setLoading(true);
    try {
      setResult(await api.searchMedicine(disease));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search medicine information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-r from-medical-700 to-teal-600 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <Pill className="h-8 w-8" />
          <div>
            <p className="text-sm font-medium text-medical-100">Medicine Information</p>
            <h1 className="text-3xl font-bold">Medicine Search</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-medical-50">
          Search medicine information associated with a known disease.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="medicine-disease" className="block text-sm font-semibold">
            Disease name
            <input
              id="medicine-disease"
              type="text"
              value={disease}
              onChange={(event) => setDisease(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="e.g. Fungal infection"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-200 dark:border-slate-700"
              autoComplete="off"
            />
          </label>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-medical-600 px-4 py-2.5 font-semibold text-white hover:bg-medical-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {result && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <Pill className="mt-1 h-6 w-6 shrink-0 text-medical-600" />
            <div className="min-w-0">
              <p className="text-sm text-slate-500 dark:text-slate-400">Medicine information for</p>
              <h2 className="mt-1 text-2xl font-bold">{result.disease}</h2>
              <p className="mt-4 break-words text-lg text-medical-700 dark:text-medical-300">{result.medicine || 'No medicine information available.'}</p>
            </div>
          </div>
          <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>This information is educational only and is not a medical prescription. Consult a qualified healthcare professional before taking any medication.</p>
          </div>
        </section>
      )}
    </div>
  );
}
