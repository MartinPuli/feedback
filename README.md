# FeedbackLoop

MVP de una herramienta que detecta **feedback real y automático** en apps sin depender de encuestas largas.

## Qué hace

- Captura señales de frustración y problemas de UX: *rage clicks*, *dead clicks*, errores JS, abandono de formularios, U-turns, páginas lentas y micro-encuestas opcionales.
- Conecta con múltiples fuentes para unificar el feedback: **PostHog, Sentry, Google Analytics 4, Mixpanel, Amplitude, Intercom, Crisp** y más.
- Usa **IA** para generar un resumen diario accionable.
- Entrega un dashboard para startups y apps.
- **Extensión de Chrome** para recolectar feedback sin tocar código.

## Tecnología

- [Next.js](https://nextjs.org/) App Router
- Tailwind CSS
- Supabase para almacenamiento
- OpenAI para resúmenes (con fallback heurístico si no hay key)
- Vercel para deploy

## Empezar

1. Instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env.local
```

3. Completar `.env.local` con tus keys. Si no las tenés, el proyecto corre con **datos demo**.

4. Correr local:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Opciones de instalación

### 1. SDK Web

Agregá este script al `<head>` de tu web:

```html
<script src="/feedback.js" async data-survey="true"></script>
```

Para otro dominio, apuntá `data-endpoint` a tu API:

```html
<script src="https://tudominio.com/feedback.js" async data-endpoint="https://tudominio.com/api/feedback" data-survey="true"></script>
```

### 2. Extensión de Chrome

1. Descargar [`feedback-extension.zip`](./public/feedback-extension.zip).
2. Descomprimir en una carpeta.
3. Ir a `chrome://extensions`, activar modo desarrollador.
4. Cargar carpeta descomprimida.
5. Configurar el endpoint en el popup de la extensión (por defecto `http://localhost:3000/api/feedback`).

La extensión recolecta feedback de cualquier sitio web que visites.

## Eventos capturados

| Evento | Cuándo se dispara |
| --- | --- |
| `rage_click` | 3+ clicks en el mismo elemento en menos de 700ms |
| `dead_click` | Click en un elemento que no es interactivo |
| `js_error` | Errores de JS o promesas no manejadas |
| `form_abandon` | Usuario empieza un formulario y abandona la página |
| `u_turn` | Vuelve a la página anterior inmediatamente |
| `slow_page` | Tiempo de carga total mayor a 3s |
| `micro_survey` | Pregunta opcional al usuario |

## Integraciones

Seteá las variables de entorno correspondientes para activar cada conector:

- `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`
- `SENTRY_AUTH_TOKEN`, `SENTRY_ISSUES_URL`
- `GA4_PROPERTY_ID`, `GA4_CREDENTIALS`
- `MIXPANEL_PROJECT_ID`, `MIXPANEL_SERVICE_ACCOUNT`
- `AMPLITUDE_API_KEY`
- `INTERCOM_ACCESS_TOKEN`
- `CRISP_TOKEN_ID`, `CRISP_TOKEN_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (para persistir señales)
- `OPENAI_API_KEY` (resúmenes con GPT-4o-mini)

## Deploy en Vercel

La forma más fácil es conectar el repositorio en la UI de Vercel o, si tenés un token, usar Vercel CLI:

```bash
npx vercel --prod
```

Recordá agregar las variables de entorno en el dashboard de Vercel.

## Roadmap

- [ ] Conectores reales para todas las fuentes
- [ ] Alertas por Slack/Email
- [ ] Filtros y búsqueda en el dashboard
- [ ] SDK para React Native / Flutter
- [ ] Publicar extensión en Chrome Web Store
