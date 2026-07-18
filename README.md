# FeedbackLoop

MVP de una herramienta que detecta **feedback real y automático** en apps sin depender de encuestas largas.

## Qué hace

- Captura señales de frustración y problemas de UX: *rage clicks*, *dead clicks*, errores JS, abandono de formularios, U-turns, páginas lentas y micro-encuestas inteligentes.
- Conecta con múltiples fuentes: **PostHog, Sentry, Google Analytics 4, Mixpanel, Amplitude, Intercom, Crisp** y más.
- **Social listener**: busca reseñas y menciones en **Reddit, Twitter/X, Trustpilot, G2, Capterra**.
- **IA** que resume diariamente el feedback y sugiere acciones.
- Entrega un dashboard en tiempo real.
- **SDK web** y **extensión de Chrome** para recolectar feedback sin tocar código.

## Tecnología

- [Next.js](https://nextjs.org/) App Router
- Tailwind CSS
- Supabase para almacenamiento (fallback en memoria para demo local)
- OpenAI para resúmenes (con fallback heurístico)
- Vercel para deploy

## Empezar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) para el dashboard y [http://localhost:3000/demo](http://localhost:3000/demo) para probar el SDK.

Si no completás las keys, el proyecto corre con **datos demo** y persiste señales en memoria (perfecto para probar local).

## Opciones de recolección

### 1. SDK Web (1 línea)

Funciona en **cualquier web externa** — el endpoint se autodetecta del origen del script. Andá a `/connect` para generar el snippet y verificar la conexión en vivo:

```html
<script src="https://TU-FEEDBACKLOOP.vercel.app/feedback.js" async data-survey="true"></script>
```

En la propia app basta con `src="/feedback.js"`. Con `data-site="mi-app"` podés nombrar el sitio (default: hostname).

Sin `data-question`, las micro-encuestas son **contextuales**: la pregunta y las opciones (tipo radio, un tap) cambian según el comportamiento detectado — rage click ("¿Qué intentabas hacer recién?"), dead clicks, usuario dando vueltas o exit intent. Así el feedback llega en el momento justo y de todos los usuarios, no solo de los que llenan formularios.

Con pregunta personalizada:

```html
<script
  src="/feedback.js"
  async
  data-survey="true"
  data-question="¿Qué te falta para decidirte?"
  data-options="Precios,Funciones,Soporte,No lo sé"
></script>
```

NPS:

```html
<script src="/feedback.js" async data-survey="nps"></script>
```

Las micro-encuestas se disparan automáticamente ante:
- Rage clicks
- 2+ dead clicks
- 25 segundos + 3 clics en la página
- Exit intent (cursor sale por arriba)

### 2. Extensión de Chrome

1. Descargar [`feedback-extension.zip`](./public/feedback-extension.zip).
2. Descomprimir.
3. Ir a `chrome://extensions`, activar modo desarrollador y cargar la carpeta.
4. Configurar el endpoint en el popup.

### 3. Conectores

Seteá las variables de entorno para activar cada fuente (ver `.env.example`).

## Demo integrado

La ruta `/demo` es una app de prueba con botones para disparar:
- Rage clicks
- Dead clicks
- Errores JS
- Abandono de formulario

El dashboard se actualiza automáticamente cada 5 segundos y muestra las señales que generás en el demo.

## Deploy en Vercel

Con token:

```bash
npx vercel --prod
```

O conectá el repo `MartinPuli/feedback` desde la UI de Vercel. Agregá las variables de entorno ahí.

## Roadmap

- [ ] Conectores reales con tests
- [ ] Alertas Slack/Email
- [ ] Filtros y búsqueda avanzada
- [ ] SDK React Native / Flutter
- [ ] Publicar extensión en Chrome Web Store
