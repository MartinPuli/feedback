'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type DemoSignal = {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
};

const typeIcon: Record<string, string> = {
  rage_click: '😤',
  js_error: '💥',
  form_abandon: '🚪',
  slow_page: '🐌',
  u_turn: '↩️',
  dead_click: '🖱️',
  micro_survey: '💬',
};

const typeLabel: Record<string, string> = {
  rage_click: 'Rage Click',
  js_error: 'JS Error',
  form_abandon: 'Form Abandon',
  slow_page: 'Slow Page',
  u_turn: 'U-Turn',
  dead_click: 'Dead Click',
  micro_survey: 'Micro Survey',
};

const severityColor: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-cyan-500',
};

export default function DemoPage() {
  const [events, setEvents] = useState<DemoSignal[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [errorTriggered, setErrorTriggered] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/feedback.js';
    script.async = true;
    script.dataset.survey = 'true';
    script.dataset.question = '¿Qué te costó de esta página?';
    script.dataset.options = 'Precios,Funcionalidad,Diseño,No encontré algo,Otro';
    document.head.appendChild(script);

    const interval = setInterval(() => {
      fetch('/api/feedback')
        .then((r) => r.json())
        .then((data) => {
          const signals = (data.signals || []).slice(0, 8).map((s: { type: string; severity: string; message: string; timestamp: string }) => ({
            type: s.type,
            severity: s.severity,
            message: s.message,
            timestamp: s.timestamp,
          }));
          setEvents(signals);
        });
    }, 2000);

    return () => {
      clearInterval(interval);
      script.remove();
    };
  }, []);

  function triggerError() {
    setErrorTriggered(true);
    setTimeout(() => setErrorTriggered(false), 2000);
    const obj = undefined;
    // @ts-expect-error test error
    console.log(obj.id);
  }

  function handleRageClick() {
    setClickCount((c) => c + 1);
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0f] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Navbar */}
      <nav className="glass border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-float inline-block">🔄</span>
            <span className="font-bold text-lg gradient-text">FeedbackLoop</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              DEMO
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/demo" className="text-indigo-600 dark:text-indigo-400 relative">
              Demo
              <span className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            </Link>
            <a href="/presentation.html" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline">
              Presentación
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 text-white animate-gradient">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)'
        }} />
        <div className="relative max-w-5xl mx-auto px-6 py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SDK activo — capturando señales
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Probá el SDK en vivo
          </h1>
          <p className="mt-3 text-orange-50 max-w-2xl text-lg">
            Interactuá con los elementos de abajo. Cada acción genera una señal real que podés ver en el dashboard.
          </p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Rage Click */}
            <div className="group bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  😤
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">PASO 1</span>
                    <h2 className="text-lg font-bold">Rage Click</h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Hacé 3+ clicks rápidos en el botón. El SDK detecta la frustración y envía una señal automáticamente.
                  </p>
                  <button
                    onClick={handleRageClick}
                    className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-xl font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    Descargar reporte
                  </button>
                  {clickCount > 0 && (
                    <span className="ml-3 text-xs text-amber-600 dark:text-amber-400 font-medium animate-fade-in">
                      {clickCount} click{clickCount !== 1 ? 's' : ''} {clickCount >= 3 ? '🔥 ¡Rage click detectado!' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dead Click */}
            <div className="group bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up stagger-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  🖱️
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">PASO 2</span>
                    <h2 className="text-lg font-bold">Dead Click</h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Hacé click en esta zona. No es un botón ni un link — el SDK detecta el click muerto.
                  </p>
                  <div className="h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 cursor-default hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors">
                    Click acá — no pasa nada
                  </div>
                </div>
              </div>
            </div>

            {/* JS Error */}
            <div className="group bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up stagger-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  💥
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">PASO 3</span>
                    <h2 className="text-lg font-bold">Error JS</h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Dispará un error JavaScript real. El SDK lo captura y lo envía como señal crítica.
                  </p>
                  <button
                    onClick={triggerError}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      errorTriggered
                        ? 'bg-red-500 text-white scale-95'
                        : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                    }`}
                  >
                    {errorTriggered ? '💥 ¡Error capturado!' : 'Disparar error'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Abandon */}
            <div className="group bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up stagger-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  🚪
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">PASO 4</span>
                    <h2 className="text-lg font-bold">Abandono de formulario</h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Empezá a llenar el formulario pero no lo envíes. Al salir de la página, el SDK detecta el abandono.
                  </p>
                  <form className="space-y-3" onFocus={() => setFormStarted(true)}>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <input
                      type="tel"
                      placeholder="+54 11 1234-5678"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-500">No envíes el formulario — salí de la página.</p>
                      {formStarted && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-fade-in">
                          ⏳ Formulario iniciado
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Live Signal Feed */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-zinc-900 dark:bg-zinc-900/80 rounded-2xl border border-zinc-800 p-5 shadow-lg animate-fade-in-up stagger-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
                  Señales en vivo
                </h2>
                <span className="text-[10px] text-zinc-400 font-mono">{events.length}</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-auto">
                {events.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    <span className="text-2xl block mb-2">📡</span>
                    Esperando interacciones...
                  </div>
                )}
                {events.map((e, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 animate-slide-in-right"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{typeIcon[e.type] || '🔔'}</span>
                      <span className="text-xs font-semibold text-zinc-200">{typeLabel[e.type] || e.type}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase border ${severityColor[e.severity]}`}>
                        {e.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2">{e.message}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${severityDot[e.severity]}`} />
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {new Date(e.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/"
                className="mt-4 block text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20"
              >
                Ver todas en el dashboard →
              </Link>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">💡</span>
            <div>
              <h3 className="font-bold mb-1">¿Cómo funciona?</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                El SDK (<code className="text-xs px-1.5 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800 font-mono">feedback.js</code>) está cargado en esta página.
                Detecta automáticamente rage clicks, dead clicks, errores JS, abandono de formularios, U-turns y páginas lentas.
                También dispara micro-encuestas inteligentes según el comportamiento del usuario. Todo se envía a la API y aparece en el dashboard en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
