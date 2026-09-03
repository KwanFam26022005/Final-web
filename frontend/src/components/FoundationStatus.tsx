import { useEffect, useState } from 'react';
import { getBackendHealth, getDatabaseHealth } from '../lib/api/health';

type ServiceStatus = 'checking' | 'connected' | 'unavailable';

export function FoundationStatus() {
  const [backendStatus, setBackendStatus] = useState<ServiceStatus>('checking');
  const [databaseStatus, setDatabaseStatus] = useState<ServiceStatus>('checking');

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const backend = await getBackendHealth();
        if (isMounted) {
          setBackendStatus(backend.status === 'ok' ? 'connected' : 'unavailable');
        }
      } catch {
        if (isMounted) {
          setBackendStatus('unavailable');
        }
      }

      try {
        const database = await getDatabaseHealth();
        if (isMounted) {
          setDatabaseStatus(database.status === 'ok' ? 'connected' : 'unavailable');
        }
      } catch {
        if (isMounted) {
          setDatabaseStatus('unavailable');
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status: ServiceStatus, label: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {label}
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Unavailable
          </span>
        );
      case 'checking':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Checking...
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-800 antialiased dark:bg-slate-900 dark:text-slate-100">
      <main className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Collaborative Intelligent Note Management
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Full-stack foundation integration view. Decoupled React SPA connected to Laravel REST API and MySQL database.
        </p>

        <section className="mt-6 rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Infrastructure Connectivity
          </h2>
          <dl className="mt-3 divide-y divide-slate-200 dark:divide-slate-700 text-sm">
            <div className="flex items-center justify-between py-2">
              <dt className="text-slate-600 dark:text-slate-300">Frontend SPA</dt>
              <dd className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Ready
              </dd>
            </div>
            <div data-testid="backend-status-row" className="flex items-center justify-between py-2">
              <dt className="text-slate-600 dark:text-slate-300">Backend API</dt>
              <dd>{getStatusBadge(backendStatus, 'Connected')}</dd>
            </div>
            <div data-testid="database-status-row" className="flex items-center justify-between py-2">
              <dt className="text-slate-600 dark:text-slate-300">MySQL Database</dt>
              <dd>{getStatusBadge(databaseStatus, 'Connected')}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Phase 1 — M5 Full-stack Integration Foundation
        </footer>
      </main>
    </div>
  );
}
