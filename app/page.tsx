'use client';

import { useEffect, useState } from 'react';

type Signal = {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  page: string;
  message: string;
  selector?: string;
  timestamp: string;
  source: string;
};

type Connector = {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'demo' | 'soon' | 'config_missing';
  description: string;
};

const severityBadge: Record<Signal['severity'], string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
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

const features = [
  { title: 'Rage clicks', desc: 'Detecta cuando un usuario clickea furiosamente el mismo elemento.' },
  { title: 'Dead clicks', desc: 'Clics en elementos que no hacen nada, señal de confusión de UI.' },
  { title: 'Errores JS', desc: 'Captura excepciones y promesas no manejadas automáticamente.' },
  { title: 'Abandono de formularios', desc: 'Sabe cuándo un usuario empieza y no termina un formulario.' },
  { title: 'U-turns', desc: 'Detecta idas y vueltas entre páginas, indica falta de claridad.' },
  { title: 'Micro-encuestas', desc: 'Preguntas contextuales de 1 click, no encuestas largas.' },
];

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [summary, setSummary] = useState('Cargando resumen con IA...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/feedback').then((r) => r.json()),
      fetch('/api/summary').then((r) => r.json()),
      fetch('/api/connectors').then((r) => r.json()),
    ])
      .then(([feedback, summaryData, connectorsData]) => {
        setSignals(feedback.signals || []);
        setSummary(summaryData.summary || '');
        setConnectors(connectorsData.connectors || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const critical = signals.filter((s) => s.severity === 'critical').length;
  const warnings = signals.filter((s) => s.severity === 'warning').length;
  const connected = connectors.filter((c) => c.status === 'connected').length;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔄</span>
            <h1 className="text-3xl font-bold tracking-tight">FeedbackLoop</h1>
          </div>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Recolector de feedback real y automático. Conecta tu app, tus analytics, soporte y más
            para detectar problemas sin encuestas.
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Señales hoy" value={signals.length} />
          <StatCard label="Críticas" value={critical} highlight="text-red-600" />
          <StatCard label="Advertencias" value={warnings} highlight="text-amber-600" />
          <StatCard label="Conectores activos" value={connected} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Señales de feedback recientes</h2>
            {loading ? (
              <p className="text-zinc-500">Cargando...</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {signals.map((signal) => (
                  <div key={signal.id} className="py-4 flex items-start gap-4">
                    <span className="text-2xl">{typeIcon[signal.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{signal.type.replace(/_/g, ' ')}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge[signal.severity]}`}
                        >
                          {signal.severity}
                        </span>
                        <span className="text-xs text-zinc-500">{signal.page}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{signal.message}</p>
                      {signal.selector && (
                        <code className="text-xs text-zinc-500">{signal.selector}</code>
                      )}
                    </div>
                    <time className="text-xs text-zinc-400 whitespace-nowrap">
                      {new Date(signal.timestamp).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Resumen diario con IA</h2>
              <p className="text-sm leading-relaxed opacity-95">{summary}</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Conectores</h2>
              <ul className="space-y-3">
                {connectors.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                    </div>
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Cómo se captura el feedback</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800"
                >
                  <h3 className="font-medium mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Instalación en tu app</h2>
            <p className="text-sm text-zinc-400 mb-3">
              Opción 1: SDK de una línea. Opción 2: extensión de Chrome sin tocar código.
            </p>
            <pre className="text-sm bg-zinc-950 p-4 rounded-xl overflow-x-auto mb-4">
              <code>{`<script src="/feedback.js" async data-survey="true"></script>`}</code>
            </pre>
            <a
              href="/feedback-extension.zip"
              className="inline-flex items-center gap-2 text-sm font-medium bg-white text-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-200"
            >
              🧩 Descargar extensión Chrome
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight || ''}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: Connector['status'] }) {
  const labels: Record<Connector['status'], string> = {
    connected: 'Conectado',
    demo: 'Demo',
    soon: 'Próximamente',
    config_missing: 'Faltan credenciales',
  };

  const colors: Record<Connector['status'], string> = {
    connected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    demo: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    soon: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    config_missing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  };

  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status]}`}>{labels[status]}</span>;
}
