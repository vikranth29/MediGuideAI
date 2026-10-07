import React from 'react';
import { AlertOctagon, PhoneCall, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmergencyBannerProps {
  message?: string;
  onDismiss?: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  message = 'If you or someone near you is experiencing severe chest pain, sudden difficulty breathing, slurred speech, or heavy bleeding, seek emergency medical care immediately.',
  onDismiss,
}) => {
  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg border-b border-red-500">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shrink-0 animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </span>
          <p className="leading-snug">
            <strong className="font-bold mr-1.5">EMERGENCY PROTOCOL:</strong>
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="tel:911"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-red-700 hover:bg-red-50 font-bold text-xs shadow transition-all duration-150"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Call Emergency (911 / 112)
          </a>
          <Link
            to="/hospitals"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-800/60 hover:bg-red-800 text-white font-medium text-xs border border-red-400/40 transition-all duration-150"
          >
            Nearest ER
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-2 text-white/80 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
