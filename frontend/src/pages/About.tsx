import React from 'react';
import {
  HeartPulse,
  Cpu,
  Layers,
  Stethoscope,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Title */}
      <div className="space-y-3 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-medical-50 dark:bg-medical-950/80 border border-medical-200 dark:border-medical-800 text-medical-800 dark:text-medical-300 text-xs font-semibold">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Mission & Technology Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          About MediGuide AI
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Bridging the gap between complex clinical data and patient understanding through responsible, safety-first artificial intelligence.
        </p>
      </div>

      {/* Mission & Vision Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-medical-600" />
          Our Clinical Purpose
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Medical records, laboratory panels, and health questions can be intimidating and filled with opaque medical jargon. MediGuide AI empowers individuals and families with understandable educational explanations, prepares them with informed questions for doctor visits, and immediately triggers emergency protocols when high-risk symptoms appear.
        </p>
      </div>

      {/* Multi-Model Abstraction Layer */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-600" />
            AI Provider Abstraction Layer
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            MediGuide AI is provider-agnostic and supports zero-downtime dynamic switching.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Google Gemini', desc: 'Optimized for multimodal report and image reasoning.', tag: 'Primary Provider' },
            { name: 'OpenAI GPT-4o', desc: 'High-precision structured clinical logic.', tag: 'Supported' },
            { name: 'Anthropic Claude', desc: 'Exceptional safety and conversational nuance.', tag: 'Supported' },
            { name: 'Groq LPU', desc: 'Ultra-low latency real-time inference.', tag: 'Supported' },
          ].map((prov, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{prov.name}</span>
              </div>
              <span className="inline-block text-[10px] uppercase font-mono font-bold text-medical-600 dark:text-medical-400 bg-medical-50 dark:bg-medical-950 px-2 py-0.5 rounded">
                {prov.tag}
              </span>
              <p className="text-[11px] text-slate-500 leading-normal">{prov.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Architecture Stack */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Technical Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <strong className="text-slate-900 dark:text-white block font-semibold">Frontend</strong>
            <p>React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <strong className="text-slate-900 dark:text-white block font-semibold">Backend</strong>
            <p>Node.js, Express, TypeScript, Multer, PDF-Parse, Axios, OpenStreetMap Overpass API.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
