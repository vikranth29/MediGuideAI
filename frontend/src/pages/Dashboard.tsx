import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquareHeart,
  FileText,
  ScanEye,
  MapPin,
  ShieldCheck,
  Flame,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Activity,
  AlertOctagon,
  HelpCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [quickSymptom, setQuickSymptom] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSymptom.trim()) {
      navigate(`/chat?q=${encodeURIComponent(quickSymptom.trim())}`);
    }
  };

  const featureCards = [
    {
      title: 'AI Health Assistant',
      description: 'Conversational medical information with structured clinical context, possible explanations, and self-care advice.',
      icon: MessageSquareHeart,
      path: '/chat',
      color: 'from-blue-500 to-cyan-500',
      badge: 'Interactive AI',
    },
    {
      title: 'Medical Report Analysis',
      description: 'Upload lab reports, blood panels, or clinical PDFs to translate complex metrics into patient-friendly explanations.',
      icon: FileText,
      path: '/reports',
      color: 'from-teal-500 to-emerald-500',
      badge: 'Multi-Format OCR',
    },
    {
      title: 'Medical Image Inspection',
      description: 'Non-diagnostic visual analysis of skin observations, lesions, and general educational healthcare images.',
      icon: ScanEye,
      path: '/image-analysis',
      color: 'from-indigo-500 to-purple-500',
      badge: 'Vision AI',
    },
    {
      title: 'Nearby Hospitals & ER',
      description: 'Instant geolocation lookup for 24/7 trauma centers, hospitals, clinics, and pharmacies with live directions.',
      icon: MapPin,
      path: '/hospitals',
      color: 'from-rose-500 to-pink-500',
      badge: 'Live Geolocation',
    },
    {
      title: 'Emergency Red-Flag Guard',
      description: 'Automated safety interceptor detecting acute symptoms (chest pain, stroke signs, breathing distress) in real-time.',
      icon: Flame,
      path: '/chat',
      color: 'from-amber-500 to-red-500',
      badge: 'Zero Delay',
    },
    {
      title: 'Privacy & Zero-Retention',
      description: 'Client-validated medical data processing with zero permanent storage of your uploaded health documents.',
      icon: ShieldCheck,
      path: '/privacy',
      color: 'from-emerald-500 to-teal-600',
      badge: 'HIPAA Mindful',
    },
  ];

  const suggestedQuestions = [
    'What are common early signs of type 2 diabetes?',
    'How do I interpret a normal blood pressure reading?',
    'What should I do for a child with a mild fever?',
    'What are common triggers for tension headaches?',
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-medical-400/20 to-teal-300/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-50 dark:bg-medical-950/80 border border-medical-200 dark:border-medical-800 text-medical-800 dark:text-medical-300 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-medical-600 dark:text-medical-400" />
            <span>Next-Generation Responsible Medical Intelligence</span>
          </div>

          {/* Main Title & Subtitle */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Your AI-Powered <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-medical-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                Medical Information
              </span>{' '}
              Assistant
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Get understandable health information, explore medical reports, and identify when professional clinical help is needed with safety-guaranteed AI.
            </p>
          </div>

          {/* Quick Symptom Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form
              onSubmit={handleQuickSubmit}
              className="relative flex items-center shadow-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 focus-within:ring-2 focus-within:ring-medical-500 transition-all"
            >
              <div className="pl-3.5 text-slate-400">
                <HeartPulse className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={quickSymptom}
                onChange={(e) => setQuickSymptom(e.target.value)}
                placeholder="Ask about a symptom or health topic (e.g. migraine, cholesterol, fever)..."
                className="w-full px-3 py-2.5 text-sm sm:text-base bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-medium text-sm flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Popular:
              </span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/chat?q=${encodeURIComponent(q)}`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-medical-50 hover:text-medical-700 dark:hover:bg-medical-950 dark:hover:text-medical-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-medical-600 to-teal-600 hover:from-medical-700 hover:to-teal-700 text-white font-semibold text-base shadow-md shadow-medical-600/20 hover:shadow-lg transition-all active:scale-95"
            >
              <MessageSquareHeart className="w-5 h-5" />
              <span>Start Medical Chat</span>
            </Link>

            <Link
              to="/reports"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-base border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
            >
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Analyze Medical Report</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Safety Highlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/40 dark:border-amber-700/40 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Responsible AI & Patient Safety Principles
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                MediGuide AI operates under strict clinical safety rules. The AI never claims to be a doctor, never makes definitive diagnoses, never prescribes medication dosages, and immediately intercepts acute red-flag symptoms.
              </p>
            </div>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
          >
            <span>Safety Architecture</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Comprehensive Clinical Intelligence Modules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Engineered with deep healthcare domain knowledge and uncertainty-aware logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.path}
                className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md hover:border-medical-300 dark:hover:border-medical-700 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {card.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-medical-600 dark:group-hover:text-medical-400 transition-colors flex items-center justify-between">
                      <span>{card.title}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-medical-600 dark:text-medical-400" />
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center text-xs font-semibold text-medical-600 dark:text-medical-400">
                  <span>Explore module &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Clinical Flow Diagram Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 overflow-hidden relative shadow-xl">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-500/20 text-medical-300 border border-medical-500/30 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>Multi-Layer Safety Engine</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Safety First in Every Medical Interaction
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Every query passes through an emergency pre-flight analyzer. If critical symptoms are detected, conversational AI is bypassed to provide immediate urgent directives and helpline contacts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-medical-400 font-bold text-lg mb-1">01. Intercept</div>
                <p className="text-xs text-slate-400">Instant red-flag keyword & symptom triage before model invocation.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-teal-400 font-bold text-lg mb-1">02. Guardrails</div>
                <p className="text-xs text-slate-400">Clinical uncertainty phrasing with strict no-dosage constraints.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-cyan-400 font-bold text-lg mb-1">03. Verify</div>
                <p className="text-xs text-slate-400">Post-processing schema enforcement & disclaimer injection.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
