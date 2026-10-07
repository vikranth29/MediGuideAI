import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardPlus, Loader2, MapPin, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, SymptomPredictionResponse } from '../services/api';

const displaySymptom = (symptom: string) =>
  symptom.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

const normalizeSymptom = (symptom: string) =>
  symptom.trim().toLowerCase().replace(/\s+/g, '_');

export function SymptomChecker() {
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [symptomsLoading, setSymptomsLoading] = useState(true);
  const [symptomsError, setSymptomsError] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [duration, setDuration] = useState('1');
  const [severity, setSeverity] = useState('Mild');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SymptomPredictionResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSymptoms()
      .then(setAllSymptoms)
      .catch((err) => setSymptomsError(err instanceof Error ? err.message : 'Unable to load symptoms.'))
      .finally(() => setSymptomsLoading(false));
  }, []);

  const suggestions = useMemo(() => {
    const query = normalizeSymptom(inputValue);
    if (!query) return [];
    const prefix = allSymptoms.filter((symptom) => (
      !selectedSymptoms.includes(symptom) && symptom.startsWith(query)
    ));
    const substring = allSymptoms.filter((symptom) => (
      !selectedSymptoms.includes(symptom) && !symptom.startsWith(query) && symptom.includes(query)
    ));
    return [...prefix, ...substring].slice(0, 10);
  }, [allSymptoms, inputValue, selectedSymptoms]);

  const addSymptom = (symptom: string) => {
    const normalized = normalizeSymptom(symptom);
    if (!normalized || selectedSymptoms.includes(normalized) || !allSymptoms.includes(normalized)) return;
    setSelectedSymptoms((current) => [...current, normalized]);
    setInputValue('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms((current) => current.filter((item) => item !== symptom));
  };

  const clearSymptoms = () => {
    setSelectedSymptoms([]);
    setInputValue('');
    setActiveIndex(-1);
    setResult(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Escape') {
      setActiveIndex(-1);
    } else if (event.key === 'Backspace' && !inputValue && selectedSymptoms.length > 0) {
      removeSymptom(selectedSymptoms[selectedSymptoms.length - 1]);
    } else if ((event.key === 'Enter' || event.key === 'Tab') && suggestions.length > 0) {
      event.preventDefault();
      addSymptom(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    } else if (event.key === 'Enter' && inputValue) {
      const normalized = normalizeSymptom(inputValue);
      if (allSymptoms.includes(normalized)) {
        event.preventDefault();
        addSymptom(normalized);
      }
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }

    const numericAge = Number(age);
    if (!age || !Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) {
      setError('Please enter an age between 1 and 120.');
      return;
    }

    setLoading(true);
    try {
      const prediction = await api.predictSymptoms({
        symptoms: selectedSymptoms,
        duration,
        severity,
        age: numericAge,
        gender,
      });
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze these symptoms.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-r from-medical-700 to-teal-600 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <ClipboardPlus className="h-8 w-8" />
          <div>
            <p className="text-sm font-medium text-medical-100">AI Diagnostic Module</p>
            <h1 className="text-3xl font-bold">AI Symptom Checker</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-medical-50">
          Enter your symptoms below for an initial educational health assessment.
        </p>
      </section>

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {symptomsError && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {symptomsError}
          </div>
        )}

        <div>
          <label htmlFor="symptom-input" className="block text-sm font-bold">
            Symptoms <span className="font-normal text-slate-500">(type to search, press Enter or click to add)</span>
          </label>
          <div className="relative mt-2">
            <div
              className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-transparent px-3 py-2 focus-within:border-medical-500 focus-within:ring-2 focus-within:ring-medical-200 dark:border-slate-700"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-haspopup="listbox"
            >
              {selectedSymptoms.map((symptom) => (
                <span key={symptom} className="inline-flex max-w-full items-center gap-2 rounded-full border border-medical-200 bg-medical-50 px-3 py-1 text-sm text-medical-800 dark:border-medical-800 dark:bg-medical-950 dark:text-medical-200">
                  <span className="truncate">{displaySymptom(symptom)}</span>
                  <button type="button" onClick={() => removeSymptom(symptom)} aria-label={`Remove ${displaySymptom(symptom)}`} className="font-bold text-medical-600 hover:text-medical-900">×</button>
                </span>
              ))}
              <input
                ref={inputRef}
                id="symptom-input"
                value={inputValue}
                onChange={(event) => { setInputValue(event.target.value); setActiveIndex(-1); }}
                onKeyDown={handleKeyDown}
                disabled={symptomsLoading}
                autoComplete="off"
                placeholder={symptomsLoading ? 'Loading known symptoms...' : 'e.g. itching, headache...'}
                className="min-w-[160px] flex-1 border-0 bg-transparent px-1 py-1 outline-none disabled:cursor-wait"
                aria-autocomplete="list"
                aria-controls="symptom-dropdown"
              />
            </div>
            {suggestions.length > 0 && (
              <ul id="symptom-dropdown" role="listbox" className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {suggestions.map((symptom, index) => (
                  <li key={symptom} role="option" aria-selected={index === activeIndex}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addSymptom(symptom)}
                      className={`w-full px-4 py-2 text-left text-sm ${index === activeIndex ? 'bg-medical-50 text-medical-700 dark:bg-medical-950 dark:text-medical-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      {displaySymptom(symptom)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{selectedSymptoms.length} symptom{selectedSymptoms.length === 1 ? '' : 's'} selected</span>
            {selectedSymptoms.length > 0 && (
              <button type="button" onClick={clearSymptoms} className="font-medium text-medical-600 hover:text-medical-700">Clear all</button>
            )}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold">
            Duration
            <select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-slate-700">
              <option value="1">Less than 24 Hours</option>
              <option value="3">1 - 3 Days</option>
              <option value="7">More than 1 Week</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Severity
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-slate-700">
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Age
            <input type="number" min="1" max="120" required value={age} onChange={(event) => setAge(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-slate-700" />
          </label>
          <label className="text-sm font-bold">
            Gender
            <select value={gender} onChange={(event) => setGender(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-normal dark:border-slate-700">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <button type="submit" disabled={loading || symptomsLoading} className="flex w-full items-center justify-center gap-2 rounded-full bg-medical-600 px-4 py-3 font-semibold text-white transition hover:bg-medical-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ClipboardPlus className="h-5 w-5" />}
          {loading ? 'Analyzing Symptoms...' : 'Analyze Symptoms'}
        </button>
      </form>

      {result && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Predicted Disease</p>
                <h2 className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">{result.prediction}</h2>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold">Disease Description</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{result.description}</p>
          </div>

          {result.precautions.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900 dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Recommended Precautions</h2>
              <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                {result.precautions.filter(Boolean).map((precaution) => <li key={precaution}>✓ {precaution}</li>)}
              </ul>
            </div>
          )}

          {result.medicine && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/30">
              <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200">Suggested Medicines</h2>
              <p className="mt-3 text-lg text-amber-900 dark:text-amber-100">{result.medicine}</p>
              <p className="mt-4 text-sm text-amber-800 dark:text-amber-200"><strong>Medical Disclaimer:</strong> {result.disclaimer}</p>
            </div>
          )}

          {result.ai_advice && (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 dark:border-cyan-900 dark:bg-cyan-950/30">
              <h2 className="text-xl font-semibold text-cyan-800 dark:text-cyan-200">AI Health Advisor</h2>
              <p className="mt-3 whitespace-pre-wrap text-cyan-950 dark:text-cyan-100">{result.ai_advice}</p>
            </div>
          )}

          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-medical-200 bg-white p-6 shadow-sm dark:border-medical-900 dark:bg-slate-900 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">Need in-person medical attention? Locate nearby care centers.</p>
            <Link to="/hospitals" className="inline-flex items-center gap-2 rounded-full bg-medical-600 px-4 py-2 text-sm font-semibold text-white hover:bg-medical-700">
              <MapPin className="h-4 w-4" /> Find Nearby Hospitals
            </Link>
          </div>

          <button type="button" onClick={clearSymptoms} className="mx-auto flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-medical-600">
            <RotateCcw className="h-4 w-4" /> Start a new assessment
          </button>
        </section>
      )}
    </div>
  );
}
