import React from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  ServerOff,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';

export const Privacy: React.FC = () => {
  const securityPillars = [
    {
      icon: ServerOff,
      title: 'Zero Persistent File Storage',
      description:
        'Uploaded medical reports, lab PDFs, and images are held temporarily in ephemeral RAM strictly during processing and discarded immediately after AI extraction.',
    },
    {
      icon: EyeOff,
      title: 'No Sensitive Health Logging',
      description:
        'Our server telemetry and logging frameworks do not record patient conversation transcripts, medical records, or uploaded diagnostic images.',
    },
    {
      icon: Lock,
      title: 'Transport Encryption & Security',
      description:
        'All client-to-server data is encrypted in transit using industry-standard TLS 1.3 encryption protocols to safeguard against interception.',
    },
    {
      icon: ShieldCheck,
      title: 'Client-Side Minimization',
      description:
        'We encourage users to redact personal identifiers (e.g. Social Security Numbers, exact home addresses) before uploading diagnostic files.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-3 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Patient Privacy & Healthcare Ethics Commitment</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy & Data Protection Principles
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          MediGuide AI is architected from the ground up to uphold the highest standards of data minimization, transparency, and clinical responsibility.
        </p>
      </div>

      {/* Security Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-medical-50 dark:bg-medical-950 text-medical-600 dark:text-medical-400 flex items-center justify-center border border-medical-200 dark:border-medical-800">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Key Guidelines for Users */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Patient Best Practices for Safe Platform Usage
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-semibold">
              1. Redact Sensitive Identifiers
            </strong>
            <p>
              When uploading medical reports or laboratory slips, consider obscuring your full government ID, date of birth, and home address. The AI only needs clinical test names and numerical values to explain results.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-semibold">
              2. Understanding Potential AI Errors & Hallucinations
            </strong>
            <p>
              Large Language Models and Vision Systems can occasionally misinterpret handwritten notes or ambiguous laboratory formatting. Always cross-verify critical biomarker thresholds with your physician or official laboratory documentation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-semibold">
              3. Non-Replacement of Clinical Care
            </strong>
            <p>
              No artificial intelligence system can replicate the comprehensive diagnostic capabilities of an in-person physical examination, auscultation, palpation, and clinical doctor-patient dialogue.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency & Helpline Assurance */}
      <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 sm:p-8 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-300" />
          <span>Emergency Health Inquiries</span>
        </div>
        <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
          If you are experiencing life-threatening medical emergencies, acute chest distress, loss of consciousness, or mental health crises, bypass all digital AI tools and dial your national emergency number (<strong>911 / 112 / 108 / 988</strong>) immediately.
        </p>
      </div>
    </div>
  );
};
