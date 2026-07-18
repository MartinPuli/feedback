import { type FeedbackSignal } from '@/lib/data';

export type ScenarioId =
  | 'checkout_crisis'
  | 'onboarding_friction'
  | 'performance_degradation'
  | 'survey_wave'
  | 'social_backlash'
  | 'random_burst';

export type Scenario = {
  id: ScenarioId;
  name: string;
  icon: string;
  description: string;
};

export const scenarios: Scenario[] = [
  {
    id: 'checkout_crisis',
    name: 'Crisis en checkout',
    icon: '🛒',
    description: 'Errores JS + rage clicks + abandono en el flujo de pago.',
  },
  {
    id: 'onboarding_friction',
    name: 'Fricción en onboarding',
    icon: '🚧',
    description: 'Dead clicks, U-turns y encuestas negativas en el registro.',
  },
  {
    id: 'performance_degradation',
    name: 'Degradación de performance',
    icon: '🐌',
    description: 'Páginas lentas y errores intermitentes en toda la app.',
  },
  {
    id: 'survey_wave',
    name: 'Ola de encuestas',
    icon: '💬',
    description: 'Respuestas de micro-encuestas y NPS variados.',
  },
  {
    id: 'social_backlash',
    name: 'Quejas por login',
    icon: '🔐',
    description: 'Usuarios trabados en el login: errores, rage clicks y quejas.',
  },
  {
    id: 'random_burst',
    name: 'Ráfaga aleatoria',
    icon: '🎲',
    description: 'Mezcla realista de señales de todo tipo.',
  },
];

type Template = Omit<FeedbackSignal, 'id' | 'timestamp'>;

const pool: Record<ScenarioId, Template[]> = {
  checkout_crisis: [
    { type: 'js_error', severity: 'critical', page: '/checkout', message: "Uncaught TypeError: Cannot read properties of null (reading 'total') @ checkout.js:87", selector: 'checkout.js:87', source: 'sdk' },
    { type: 'rage_click', severity: 'warning', page: '/checkout', message: 'Rage click en button#pay (6 clicks en <700ms). El botón de pago no responde.', selector: 'button#pay', source: 'sdk' },
    { type: 'form_abandon', severity: 'warning', page: '/checkout', message: 'Formulario de pago abandonado en el campo "número de tarjeta".', selector: 'form#payment', source: 'sdk' },
    { type: 'js_error', severity: 'critical', page: '/checkout', message: 'Failed to fetch: POST /api/payments devolvió 502', selector: 'api/payments', source: 'sentry' },
    { type: 'micro_survey', severity: 'warning', page: '/checkout', message: 'Respuesta: "No puedo pagar, el botón no hace nada"', source: 'sdk' },
    { type: 'u_turn', severity: 'info', page: '/checkout -> /cart -> /checkout', message: 'Usuario fue y volvió del carrito 3 veces en 40s.', source: 'sdk' },
  ],
  onboarding_friction: [
    { type: 'dead_click', severity: 'info', page: '/onboarding', message: 'Click muerto en div.step-3-header — los usuarios creen que es un botón.', selector: 'div.step-3-header', source: 'sdk' },
    { type: 'dead_click', severity: 'info', page: '/onboarding', message: 'Click muerto en img.integration-logo (12 usuarios distintos).', selector: 'img.integration-logo', source: 'sdk' },
    { type: 'u_turn', severity: 'info', page: '/onboarding -> /docs -> /onboarding', message: 'Usuario fue a la documentación y volvió, posible falta de contexto en el paso 2.', source: 'sdk' },
    { type: 'form_abandon', severity: 'warning', page: '/onboarding', message: 'Abandono en el paso 3 (conectar workspace). 4 usuarios en la última hora.', selector: 'form#connect', source: 'extension' },
    { type: 'micro_survey', severity: 'warning', page: '/onboarding', message: 'Respuesta: "No entiendo qué es un workspace" (NPS 4)', source: 'sdk' },
    { type: 'rage_click', severity: 'warning', page: '/onboarding', message: 'Rage click en button.next-step deshabilitado sin explicación.', selector: 'button.next-step', source: 'sdk' },
  ],
  performance_degradation: [
    { type: 'slow_page', severity: 'warning', page: '/dashboard', message: 'Carga de 6.8s (p95). LCP degradado 3x contra ayer.', source: 'sdk' },
    { type: 'slow_page', severity: 'info', page: '/reports', message: 'Carga de 4.1s. Query de reportes sin índice.', source: 'googleanalytics' },
    { type: 'js_error', severity: 'critical', page: '/dashboard', message: 'Timeout: /api/metrics tardó más de 10s y fue cancelado.', selector: 'api/metrics', source: 'sentry' },
    { type: 'slow_page', severity: 'warning', page: '/search', message: 'Búsqueda tarda 5.2s en promedio. 30% de usuarios abandona antes del resultado.', source: 'posthog' },
    { type: 'u_turn', severity: 'info', page: '/reports -> /dashboard', message: 'Usuarios salen de /reports antes de que termine de cargar.', source: 'sdk' },
    { type: 'micro_survey', severity: 'info', page: '/dashboard', message: 'Respuesta: "La app está muy lenta hoy"', source: 'intercom' },
  ],
  survey_wave: [
    { type: 'micro_survey', severity: 'info', page: '/pricing', message: 'Respuesta: "Precios" — el plan Pro no aclara los límites.', source: 'sdk' },
    { type: 'micro_survey', severity: 'info', page: '/app', message: 'NPS: 9 — "Me encanta el resumen diario con IA"', source: 'sdk' },
    { type: 'micro_survey', severity: 'warning', page: '/integrations', message: 'Respuesta: "No encontré algo" — buscaba integración con Slack.', source: 'sdk' },
    { type: 'micro_survey', severity: 'info', page: '/app', message: 'NPS: 7 — "Está bien pero le faltan filtros"', source: 'sdk' },
    { type: 'micro_survey', severity: 'warning', page: '/pricing', message: 'NPS: 3 — "Muy caro para equipos chicos"', source: 'sdk' },
    { type: 'micro_survey', severity: 'info', page: '/demo', message: 'Respuesta: "Funcionalidad" — pide exportar a CSV.', source: 'extension' },
  ],
  social_backlash: [
    { type: 'js_error', severity: 'critical', page: '/login', message: 'OAuth callback falló: state mismatch (34 usuarios afectados).', selector: 'auth/callback', source: 'sentry' },
    { type: 'rage_click', severity: 'warning', page: '/login', message: 'Rage click en button#google-login (8 clicks). El popup no abre.', selector: 'button#google-login', source: 'sdk' },
    { type: 'micro_survey', severity: 'warning', page: '/login', message: 'Respuesta: "No puedo entrar con Google desde ayer"', source: 'intercom' },
    { type: 'form_abandon', severity: 'warning', page: '/login', message: 'Abandono del login con email tras 2 intentos fallidos.', selector: 'form#login', source: 'sdk' },
    { type: 'u_turn', severity: 'info', page: '/login -> /reset-password -> /login', message: 'Loop entre login y reset de contraseña, el mail de reset no llega.', source: 'sdk' },
  ],
  random_burst: [],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateScenario(id: ScenarioId, count = 5): Omit<FeedbackSignal, 'id' | 'timestamp'>[] {
  const source =
    id === 'random_burst'
      ? Object.values(pool).flat()
      : pool[id];

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, Math.min(count, shuffled.length));
  // random_burst puede repetir si el pool no alcanza
  while (chosen.length < count && source.length > 0) chosen.push(pick(source));
  return chosen;
}
