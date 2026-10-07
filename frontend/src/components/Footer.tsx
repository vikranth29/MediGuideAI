import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, Lock, Heart, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 transition-colors">
      {/* Safety Mandatory Disclaimer Box */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-amber-400 font-semibold shrink-0">
            <ShieldAlert className="w-4 h-4" />
            <span>MANDATORY MEDICAL DISCLAIMER:</span>
          </div>
          <p className="leading-relaxed text-center md:text-left">
            MediGuide AI provides educational and informational support only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns. Never disregard professional clinical advice or delay seeking it because of something you read on this platform.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Col */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-medical-500 flex items-center justify-center text-white">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              MediGuide AI
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pioneering responsible healthcare AI with multi-layer clinical safety guardrails, uncertainty detection, and patient-first privacy.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero Persistent File Retention</span>
          </div>
        </div>

        {/* Core Modules */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
            Core Modules
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/chat" className="hover:text-medical-400 transition-colors">
                AI Health Assistant
              </Link>
            </li>
            <li>
              <Link to="/reports" className="hover:text-medical-400 transition-colors">
                Medical Report Analysis
              </Link>
            </li>
            <li>
              <Link to="/image-analysis" className="hover:text-medical-400 transition-colors">
                Medical Image Inspection
              </Link>
            </li>
            <li>
              <Link to="/hospitals" className="hover:text-medical-400 transition-colors">
                Nearby Hospitals & ER
              </Link>
            </li>
          </ul>
        </div>

        {/* Safety & Compliance */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-3">
            Safety & Legal
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/privacy" className="hover:text-medical-400 transition-colors">
                Privacy & Data Security
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-medical-400 transition-colors">
                Clinical Safety Architecture
              </Link>
            </li>
            <li>
              <Link to="/about#limitations" className="hover:text-medical-400 transition-colors">
                System Limitations & Bias
              </Link>
            </li>
            <li>
              <Link to="/about#providers" className="hover:text-medical-400 transition-colors">
                AI Provider Transparency
              </Link>
            </li>
          </ul>
        </div>

        {/* Emergency Contacts */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-3">
            <Phone className="w-3.5 h-3.5" />
            Emergency Helplines
          </h4>
          <div className="space-y-2 text-xs text-slate-300">
            <p className="flex justify-between border-b border-slate-800 pb-1">
              <span>United States / Canada</span>
              <strong className="text-white font-mono">911 / 988</strong>
            </p>
            <p className="flex justify-between border-b border-slate-800 pb-1">
              <span>India Emergency & ER</span>
              <strong className="text-white font-mono">112 / 108</strong>
            </p>
            <p className="flex justify-between border-b border-slate-800 pb-1">
              <span>United Kingdom (NHS)</span>
              <strong className="text-white font-mono">999 / 111</strong>
            </p>
            <p className="flex justify-between">
              <span>European Union</span>
              <strong className="text-white font-mono">112</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto">
        <p>© {new Date().getFullYear()} MediGuide AI. Dedicated to responsible digital healthcare.</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0">
          Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" /> for patient safety
        </p>
      </div>
    </footer>
  );
};
