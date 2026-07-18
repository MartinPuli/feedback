import { fetchRealSignals, getConnectors } from '@/lib/connectors';

export type FeedbackSignal = {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  page: string;
  message: string;
  selector?: string;
  timestamp: string;
  source: string;
};

const demos: FeedbackSignal[] = [
  {
    id: '1',
    type: 'rage_click',
    severity: 'warning',
    page: '/pricing',
    message: 'Usuario hizo 5 clicks en el botón "Comenzar" sin respuesta.',
    selector: 'button#start',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    source: 'sdk',
  },
  {
    id: '2',
    type: 'js_error',
    severity: 'critical',
    page: '/checkout',
    message: 'Uncaught TypeError: Cannot read properties of undefined (reading \'id\')',
    selector: 'app.min.js:42',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    source: 'sentry',
  },
  {
    id: '3',
    type: 'form_abandon',
    severity: 'warning',
    page: '/signup',
    message: 'Formulario abandonado en el paso 3 (teléfono).',
    selector: 'form#signup',
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    source: 'extension',
  },
  {
    id: '4',
    type: 'slow_page',
    severity: 'info',
    page: '/dashboard',
    message: 'LCP de 4.2s. Posible causa: imagen hero no optimizada.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: 'googleanalytics',
  },
  {
    id: '5',
    type: 'u_turn',
    severity: 'info',
    page: '/features -> /pricing -> /features',
    message: 'Usuario volvió a /features en 8s, posible confusión de precios.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    source: 'sdk',
  },
  {
    id: '6',
    type: 'micro_survey',
    severity: 'info',
    page: '/onboarding',
    message: 'Respuesta: "Me costó encontrar la integración" (NPS 6).',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    source: 'intercom',
  },
];

export async function getFeedbackSignals(): Promise<FeedbackSignal[]> {
  const real = await fetchRealSignals();

  // Si no hay conectores reales configurados, devolvemos demo.
  const anyConnected = getConnectors().some((c) => c.status === 'connected' && c.id !== 'sdk' && c.id !== 'extension');
  if (!anyConnected && real.length === 0) {
    return demos;
  }

  return [
    ...demos,
    ...real.map((s) => ({
      ...s,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    })),
  ];
}

export async function ingestSignal(signal: Omit<FeedbackSignal, 'id' | 'timestamp'>) {
  const enriched: FeedbackSignal = {
    ...signal,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(enriched),
      });
    } catch (err) {
      console.error('Supabase write failed:', err);
    }
  }

  return enriched;
}

export async function generateDailySummary(): Promise<string> {
  const signals = await getFeedbackSignals();

  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Sos un analista de producto. Resumí en 3 líneas el feedback de usuarios en español, destacando el problema más grave y una acción concreta.',
            },
            {
              role: 'user',
              content: JSON.stringify(signals.map((s) => `${s.severity}: ${s.type} - ${s.message}`)),
            },
          ],
          temperature: 0.5,
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err) {
      console.error('OpenAI summary failed:', err);
    }
  }

  // Fallback heurístico
  const critical = signals.filter((s) => s.severity === 'critical');
  const warnings = signals.filter((s) => s.severity === 'warning');
  const top = critical.length ? critical : warnings;
  const types = [...new Set(signals.map((s) => s.type))];
  return `Hoy se detectaron ${signals.length} señales (${critical.length} críticas). Los problemas más comunes: ${types.slice(0, 3).join(', ')}. Prioridad: ${top[0]?.message || 'Ninguna'} Verificar ${top[0]?.page || 'la app'} para ev churn.`;
}

export { getConnectors };
