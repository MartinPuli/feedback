export type ConnectorStatus = 'connected' | 'demo' | 'soon' | 'config_missing';

export type Connector = {
  id: string;
  name: string;
  icon: string;
  status: ConnectorStatus;
  description: string;
};

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
      status: process.env.POSTHOG_API_KEY ? 'connected' : 'demo',
      description: 'Eventos, funnels y cohortes de PostHog.',
    },
    {
      id: 'sentry',
      name: 'Sentry',
      icon: '🐞',
      status: process.env.SENTRY_AUTH_TOKEN ? 'connected' : 'demo',
      description: 'Errores y trazas de Sentry.',
    },
    {
      id: 'googleanalytics',
      name: 'Google Analytics 4',
      icon: '📊',
      status: process.env.GA4_PROPERTY_ID && process.env.GA4_CREDENTIALS ? 'connected' : 'demo',
      description: 'Eventos y métricas de GA4.',
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      icon: '📈',
      status: process.env.MIXPANEL_PROJECT_ID && process.env.MIXPANEL_SERVICE_ACCOUNT ? 'connected' : 'demo',
      description: 'Eventos y retención de Mixpanel.',
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      icon: '📉',
      status: process.env.AMPLITUDE_API_KEY ? 'connected' : 'demo',
      description: 'Eventos y análisis de producto de Amplitude.',
    },
    {
      id: 'intercom',
      name: 'Intercom',
      icon: '💬',
      status: process.env.INTERCOM_ACCESS_TOKEN ? 'connected' : 'demo',
      description: 'Mensajes y conversaciones con usuarios.',
    },
    {
      id: 'crisp',
      name: 'Crisp',
      icon: '💁',
      status: process.env.CRISP_TOKEN_ID && process.env.CRISP_TOKEN_KEY ? 'connected' : 'demo',
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

export type RawSignal = {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  page: string;
  message: string;
  selector?: string;
  source: string;
};

export async function fetchRealSignals(): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];

  if (process.env.POSTHOG_API_KEY && process.env.POSTHOG_PROJECT_ID) {
    try {
      const res = await fetch(
        `${process.env.POSTHOG_HOST || 'https://us.posthog.com'}/api/projects/${process.env.POSTHOG_PROJECT_ID}/events?limit=50`,
        {
          headers: { Authorization: `Bearer ${process.env.POSTHOG_API_KEY}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        for (const event of data.results || []) {
          if (event.event === '$exception' || event.event === 'error') {
            signals.push({
              type: 'js_error',
              severity: 'critical',
              page: event.properties?.$current_url || '/',
              message: event.properties?.$exception_message || JSON.stringify(event),
              source: 'posthog',
            });
          }
        }
      }
    } catch (err) {
      console.error('PostHog connector failed:', err);
    }
  }

  if (process.env.SENTRY_AUTH_TOKEN) {
    // Sentry Issues API: https://sentry.io/api/0/projects/{org}/{project}/issues/
    try {
      const res = await fetch(process.env.SENTRY_ISSUES_URL || 'https://sentry.io/api/0/issues/', {
        headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}` },
      });
      if (res.ok) {
        const issues = await res.json();
        for (const issue of issues.slice(0, 20)) {
          signals.push({
            type: 'js_error',
            severity: issue.level === 'fatal' || issue.level === 'error' ? 'critical' : 'warning',
            page: issue.culprit || '/',
            message: issue.title || 'Sentry issue',
            source: 'sentry',
          });
        }
      }
    } catch (err) {
      console.error('Sentry connector failed:', err);
    }
  }

  // GA4, Mixpanel, Amplitude, Intercom, Crisp: implementar cuando haya credenciales reales.

  return signals;
}
