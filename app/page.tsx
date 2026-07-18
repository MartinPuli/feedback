'use client';

import Link from 'next/link';
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

type Review = {
  id: string;
  source: 'reddit' | 'twitter' | 'trustpilot' | 'g2' | 'capterra';
  title?: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
  timestamp: string;
  tags: string[];
};

const severityBadge: Record<Signal['severity'], string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
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

const sentimentStyle: Record<Review['sentiment'], string> = {
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-zinc-500',
};

const features = [
  { title: 'Rage clicks', desc: 'Detecta clicks furiosos en el mismo elemento.' },
  { title: 'Dead clicks', desc: 'Clics en zonas que no son interactivas.' },
  { title: 'Errores JS', desc: 'Captura excepciones automáticamente.' },
  { title: 'Abandono de formularios', desc: 'Sabe cuándo un usuario no termina.' },
  { title: 'U-turns', desc: 'Detecta idas y vueltas entre páginas.' },
  { title: 'Micro-encuestas inteligentes', desc: 'Se disparan según comportamiento.' },
  { title: 'Social listener', desc: 'Busca reseñas en Reddit, Twitter y más.' },
  { title: 'Múltiples conectores', desc: 'PostHog, Sentry, GA4, Mixpanel, etc.' },
];

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState('Cargando resumen con IA...');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [feedback, summaryData, connectorsData, reviewsData] = await Promise.all([
        fetch('/api/feedback').then((r) => r.json()),
        fetch('/api/summary').then((r) => r.json()),
        fetch('/api/connectors').then((r) => r.json()),
        fetch('/api/reviews').then((r) => r.json()),
      ]);
      setSignals(feedback.signals || []);
      setSummary(summaryData.summary || '');
      setConnectors(connectorsData.connectors || []);
      setReviews(reviewsData.reviews || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const critical = signals.filter((s) => s.severity === 'critical').length;
  const warnings = signals.filter((s) => s.severity === 'warning').length;
  const connected = connectors.filter((c) => c.status === 'connected').length;

  const typeCounts = signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  const severityCounts = {
    critical: signals.filter((s) => s.severity === 'critical').length,
    warning: signals.filter((s) => s.severity === 'warning').length,
    info: signals.filter((s) => s.severity === 'info').length,
  };

  const maxType = Math.max(...Object.values(typeCounts), 1);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            <span className="font-bold text-lg">FeedbackLoop</span>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/" className="text-zinc-600 dark:text-zinc-300 hover:text-indigo-600">
              Dashboard
            </Link>
            <Link href="/demo" className="text-zinc-600 dark:text-zinc-300 hover:text-indigo-600">
              Demo
            </Link>
            <a href="https://github.com/MartinPuli/feedback" className="text-zinc-600 dark:text-zinc-300 hover:text-indigo-600">
              Repo
            </a>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Feedback real, automático y unificado</h1>
          <p className="mt-3 text-indigo-100 max-w-2xl">
            Detectá señales de frustración en tu app, conectá analytics, soporte y redes sociales, y recibí un resumen diario con IA.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span>Actualizando cada 5 segundos</span>
          </div>
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
          <div className="lg:col-span-2 space-y-6">
            <Card title="Señales de feedback recientes" loading={loading}>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[420px] overflow-auto">
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
                      {signal.selector && <code className="text-xs text-zinc-500">{signal.selector}</code>}
                    </div>
                    <time className="text-xs text-zinc-400 whitespace-nowrap">
                      {new Date(signal.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Distribución de señales">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 mb-3">Por tipo</h4>
                  <div className="space-y-2">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(count / maxType) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 mb-3">Por severidad</h4>
                  <div className="space-y-2">
                    {Object.entries(severityCounts).map(([sev, count]) => (
                      <div key={sev} className="flex items-center gap-3">
                        <span className="w-20 text-sm capitalize">{sev}</span>
                        <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sev === 'critical' ? 'bg-red-500' : sev === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${(count / (signals.length || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm w-6 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Resumen diario con IA</h2>
              <p className="text-sm leading-relaxed opacity-95">{summary}</p>
            </div>

            <Card title="Conectores" loading={loading}>
              <ul className="space-y-3">
                {connectors.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{c.icon}</span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <Card title="Social listener - menciones recientes" loading={loading}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{review.source}</span>
                  <span className={`text-xs font-semibold ${sentimentStyle[review.sentiment]}`}>
                    {review.sentiment}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-4">{review.content}</p>
                {review.url && (
                  <a
                    href={review.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 inline-block"
                  >
                    Ver publicación
                  </a>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {review.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10 mb-10">
          <Card title="Cómo captura feedback">
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
          </Card>

          <Card title="Instalación en tu app">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Opción 1: SDK de una línea. Opción 2: extensión de Chrome sin tocar código.
            </p>
            <pre className="text-sm bg-zinc-950 text-zinc-100 p-4 rounded-xl overflow-x-auto mb-4">
              <code>{`<script src="/feedback.js" async data-survey="true"></script>`}</code>
            </pre>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Encuestas inteligentes: se disparan tras rage clicks, dead clicks o 25s + 3 clics.
            </p>
            <a
              href="/feedback-extension.zip"
              className="inline-flex items-center gap-2 text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              🧩 Descargar extensión Chrome
            </a>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Card({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        {title}
        {loading && <span className="text-xs font-normal text-zinc-400">cargando...</span>}
      </h2>
      {children}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: string }) {
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
    connected: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    demo: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    soon: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    config_missing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  };

  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status]}`}>{labels[status]}</span>;
}
