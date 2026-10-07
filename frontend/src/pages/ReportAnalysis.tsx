import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Stethoscope,
  Info,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { HealthMetric, ReportAnalysisResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface ChartInstance {
  destroy: () => void;
}

interface ChartConstructor {
  new (canvas: HTMLCanvasElement, config: {
    type: 'bar';
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
        borderRadius: number;
        borderSkipped: false;
      }>;
    };
    options: {
      indexAxis: 'y';
      responsive: boolean;
      maintainAspectRatio: boolean;
      animation: { duration: number; easing: string };
      plugins: {
        legend: { display: boolean };
        tooltip: {
          callbacks: {
            title: (items: Array<{ label: string }>) => string;
            label: (item: { dataIndex: number }) => string;
          };
          backgroundColor: string;
          titleFont: { weight: string; size: number };
          bodyFont: { size: number };
          padding: number;
          cornerRadius: number;
        };
      };
      scales: {
        x: {
          beginAtZero: boolean;
          grid: { color: string };
          ticks: { color: string; font: { size: number } };
          title: { display: boolean; text: string };
        };
        y: {
          grid: { display: boolean };
          ticks: { color: string; font: { size: number } };
        };
      };
    };
  }): ChartInstance;
}

declare global {
  interface Window {
    Chart?: ChartConstructor;
  }
}

const CHART_SCRIPT_ID = 'report-chartjs-script';
const CHART_SCRIPT_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.7/chart.umd.min.js';

