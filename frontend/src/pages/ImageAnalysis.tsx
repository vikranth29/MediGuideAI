import React, { useState } from 'react';
import {
  Upload,
  ScanEye,
  AlertTriangle,
  Info,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { ImageAnalysisResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const ImageAnalysis: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('gemini');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        setError('Image file size exceeds 8MB limit.');
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please drop a valid image file (JPG, PNG, WEBP).');
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please select or drop an image to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.analyzeImage(imageFile, undefined, userPrompt.trim(), selectedProvider);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Image analysis could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Title Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-semibold">
          <ScanEye className="w-3.5 h-3.5" />
          <span>Educational Computer Vision</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Medical Image Inspection
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload non-sensitive skin, rash, or educational healthcare images for objective visual observations.
        </p>
      </div>

      {/* Strict Clinical Warning Box */}
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-5 flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-bold">IMPORTANT NON-DIAGNOSTIC LIMITATION:</p>
          <p className="leading-relaxed">
            I can provide general observations, but this image must be evaluated by a qualified healthcare professional. AI image analysis cannot replace clinical dermatoscope inspection, biopsy, or in-person radiological evaluation.
          </p>
        </div>
      </div>

      {/* Upload and Control Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Upload Medical Image
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Vision Model:</span>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="gemini">Google Gemini Vision</option>
                <option value="openai">OpenAI GPT-4o Vision</option>
                <option value="fallback">Built-in Knowledge Engine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer relative min-h-[220px] flex flex-col items-center justify-center"
            >
              <input
                type="file"
                id="image-upload"
                onChange={handleImageChange}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Click or drag & drop image here
                </p>
                <p className="text-[11px] text-slate-400">
                  PNG, JPG, JPEG, WEBP (Max 8MB)
                </p>
              </div>
            </div>

            {/* Preview Box & Description */}
            <div className="space-y-4">
              <div className="h-44 w-full rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Medical preview"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                    <span className="text-xs">No image selected</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Additional Clinical Context (Optional):
                </label>
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g. It appeared 3 days ago, is mildly itchy, located on inner forearm..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero image retention on servers.</span>
            </div>

            <button
              type="submit"
              disabled={loading || !imageFile}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Inspecting Features...</span>
                </>
              ) : (
                <>
                  <ScanEye className="w-4 h-4" />
                  <span>Inspect Medical Image</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Visual Inspection Summary
              </h2>
              <RiskBadge level={result.riskLevel} />
            </div>
            <span className="text-xs font-mono text-slate-400">
              {result.provider || selectedProvider}
            </span>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Objective Visual Observations
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {result.visualObservations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinical Considerations */}
          {result.potentialConsiderations && result.potentialConsiderations.length > 0 && (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Educational Considerations
              </h3>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                {result.potentialConsiderations.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions for doctor */}
          {result.questionsForDoctor && result.questionsForDoctor.length > 0 && (
            <div className="space-y-2 bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" />
                Questions for In-Person Dermatologist / Physician
              </h3>
              <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                {result.questionsForDoctor.map((q, idx) => (
                  <li key={idx}>• {q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 italic">
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
