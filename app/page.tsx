'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback } from 'react';

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
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
};

const severityBg: Record<Signal['severity'], string> = {
  critical: 'bg-red-500/10',
  warning: 'bg-amber-500/10',
  info: 'bg-cyan-500/10',
};

const typeIcon: Record<string, string> = {
  rage_click: '😤',
  js_error: '💥',
  form_abandon: '🚪',
  slow_page: '🐌',
  u_turn: '↩️',
  dead_click: '🖱️',
  micro_survey: '💬',
  network_error: '📡',
};

const typeLabel: Record<string, string> = {
  rage_click: 'Rage Click',
  js_error: 'JS Error',
  form_abandon: 'Form Abandon',
  slow_page: 'Slow Page',
  u_turn: 'U-Turn',
  dead_click: 'Dead Click',
  micro_survey: 'Micro Survey',
  network_error: 'Network Error',
};

const sentimentStyle: Record<Review['sentiment'], string> = {
  positive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  negative: 'text-red-600 dark:text-red-400 bg-red-500/10',
  neutral: 'text-zinc-500 bg-zinc-500/10',
};

const sentimentIcon: Record<Review['sentiment'], string> = {
  positive: '😊',
  negative: '😞',
  neutral: '😐',
};

const sourceIcon: Record<string, string> = {
  reddit: '🔴',
  twitter: '🐦',
  trustpilot: '⭐',
  g2: '🟢',
  capterra: '🔵',
};

