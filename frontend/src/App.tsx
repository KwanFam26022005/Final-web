export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-800 antialiased dark:bg-slate-900 dark:text-slate-100">
      <main className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Collaborative Intelligent Note Management
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Frontend foundation ready. Decoupled React SPA initialized with TypeScript, Vite, and Tailwind CSS.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>React + TypeScript + Vite + Tailwind CSS active</span>
        </div>
      </main>
    </div>
  )
}