export const ReportAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit. Please upload a smaller document.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      setFile(dropped);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!useManualInput && !file) {
      setError('Please select a medical report file or switch to manual text input.');
      return;
    }
    if (useManualInput && !manualText.trim()) {
      setError('Please paste your medical report text.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.analyzeReport(
        useManualInput ? undefined : file || undefined,
        useManualInput ? manualText.trim() : undefined,
        selectedProvider
      );
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze report.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuestions = () => {
    if (!result?.questionsForDoctor) return;
    const questionsText = result.questionsForDoctor.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(questionsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const metrics: HealthMetric[] = result?.healthMetrics || [];
    if (!metrics.length || !chartCanvasRef.current) {
      chartRef.current?.destroy();
      chartRef.current = null;
      return;
    }

    const renderChart = () => {
      if (!chartCanvasRef.current || !window.Chart) {
        return;
      }

      chartRef.current?.destroy();
      const labels = metrics.map((metric) =>
        metric.unit ? `${metric.name} (${metric.unit})` : metric.name
      );
      const values = metrics.map((metric) => metric.value);
      const colors = metrics.map((metric) =>
        metric.flagged ? 'rgba(239,68,68,.75)' : 'rgba(22,163,74,.72)'
      );
      const borders = metrics.map((metric) => (metric.flagged ? '#ef4444' : '#16a34a'));

      chartRef.current = new window.Chart(chartCanvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Measured Value',
            data: values,
            backgroundColor: colors,
            borderColor: borders,
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => items[0]?.label || '',
                label: (item) => {
                  const metric = metrics[item.dataIndex];
                  return ` Value: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}${metric.flagged ? '  Flagged' : '  Normal'}`;
                },
              },
              backgroundColor: 'rgba(15,23,42,.92)',
              titleFont: { weight: '600', size: 13 },
              bodyFont: { size: 12 },
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,.05)' },
              ticks: { color: '#6c757d', font: { size: 11 } },
              title: { display: true, text: 'Measured Value' },
            },
            y: {
              grid: { display: false },
              ticks: { color: '#374151', font: { size: 11 } },
            },
          },
        },
      });
    };

    const existingScript = document.getElementById(CHART_SCRIPT_ID) as HTMLScriptElement | null;
    if (window.Chart) {
      renderChart();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderChart, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = CHART_SCRIPT_ID;
      script.src = CHART_SCRIPT_SRC;
      script.integrity = 'sha512-yKkCKiGSGZ1gD64MHQwk2NQFZ7xk3ElfKPQoGZxSQ1bMhfwkV9GFMW5ZRN3q2TpHODfuL04ZLr+RJLUhQCrA==';
      script.crossOrigin = 'anonymous';
      script.onload = renderChart;
      document.head.appendChild(script);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [result]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Title Header */}
      <div className="space-y-2 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Clinical Document Intelligence</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Medical Report Analysis
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload your lab tests, blood panels, radiology reports, or discharge summaries for a safe, patient-friendly breakdown.
        </p>
      </div>

      {/* Main Upload / Input Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider selector & Mode toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseManualInput(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !useManualInput
                    ? 'bg-medical-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Upload File (PDF / Images / TXT)
              </button>
              <button
                type="button"
                onClick={() => setUseManualInput(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  useManualInput
                    ? 'bg-medical-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Paste Report Text
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Model:</span>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI GPT-4o</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="fallback">Built-in Engine</option>
              </select>
            </div>
          </div>

          {/* File Drag and Drop Zone */}
          {!useManualInput ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-medical-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer relative"
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="h-12 w-12 rounded-2xl bg-medical-50 dark:bg-medical-950 text-medical-600 dark:text-medical-400 mx-auto flex items-center justify-center border border-medical-200 dark:border-medical-800">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {file ? file.name : 'Click to upload or drag & drop medical document'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, PNG, JPG, JPEG, TXT (Up to 10MB)
                  </p>
                </div>
                {file && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <FileCheck className="w-3.5 h-3.5" />
                    Ready for extraction ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paste Lab Report Text:
              </label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={6}
                placeholder="Paste laboratory results, blood panel measurements, or clinical summary text here..."
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 font-mono"
              />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Your files are processed in memory and never permanently stored on servers.
            </span>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || (!file && !manualText.trim())}
              className="px-6 py-3 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting & Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Medical Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Structured Analysis Results */}
      {result && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in duration-300">
          {/* Header & Risk */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Report Analysis Breakdown
                </h2>
                <RiskBadge level={result.riskLevel} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Source Document: <span className="font-medium text-slate-700 dark:text-slate-300">{result.fileName || 'Report Data'}</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-500">
              Provider: {result.provider || selectedProvider}
            </div>
          </div>

          {/* AI Non-Diagnostic Banner */}
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 text-teal-900 dark:text-teal-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
            <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>AI-generated educational summary — not a medical diagnosis.</span>
          </div>

          {/* Summary Box */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Plain-Language Summary
            </h3>
            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {result.summary}
            </p>
          </div>

          {/* Structured Parameters Table */}
          {result.healthMetrics && result.healthMetrics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Numeric Health Metrics
              </h3>
              <div className="h-64 sm:h-80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <canvas
                  ref={chartCanvasRef}
                  role="img"
                  aria-label="Health metrics bar chart"
                />
              </div>
            </div>
          )}

          {/* Structured Parameters Table */}
          {result.structuredFindings && result.structuredFindings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Parameters & Biomarkers
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Metric / Test</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Educational Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                    {result.structuredFindings.map((finding, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {finding.metric}
                          {finding.value && (
                            <span className="block text-xs font-mono text-slate-500 font-normal">
                              {finding.value}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {finding.status === 'abnormal' || finding.status === 'concerning' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              <AlertTriangle className="w-3 h-3" />
                              Out of Range
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Within Norms
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                          {finding.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Risk Flags / Attention items */}
          {result.riskFlags && result.riskFlags.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Notable Findings to Review with Doctor
              </h4>
              <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200 list-disc list-inside">
                {result.riskFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Questions For Doctor */}
          {result.questionsForDoctor && result.questionsForDoctor.length > 0 && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-medical-700 dark:text-medical-400 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4" />
                  Recommended Questions for Your Healthcare Provider
                </h3>
                <button
                  onClick={handleCopyQuestions}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Questions'}</span>
                </button>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {result.questionsForDoctor.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-medical-600 dark:text-medical-400">{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 italic">
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
