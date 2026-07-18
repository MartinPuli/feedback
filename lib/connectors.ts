export type ConnectorStatus = 'connected' | 'demo' | 'soon' | 'config_missing';

export type Connector = {
  id: string;
  name: string;
  icon: string;
  status: ConnectorStatus;
  description: string;
};

export type RawSignal = {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  page: string;
  message: string;
  selector?: string;
  source: string;
};

function env(name: string) {
  return process.env[name];
}

function has(...names: string[]) {
  return names.every((n) => !!process.env[n]);
}

export function getConnectors(): Connector[] {
  return [
    {
      id: 'sdk',
      name: 'SDK Web',
      icon: '🌐',
      status: 'connected',
      description: 'Script que se agrega a la app para capturar señales nativas.',
    },
    {
      id: 'extension',
      name: 'Extensión Chrome',
      icon: '🧩',
      status: 'connected',
      description: 'Captura feedback sin tocar el código de la app.',
    },
    {
      id: 'posthog',
      name: 'PostHog',
      icon: '🦔',
      status: has('POSTHOG_API_KEY', 'POSTHOG_PROJECT_ID') ? 'connected' : 'demo',
      description: 'Eventos, funnels y cohortes de PostHog.',
    },
    {
      id: 'sentry',
      name: 'Sentry',
      icon: '🐞',
      status: has('SENTRY_AUTH_TOKEN', 'SENTRY_ISSUES_URL') ? 'connected' : 'demo',
      description: 'Errores y trazas de Sentry.',
    },
    {
      id: 'googleanalytics',
      name: 'Google Analytics 4',
      icon: '📊',
      status: has('GA4_ACCESS_TOKEN', 'GA4_PROPERTY_ID') ? 'connected' : 'demo',
      description: 'Eventos y métricas de GA4 (access token requerido).',
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      icon: '📈',
      status: has('MIXPANEL_API_SECRET') ? 'connected' : 'demo',
      description: 'Eventos y retención de Mixpanel.',
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      icon: '📉',
      status: has('AMPLITUDE_API_KEY', 'AMPLITUDE_SECRET_KEY') ? 'connected' : 'demo',
      description: 'Eventos y análisis de producto de Amplitude.',
    },
    {
      id: 'intercom',
      name: 'Intercom',
      icon: '💬',
      status: has('INTERCOM_ACCESS_TOKEN') ? 'connected' : 'demo',
      description: 'Mensajes y conversaciones con usuarios.',
    },
    {
      id: 'crisp',
      name: 'Crisp',
      icon: '💁',
      status: has('CRISP_TOKEN_ID', 'CRISP_TOKEN_KEY', 'CRISP_WEBSITE_ID') ? 'connected' : 'demo',
      description: 'Chats y tickets de soporte.',
    },
    {
      id: 'hotjar',
      name: 'Hotjar',
      icon: '🔥',
      status: 'soon',
      description: 'Mapas de calor y grabaciones (próximamente).',
    },
  ];
}

async function fetchPostHog(): Promise<RawSignal[]> {
  const key = env('POSTHOG_API_KEY');
  const project = env('POSTHOG_PROJECT_ID');
  if (!key || !project) return [];

  const host = env('POSTHOG_HOST') || 'https://us.posthog.com';
  const res = await fetch(`${host}/api/projects/${project}/events?limit=50`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    console.error('PostHog fetch failed:', res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as { results?: Array<{ event: string; properties?: Record<string, unknown> }> };
  const signals: RawSignal[] = [];

  for (const event of data.results || []) {
    const url = String(event.properties?.$current_url || '/');
    if (event.event === '$exception' || event.event === 'error') {
      signals.push({
        type: 'js_error',
        severity: 'critical',
        page: url,
        message: String(event.properties?.$exception_message || JSON.stringify(event.properties)),
        source: 'posthog',
      });
    } else if (event.properties?.$rage_click) {
      signals.push({
        type: 'rage_click',
        severity: 'warning',
        page: url,
        message: 'Rage click detectado por PostHog',
        source: 'posthog',
      });
    }
  }
  return signals;
}

async function fetchSentry(): Promise<RawSignal[]> {
  const token = env('SENTRY_AUTH_TOKEN');
  const url = env('SENTRY_ISSUES_URL');
  if (!token || !url) return [];

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error('Sentry fetch failed:', res.status, await res.text());
    return [];
  }

  const issues = (await res.json()) as Array<{ title: string; level?: string; culprit?: string }>;
  return issues.slice(0, 20).map((issue) => ({
    type: 'js_error',
    severity: issue.level === 'fatal' || issue.level === 'error' ? 'critical' : 'warning',
    page: issue.culprit || '/',
    message: issue.title || 'Sentry issue',
    source: 'sentry',
  }));
}

async function fetchGA4(): Promise<RawSignal[]> {
  const token = env('GA4_ACCESS_TOKEN');
  const property = env('GA4_PROPERTY_ID');
  if (!token || !property) return [];

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'bounceRate' }],
    }),
  });

  if (!res.ok) {
    console.error('GA4 fetch failed:', res.status, await res.text());
    return [];
  }

  // El parseo detallado de GA4 requiere manejar rows/dimensionHeaders. Devolvemos un resumen.
  const signals: RawSignal[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  for (const row of data.rows || []) {
    const page = row.dimensionValues?.[0]?.value || '/';
    const bounce = parseFloat(row.metricValues?.[0]?.value || '0');
    if (bounce > 70) {
      signals.push({
        type: 'u_turn',
        severity: 'info',
        page,
        message: `Bounce rate alto (${bounce.toFixed(1)}%) en ${page}`,
        source: 'googleanalytics',
      });
    }
  }
  return signals;
}

