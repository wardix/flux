import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="relative z-10 max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Phase 1: Foundation (Project Setup)
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent pb-2">
            ⚡ Flux
          </h1>
          <p className="text-xl text-slate-400 max-w-xl mx-auto font-light leading-relaxed">
            Modern Project Management & Kanban Board. Built with Bun, React, Hono, and PostgreSQL.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 text-white"
          >
            Clicked {count} times
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 font-semibold transition-colors text-slate-300"
          >
            Documentation
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-12 border-t border-slate-900">
          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm space-y-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
              ⚡
            </div>
            <h3 className="font-semibold text-slate-200">Tech Stack Ready</h3>
            <p className="text-sm text-slate-400 leading-relaxed">React 19, Vite, TailwindCSS, and DaisyUI configured for rapid frontend construction.</p>
          </div>
          
          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm space-y-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
              🔥
            </div>
            <h3 className="font-semibold text-slate-200">Backend Connected</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Hono Framework running on Bun runtime for high-performance API routing.</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm space-y-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 font-bold">
              ✨
            </div>
            <h3 className="font-semibold text-slate-200">Monorepo Setup</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Clean code directories and linter/formatter integration with Biome.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
