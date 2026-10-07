import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Trash2,
  Copy,
  Check,
  Flame,
  Volume2,
  VolumeX,
  Stethoscope,
  Info,
  RefreshCw,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, ChatResponse } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

const SAMPLE_QUESTIONS = [
  { label: 'Chest Tightness', text: 'I feel a tightness in my chest when I climb stairs.' },
  { label: 'High Blood Pressure', text: 'What lifestyle modifications help lower mild hypertension?' },
  { label: 'Childhood Fever', text: 'What is the recommended supportive care for a toddler with a 101°F fever?' },
  { label: 'Migraine Relief', text: 'What are non-pharmacological ways to ease acute migraine pain?' },
  { label: 'Diabetes Screening', text: 'What fasting blood sugar levels suggest prediabetes?' },
];

export const Chat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('gemini');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mediguide_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          'Hello! I am MediGuide AI, your medical information assistant. Ask me health-related questions, symptom explanations, or preventive health guidance.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredResponse: {
          summary: 'Welcome to MediGuide AI. Ask any health or symptom inquiry below for educational guidance.',
          possibleExplanations: [
            'Explore causes of symptoms or medical terminology.',
            'Discover non-prescriptive supportive care practices.',
          ],
          importantInformation: [
            'All responses are educational and not a substitute for professional clinical diagnosis.',
            'In case of emergency symptoms (e.g. chest pain, breathing distress, stroke signs), call emergency services immediately.',
          ],
          whenToSeeDoctor: [
            'Consult your physician whenever symptoms persist, cause distress, or before modifying prescriptions.',
          ],
          disclaimer:
            'MediGuide AI provides educational and informational support only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.',
          riskLevel: 'LOW',
          isEmergency: false,
          provider: 'MediGuide System',
        },
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('mediguide_chat_history', JSON.stringify(messages));
  }, [messages, loading]);

  // Handle URL parameter for query if coming from Dashboard
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [searchParams]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res: ChatResponse = await api.sendChatMessage(query.trim(), history, selectedProvider);

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredResponse: res,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Unable to connect to the medical assistant service. Please check your network or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredResponse: {
          summary: err.message || 'Service temporarily unavailable.',
          possibleExplanations: ['A temporary network issue or provider configuration error occurred.'],
          importantInformation: ['Please retry shortly.'],
          whenToSeeDoctor: ['For urgent concerns, do not rely on digital tools — contact emergency care.'],
          disclaimer:
            'MediGuide AI provides educational and informational support only. It is not a substitute for professional medical advice.',
          riskLevel: 'LOW',
          isEmergency: false,
          provider: 'Error Handler',
        },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all conversation history?')) {
      const welcome: ChatMessage = {
        id: 'msg-welcome',
        role: 'assistant',
        content: 'Conversation history cleared. How can I assist you with your health questions today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);
      localStorage.removeItem('mediguide_chat_history');
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSpeech = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking === id) {
        window.speechSynthesis.cancel();
        setIsSpeaking(null);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(null);
        utterance.onerror = () => setIsSpeaking(null);
        setIsSpeaking(id);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              AI Medical Chat Assistant
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
              Clinical Guardrails Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Structured educational health insights with automatic red-flag triage.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Provider selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold hidden md:inline">Model:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-medical-500 font-medium"
            >
              <option value="gemini">Google Gemini (Recommended)</option>
              <option value="openai">OpenAI GPT-4o</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="groq">Groq (Llama 3.3 Fast)</option>
              <option value="fallback">Built-in Knowledge Engine</option>
            </select>
          </div>

          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="min-h-[480px] max-h-[600px] overflow-y-auto space-y-6 pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const structured = msg.structuredResponse;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                <span>{isUser ? 'You' : 'MediGuide Assistant'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {structured?.provider && (
                  <>
                    <span>•</span>
                    <span className="text-medical-600 dark:text-medical-400 font-mono text-[10px]">
                      {structured.provider}
                    </span>
                  </>
                )}
              </div>

              {/* User Bubble */}
              {isUser ? (
                <div className="max-w-xl rounded-2xl rounded-tr-sm bg-medical-600 text-white px-4 py-3 text-sm shadow-sm">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                /* Assistant Structured Bubble */
                <div className="max-w-3xl w-full rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
                  {/* Emergency Alert Header Card if Emergency */}
                  {structured?.isEmergency && (
                    <div className="rounded-xl bg-red-600 text-white p-4 shadow-lg border border-red-700 animate-pulse space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Flame className="w-5 h-5 text-amber-300" />
                        <span>EMERGENCY SAFETY INTERCEPTION</span>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed">
                        {structured.emergencyWarning ||
                          '⚠️ EMERGENCY WARNING: Your symptoms may require urgent medical attention. Please contact your local emergency services (911 / 112 / 108) or visit the nearest emergency department immediately.'}
                      </p>
                    </div>
                  )}

                  {/* Risk Level Badge & Actions */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <RiskBadge level={structured?.riskLevel || 'LOW'} />

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          toggleSpeech(
                            msg.id,
                            `${structured?.summary}. ${structured?.possibleExplanations.join('. ')}`
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Read aloud"
                      >
                        {isSpeaking === msg.id ? (
                          <VolumeX className="w-4 h-4 text-medical-600" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(msg.id, structured ? JSON.stringify(structured, null, 2) : msg.content)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Copy structured response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Summary
                    </h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {structured?.summary || msg.content}
                    </p>
                  </div>

                  {/* Possible Explanations */}
                  {structured?.possibleExplanations && structured.possibleExplanations.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-medical-600 dark:text-medical-400" />
                        Possible Considerations (Educational)
                      </h4>
                      <ul className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc list-inside leading-relaxed">
                        {structured.possibleExplanations.map((exp, i) => (
                          <li key={i}>{exp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Important Health Information / Supportive Care */}
                  {structured?.importantInformation && structured.importantInformation.length > 0 && (
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Important Health Information
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside leading-relaxed">
                        {structured.importantInformation.map((info, i) => (
                          <li key={i}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* When to See a Doctor */}
                  {structured?.whenToSeeDoctor && structured.whenToSeeDoctor.length > 0 && (
                    <div className="space-y-1.5 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        When to Consult a Physician
                      </h4>
                      <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200 list-disc list-inside leading-relaxed">
                        {structured.whenToSeeDoctor.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Mandatory Bottom Disclaimer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 italic leading-snug">
                    {structured?.disclaimer ||
                      'MediGuide AI provides educational and informational support only. It is not a substitute for professional medical advice.'}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col items-start space-y-2">
            <div className="text-[11px] text-slate-400 px-1">MediGuide Assistant is analyzing...</div>
            <div className="w-full max-w-xl rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Question Chips */}
      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-medical-600" />
          Suggested Clinical Topics:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((item, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSend(item.text)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-medical-50 dark:hover:bg-medical-950 hover:text-medical-700 dark:hover:text-medical-300 border border-slate-200 dark:border-slate-700 transition-colors text-left"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your health question, symptoms, or medication query..."
          disabled={loading}
          className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2 px-4 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
