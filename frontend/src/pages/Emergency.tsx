import { AlertTriangle, Hospital, PhoneCall, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Emergency() {
  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 dark:bg-red-950/50 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            Urgent Assistance
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Emergency Contacts
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Immediate access to national emergency services, ambulance dispatch, and crisis lines.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900 dark:bg-slate-900">
            <PhoneCall className="mx-auto h-10 w-10 text-red-600 dark:text-red-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Ambulance Dispatch</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">24/7 Medical Emergency Response</p>
            <a
              href="tel:911"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
            >
              <PhoneCall className="h-4 w-4" />
              Call 911 / 112
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Poison Control Center</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Toxic Exposure &amp; Chemical Guidance</p>
            <a
              href="tel:18002221222"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-500 px-5 py-3 text-sm font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              <PhoneCall className="h-4 w-4" />
              Call Poison Control
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-medical-600 dark:text-medical-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Important Emergency Reminder</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                If you or someone around you is experiencing life-threatening symptoms (chest pain, severe shortness of breath, sudden numbness or severe trauma), call your local emergency phone number immediately. Do not rely solely on online tools during critical emergencies.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link
            to="/hospitals"
            className="inline-flex items-center gap-2 rounded-lg border border-medical-200 px-4 py-2.5 text-sm font-semibold text-medical-700 hover:bg-medical-50 dark:border-medical-800 dark:text-medical-300 dark:hover:bg-medical-950/40"
          >
            <Hospital className="h-4 w-4" />
            Find Nearby Emergency Care
          </Link>
        </div>
      </div>
    </div>
  );
}
