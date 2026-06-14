import { useState } from 'react'
import { useTheme } from './hooks/useTheme'

function App() {
  const [count, setCount] = useState(0)
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()

  const accents = [
    { name: 'indigo', label: 'Indigo', color: 'bg-indigo-600' },
    { name: 'blue', label: 'Blue', color: 'bg-blue-600' },
    { name: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
    { name: 'rose', label: 'Rose', color: 'bg-rose-600' },
    { name: 'amber', label: 'Amber', color: 'bg-amber-600' },
    { name: 'violet', label: 'Violet', color: 'bg-violet-600' },
  ]

  return (
    <div className="min-h-screen bg-base-300 text-base-content flex flex-col selection:bg-primary selection:text-primary-content transition-colors duration-300">
      <header className="navbar bg-base-100 shadow-md px-6 z-10">
        <div className="flex-1">
          <span className="text-2xl font-bold tracking-wider text-primary">⚡ Flux</span>
        </div>
        <div className="flex-none gap-4">
          <div className="dropdown dropdown-end">
            <button type="button" tabIndex={0} className="btn btn-outline btn-primary capitalize">
              🎨 Theme: {theme}
            </button>
            <ul className="dropdown-content menu bg-base-200 rounded-box z-[1] w-40 p-2 shadow-lg gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'active font-bold' : ''}
                >
                  ☀️ Light
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'active font-bold' : ''}
                >
                  🌙 Dark
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={theme === 'system' ? 'active font-bold' : ''}
                >
                  💻 System
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Phase 1: Foundation (Dark Mode & Theming)
            </div>
            <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent pb-2">
              Welcome to Flux
            </h1>
            <p className="text-xl text-base-content/75 max-w-xl mx-auto font-light leading-relaxed">
              Experience the sleek, dynamic interface of Flux. Switch themes and accent colors on
              the fly!
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 py-6 px-8 rounded-2xl bg-base-100 shadow-xl border border-base-200/50 max-w-md mx-auto">
            <h3 className="font-semibold text-lg text-base-content">Select Accent Color</h3>
            <div className="flex gap-3">
              {accents.map((acc) => (
                <button
                  key={acc.name}
                  type="button"
                  onClick={() => setAccentColor(acc.name)}
                  className={`w-8 h-8 rounded-full ${acc.color} transition-all duration-200 hover:scale-110 active:scale-95 ${
                    accentColor === acc.name ? 'ring-4 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  aria-label={`Set accent to ${acc.label}`}
                  title={acc.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setCount((c) => c + 1)}
              className="btn btn-primary px-8 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-white font-semibold"
            >
              Clicked {count} times
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-secondary"
            >
              Documentation
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-12 border-t border-base-200/50">
            <div className="p-6 rounded-2xl bg-base-100 shadow-md space-y-2 text-left border border-base-200/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                🌙
              </div>
              <h3 className="font-semibold text-base-content">Theme Syncing</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">
                Seamless light, dark, and system preference transitions instantly saved to storage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-base-100 shadow-md space-y-2 text-left border border-base-200/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                🎨
              </div>
              <h3 className="font-semibold text-base-content">Custom Accent</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">
                Choose custom palettes that dynamically inject primary styles through CSS variables.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-base-100 shadow-md space-y-2 text-left border border-base-200/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                ✨
              </div>
              <h3 className="font-semibold text-base-content">System Aware</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">
                Respects your operating system's color preferences automatically.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
