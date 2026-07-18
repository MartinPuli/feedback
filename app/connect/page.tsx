'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Connector = {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'demo' | 'soon' | 'config_missing';
  description: string;
};

type Signal = {
  id: string;
  type: string;
  severity: string;
  page: string;
  message: string;
  timestamp: string;
  source: string;
  site?: string;
};

const connectorEnvVars: Record<string, string[]> = {
  posthog: ['POSTHOG_API_KEY', 'POSTHOG_PROJECT_ID'],
  sentry: ['SENTRY_AUTH_TOKEN', 'SENTRY_ISSUES_URL'],
  googleanalytics: ['GA4_ACCESS_TOKEN', 'GA4_PROPERTY_ID'],
  mixpanel: ['MIXPANEL_API_SECRET'],
  amplitude: ['AMPLITUDE_API_KEY', 'AMPLITUDE_SECRET_KEY'],
  intercom: ['INTERCOM_ACCESS_TOKEN'],
  crisp: ['CRISP_TOKEN_ID', 'CRISP_TOKEN_KEY', 'CRISP_WEBSITE_ID'],
};

export default function ConnectPage() {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [externalSignals, setExternalSignals] = useState<Signal[]>([]);
  const [sites, setSites] = useState<{ site: string; count: number }[]>([]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOrigin(window.location.origin));
    fetch('/api/connectors')
      .then((r) => r.json())
      .then((data) => setConnectors(data.connectors || []))
      .catch(() => {});
    return () => cancelAnimationFrame(id);
  }, []);

  const refresh = useCallback(() => {
    fetch('/api/feedback')
      .then((r) => r.json())
      .then((data) => {
        const all: Signal[] = data.signals || [];
        const own = window.location.hostname;
        const external = all.filter((s) => s.site && s.site !== own);
        setExternalSignals(external.slice(0, 8));
        const counts = new Map<string, number>();
        external.forEach((s) => counts.set(s.site!, (counts.get(s.site!) || 0) + 1));
        setSites([...counts.entries()].map(([site, count]) => ({ site, count })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const snippet = `<script src="${origin || 'https://TU-FEEDBACKLOOP.vercel.app'}/feedback.js" async data-survey="true"></script>`;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard no disponible
    }
  }

  const realConnectors = connectors.filter((c) => c.id !== 'sdk' && c.id !== 'extension' && c.status !== 'soon');

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0f] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Navbar */}
      <nav className="glass border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-float inline-block">🔄</span>
            <span className="font-bold text-lg gradient-text">FeedbackLoop</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/demo" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Demo
            </Link>
            <Link href="/connect" className="text-indigo-600 dark:text-indigo-400 relative">
              Conectar
              <span className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            </Link>
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
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white animate-gradient">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-4 backdrop-blur-sm">
            🔌 Integración en 1 línea
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Conectá tu web</h1>
          <p className="mt-3 text-emerald-50 max-w-2xl text-lg">
            Pegá una línea en tu sitio y empezá a recibir feedback real desde la actividad de tus usuarios — sin depender solo de
            formularios (y su sesgo).
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Paso 1: snippet */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-cyan-500" />
            1. Pegá el snippet en tu sitio
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Agregalo antes de <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">&lt;/head&gt;</code> (o
            en el layout de tu app). El SDK detecta solo el endpoint y el sitio — no hace falta configurar nada más.
          </p>
          <div className="relative">
            <pre className="bg-zinc-950 text-emerald-300 text-sm rounded-xl p-4 overflow-x-auto border border-zinc-800">
              <code>{snippet}</code>
            </pre>
            <button
              onClick={copySnippet}
              className="absolute top-3 right-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-emerald-600 hover:text-white transition-colors"
            >
              {copied ? '✓ Copiado' : '📋 Copiar'}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
              <code className="font-semibold text-zinc-800 dark:text-zinc-200">data-site=&quot;mi-app&quot;</code>
              <p className="mt-1">Identificador del sitio (default: el hostname).</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
              <code className="font-semibold text-zinc-800 dark:text-zinc-200">data-survey=&quot;nps&quot;</code>
              <p className="mt-1">Encuesta NPS 0-10 en vez de opciones.</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
              <code className="font-semibold text-zinc-800 dark:text-zinc-200">data-question / data-options</code>
              <p className="mt-1">Pregunta fija custom (desactiva las contextuales).</p>
            </div>
          </div>
        </div>

        {/* Paso 2: qué captura */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-cyan-500" />
            2. Feedback desde el comportamiento, no solo forms
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Los formularios solo capturan a quien se toma el trabajo de responder (sesgo de selección). El SDK analiza la
            actividad real de todos los usuarios y, cuando detecta frustración, muestra una micro-encuesta contextual de
            respuesta rápida (radio / un tap) en el momento justo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              ['😤 Rage click', '“¿Qué intentabas hacer recién?” — opciones sobre el botón que no respondió.'],
              ['🖱️ Dead clicks (x2)', '“¿Esperabas que eso fuera clickeable?” — detecta affordances confusas.'],
              ['⏱️ 25s + 3 clicks', '“¿Encontraste lo que buscabas?” — usuarios que dan vueltas sin lograr su objetivo.'],
              ['🚪 Exit intent', '“¿Qué te hizo querer salir?” — captura el motivo antes del abandono.'],
            ].map(([title, desc]) => (
              <div key={title} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
            Además captura automáticamente (sin preguntar nada): rage clicks, dead clicks, errores JS y de red, abandono de
            formularios, U-turns y páginas lentas.
          </p>
        </div>

        {/* Paso 3: verificación */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-cyan-500" />
            3. Verificá la conexión
          </h2>
          {sites.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Esperando la primera señal de tu web... Instalá el snippet, abrí tu sitio e interactuá (esta página se actualiza sola).
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {sites.map(({ site, count }) => (
                  <span
                    key={site}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {site} · {count} señal{count === 1 ? '' : 'es'}
                  </span>
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                {externalSignals.map((s) => (
                  <li key={s.id} className="flex items-start gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">{s.site}</span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold">{s.type}</span> — {s.message}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Paso 4: conectores reales */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-cyan-500" />
            4. (Opcional) Conectá tus herramientas reales
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Cada integración se activa sola al configurar sus variables de entorno (en Vercel: Settings → Environment Variables).
            Mientras no estén, se muestran datos demo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {realConnectors.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.icon}</span>
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'connected'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {c.status === 'connected' ? 'Conectado' : 'Demo'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{c.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(connectorEnvVars[c.id] || []).map((v) => (
                    <code key={v} className="text-[10px] bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {v}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
