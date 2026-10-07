import { Clock3, Github, Mail } from 'lucide-react';

export function Contact() {
  return (
    <div className="min-h-full bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-medical-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-medical-700 dark:bg-medical-950/50 dark:text-medical-300">
            <Mail className="h-4 w-4" />
            Get in Touch
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Contact MediGuide AI
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Have questions, feedback, or want to collaborate? Use the available project contact channels below.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <a
            href="mailto:mediguideai@project.dev"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-medical-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-medical-700"
          >
            <Mail className="h-8 w-8 text-medical-600 dark:text-medical-400" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Email</h2>
            <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
              mediguideai@project.dev
            </p>
          </a>

          <a
            href="https://github.com/mediguide-ai"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-medical-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-medical-700"
          >
            <Github className="h-8 w-8 text-slate-700 dark:text-slate-200" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">GitHub</h2>
            <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
              github.com/mediguide-ai
            </p>
          </a>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Clock3 className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Response Time</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Within 24–48 hours</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            This is a <strong className="font-semibold text-slate-900 dark:text-white">final-year academic project</strong>.
            MediGuide AI is not a registered medical service.
          </p>
        </section>
      </div>
    </div>
  );
}