const features = [
  { icon: '😤', title: 'Rage clicks', desc: 'Detecta clicks furiosos en el mismo elemento.' },
  { icon: '🖱️', title: 'Dead clicks', desc: 'Clics en zonas que no son interactivas.' },
  { icon: '💥', title: 'Errores JS', desc: 'Captura excepciones automáticamente.' },
  { icon: '🚪', title: 'Abandono de formularios', desc: 'Sabe cuándo un usuario no termina.' },
  { icon: '↩️', title: 'U-turns', desc: 'Detecta idas y vueltas entre páginas.' },
  { icon: '💬', title: 'Micro-encuestas inteligentes', desc: 'Se disparan según comportamiento.' },
  { icon: '🔍', title: 'Social listener', desc: 'Busca reseñas en Reddit, Twitter y más.' },
  { icon: '🔌', title: 'Múltiples conectores', desc: 'PostHog, Sentry, GA4, Mixpanel, etc.' },
];

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function priorityScore(s: Signal): number {
  const sevWeight = { critical: 3, warning: 2, info: 1 };
  const ageMins = (Date.now() - new Date(s.timestamp).getTime()) / 60000;
  const recencyBonus = Math.max(0, 10 - ageMins / 30);
  return sevWeight[s.severity] * 10 + recencyBonus;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / max) * 25}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,30 ${points} 100,30`}
        fill={color}
        opacity="0.1"
      />
    </svg>
  );
}

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState('Cargando resumen con IA...');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const load = useCallback(async () => {
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
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 't') setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredSignals = useMemo(() => {
    return signals
      .filter((s) => {
        if (filterSeverity !== 'all' && s.severity !== filterSeverity) return false;
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            s.message.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q) ||
            s.page.toLowerCase().includes(q) ||
            s.source.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a));
  }, [signals, filterSeverity, filterType, search]);

  const critical = signals.filter((s) => s.severity === 'critical').length;
  const warnings = signals.filter((s) => s.severity === 'warning').length;
  const info = signals.filter((s) => s.severity === 'info').length;
  const connected = connectors.filter((c) => c.status === 'connected').length;

  const typeCounts = signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  const severityCounts = { critical, warnings, info };
  const maxType = Math.max(...Object.values(typeCounts), 1);
  const allTypes = [...new Set(signals.map((s) => s.type))];

  const sparkData = [3, 5, 4, 7, 6, 8, 5, signals.length || 6];
  const criticalSpark = [2, 1, 3, 2, 1, 0, 1, critical];
  const warningSpark = [1, 3, 2, 4, 3, 2, 3, warnings];
  const connectorSpark = [1, 2, 2, 2, 3, 2, 2, connected];

  const [simulating, setSimulating] = useState(false);

  async function simulateBurst() {
    setSimulating(true);
    try {
      await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'random_burst', count: 6 }),
      });
      await load();
    } finally {
      setSimulating(false);
    }
  }

  function exportSignals() {
    const data = JSON.stringify(filteredSignals, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-signals-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0f] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Navbar */}
      <nav className="glass border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-float inline-block">🔄</span>
            <span className="font-bold text-lg gradient-text">FeedbackLoop</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              v2.0
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-indigo-600 dark:text-indigo-400 relative">
              Dashboard
              <span className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            </Link>
            <Link href="/demo" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Demo
            </Link>
            <a href="/presentation.html" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Presentación
            </a>
            <a href="https://github.com/MartinPuli/feedback" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Repo
            </a>
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">En vivo</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white animate-gradient">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)'
        }} />
        <div className="relative max-w-7xl mx-auto px-6 py-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Feedback automático en tiempo real
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight max-w-3xl">
            Feedback real, automático y unificado
          </h1>
          <p className="mt-4 text-indigo-100 max-w-2xl text-lg">
            Detectá señales de frustración en tu app, conectá analytics, soporte y redes sociales, y recibí un resumen diario con IA.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-all hover:scale-105 shadow-lg"
            >
              🎮 Probar demo
            </Link>
            <a
              href="/presentation.html"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              📊 Ver presentación
            </a>
            <div className="flex items-center gap-2 text-sm text-indigo-100">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
              </span>
              <span>Actualizado: {lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Señales hoy" value={signals.length} sparkData={sparkData} sparkColor="#6366f1" trend="↑ 12%" trendUp={true} delay="stagger-1" />
          <StatCard label="Críticas" value={critical} sparkData={criticalSpark} sparkColor="#ef4444" trend="↓ 50%" trendUp={false} delay="stagger-2" />
          <StatCard label="Advertencias" value={warnings} sparkData={warningSpark} sparkColor="#f59e0b" trend="↑ 1" trendUp={true} delay="stagger-3" />
          <StatCard label="Conectores activos" value={connected} sparkData={connectorSpark} sparkColor="#10b981" trend="— estable" trendUp={null} delay="stagger-4" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 space-y-6">
            {/* Signals with filters */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                  Señales de feedback
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={simulateBurst}
                    disabled={simulating}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {simulating ? '⏳ Generando...' : '🎬 Simular señales'}
                  </button>
                  <button
                    onClick={exportSignals}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1.5"
                  >
                    📤 Exportar
                  </button>
                  {loading && <span className="text-xs text-zinc-400">cargando...</span>}
                </div>
              </div>

              {/* Search + Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Buscar señales... (presiona /)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="all">Toda severidad</option>
                  <option value="critical">Crítica</option>
                  <option value="warning">Advertencia</option>
                  <option value="info">Info</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="all">Todos los tipos</option>
                  {allTypes.map((t) => (
                    <option key={t} value={t}>{typeLabel[t] || t}</option>
                  ))}
                </select>
              </div>

              {/* Signal List */}
              <div className="space-y-2 max-h-[440px] overflow-auto pr-1">
                {filteredSignals.length === 0 && !loading && (
                  <div className="text-center py-12 text-zinc-400 text-sm">
                    No se encontraron señales con esos filtros.
                  </div>
                )}
                {filteredSignals.map((signal, i) => (
                  <div
                    key={signal.id}
                    className="group flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${severityBg[signal.severity]}`}>
                      {typeIcon[signal.type] || '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{typeLabel[signal.type] || signal.type.replace(/_/g, ' ')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${severityBadge[signal.severity]}`}>
                          {signal.severity}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{signal.page}</span>
                        <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">{signal.source}</span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{signal.message}</p>
                      {signal.selector && (
                        <code className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 block">{signal.selector}</code>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <time className="text-[11px] text-zinc-400 whitespace-nowrap">{timeAgo(signal.timestamp)}</time>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-indigo-500 font-bold">★ {priorityScore(signal).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-gradient-to-b from-cyan-500 to-indigo-500" />
                Distribución de señales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Por tipo</h4>
                  <div className="space-y-3">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <div key={type} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span>{typeIcon[type] || '🔔'}</span>
                            {typeLabel[type] || type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-zinc-500">{count}</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                            style={{ width: `${(count / maxType) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Por severidad</h4>
                  <div className="space-y-3">
                    {Object.entries(severityCounts).map(([sev, count]) => (
                      <div key={sev} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium capitalize">{sev}</span>
                          <span className="text-zinc-500">{count}</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              sev === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-500' : sev === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${(count / (signals.length || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* AI Summary */}
            <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg animate-fade-in-up">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 animate-gradient" />
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)'
              }} />
              <div className="relative">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-xl">✦</span>
                  Resumen con IA
                </h2>
                <p className="text-sm leading-relaxed opacity-95">{summary}</p>
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-xs opacity-80">
                  <span>🤖 GPT-4o-mini</span>
                  <span>•</span>
                  <span>Actualizado cada 5s</span>
                </div>
              </div>
            </div>

            {/* Connectors */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-cyan-500" />
                Conectores
              </h2>
              <ul className="space-y-2.5">
                {connectors.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 text-sm group">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{c.icon}</span>
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{c.description}</p>
                      </div>
                    </div>
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Social Listener */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm mb-10 animate-fade-in-up">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-pink-500 to-rose-500" />
            Social Listener — menciones recientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review, i) => (
              <div
                key={review.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold flex items-center gap-1.5 capitalize">
                    <span>{sourceIcon[review.source] || '📢'}</span>
                    {review.source}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${sentimentStyle[review.sentiment]}`}>
                    {sentimentIcon[review.sentiment]} {review.sentiment}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3">{review.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {review.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {review.url && (
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex-shrink-0"
                    >
                      Ver →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features + Install */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
              Cómo captura feedback
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm mb-0.5">{f.title}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm animate-fade-in-up">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
              Instalación en tu app
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Opción 1: SDK de una línea</p>
                <pre className="text-sm bg-zinc-950 text-zinc-100 p-4 rounded-xl overflow-x-auto border border-zinc-800">
                  <code>{`<script src="/feedback.js" async
  data-survey="true"
  data-question="¿Qué te costó?">
</script>`}</code>
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Opción 2: Extensión Chrome</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Sin tocar código. Captura feedback directamente desde el navegador.
                </p>
                <a
                  href="/feedback-extension.zip"
                  className="inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:scale-105 transition-transform shadow-lg"
                >
                  🧩 Descargar extensión
                </a>
              </div>
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Smart surveys:</span> se disparan tras rage clicks, dead clicks, o 25s + 3 clics. También exit-intent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 pb-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-lg">🔄</span>
            <span className="font-semibold gradient-text">FeedbackLoop</span>
            <span>— Feedback nativo para apps</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>⌨️ Atajos: <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">/</kbd> buscar · <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">t</kbd> tema</span>
          </div>
        </footer>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
  sparkData,
  sparkColor,
  trend,
  trendUp,
  delay,
}: {
  label: string;
  value: number;
  highlight?: string;
  sparkData: number[];
  sparkColor: string;
  trend: string;
  trendUp: boolean | null;
  delay: string;
}) {
  return (
    <div
      className={`group relative bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 animate-fade-in-up ${delay}`}
    >
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        <span className={`text-[10px] font-semibold ${trendUp === true ? 'text-emerald-500' : trendUp === false ? 'text-red-500' : 'text-zinc-400'}`}>
          {trend}
        </span>
      </div>
      <p className={`text-3xl font-black ${highlight || 'gradient-text'}`}>{value}</p>
      <div className="mt-2">
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Connector['status'] }) {
  const labels: Record<Connector['status'], string> = {
    connected: 'Conectado',
    demo: 'Demo',
    soon: 'Próximamente',
    config_missing: 'Faltan cred.',
  };

  const colors: Record<Connector['status'], string> = {
    connected: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    demo: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20',
    soon: 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20',
    config_missing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  };

  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap ${colors[status]}`}>
      {status === 'connected' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse-glow" />}
      {labels[status]}
    </span>
  );
}