async function fetchMixpanel(): Promise<RawSignal[]> {
  const secret = env('MIXPANEL_API_SECRET');
  if (!secret) return [];

  const res = await fetch('https://data.mixpanel.com/api/2.0/export?from_date=2024-01-01&to_date=2026-12-31', {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${secret}:`).toString('base64'),
    },
  });

  if (!res.ok) {
    console.error('Mixpanel fetch failed:', res.status, await res.text());
    return [];
  }

  const text = await res.text();
  const signals: RawSignal[] = [];
  for (const line of text.split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line) as { event?: string; properties?: Record<string, unknown> };
      if (event.event?.toLowerCase().includes('error') || event.properties?.$error) {
        signals.push({
          type: 'js_error',
          severity: 'warning',
          page: String(event.properties?.$current_url || '/'),
          message: `Mixpanel evento problemático: ${event.event}`,
          source: 'mixpanel',
        });
      }
    } catch {
      // línea corrupta, ignorar
    }
  }
  return signals;
}

async function fetchAmplitude(): Promise<RawSignal[]> {
  const apiKey = env('AMPLITUDE_API_KEY');
  const secret = env('AMPLITUDE_SECRET_KEY');
  if (!apiKey || !secret) return [];

  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://amplitude.com/api/2/export?start=${fmt(start)}&end=${fmt(now)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${apiKey}:${secret}`).toString('base64'),
    },
  });

  if (!res.ok) {
    console.error('Amplitude fetch failed:', res.status, await res.text());
    return [];
  }

  const events = (await res.json()) as { event_type: string; event_properties?: Record<string, unknown> }[];
  return events
    .filter((e) => e.event_type.toLowerCase().includes('error'))
    .map((e) => ({
      type: 'js_error',
      severity: 'warning',
      page: String(e.event_properties?.page || '/'),
      message: `Amplitude evento: ${e.event_type}`,
      source: 'amplitude',
    }));
}

async function fetchIntercom(): Promise<RawSignal[]> {
  const token = env('INTERCOM_ACCESS_TOKEN');
  if (!token) return [];

  const res = await fetch('https://api.intercom.io/conversations', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Intercom fetch failed:', res.status, await res.text());
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  return (data.conversations || []).slice(0, 10).map((c: { id: string; title?: string; statistics?: { count_reopens: number } }) => ({
    type: 'micro_survey',
    severity: c.statistics?.count_reopens ? 'warning' : 'info',
    page: '/',
    message: `Intercom conversación: ${c.title || c.id}`,
    source: 'intercom',
  }));
}

async function fetchCrisp(): Promise<RawSignal[]> {
  const tokenId = env('CRISP_TOKEN_ID');
  const tokenKey = env('CRISP_TOKEN_KEY');
  const websiteId = env('CRISP_WEBSITE_ID');
  if (!tokenId || !tokenKey || !websiteId) return [];

  const res = await fetch(`https://api.crisp.chat/v1/website/${websiteId}/conversations/0`, {
    headers: {
      'X-Crisp-Tier': 'plugin',
      Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenKey}`).toString('base64')}`,
    },
  });

  if (!res.ok) {
    console.error('Crisp fetch failed:', res.status, await res.text());
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  return (data.data || []).slice(0, 10).map((c: { session_id: string; unread?: { operator?: number } }) => ({
    type: 'micro_survey',
    severity: c.unread?.operator ? 'warning' : 'info',
    page: '/',
    message: `Crisp conversación: ${c.session_id}`,
    source: 'crisp',
  }));
}

export async function fetchRealSignals(): Promise<RawSignal[]> {
  const results = await Promise.allSettled([
    fetchPostHog(),
    fetchSentry(),
    fetchGA4(),
    fetchMixpanel(),
    fetchAmplitude(),
    fetchIntercom(),
    fetchCrisp(),
  ]);

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
