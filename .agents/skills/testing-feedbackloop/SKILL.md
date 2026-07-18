---
name: testing-feedbackloop
description: Test the FeedbackLoop dashboard, demo page, SDK and APIs end-to-end. Use when verifying changes to signal ingestion, the /demo page, feedback.js, or the dashboard.
---

# Testing FeedbackLoop

## Setup
- `npm install && npm run dev` → dashboard en http://localhost:3000, demo en http://localhost:3000/demo.
- Sin keys (.env) la app corre con datos demo y persiste señales en memoria — suficiente para todo el testing local.
- Lint: `npm run lint`. Build: `npm run build`.
- Los PRs despliegan un preview en Vercel (link en el comentario del bot de Vercel del PR) que también sirve para testear, pero la memoria del servidor puede resetearse entre requests serverless — preferí localhost para flujos que dependen del store en memoria.

## Rutas clave de testeo
- `POST /api/feedback` — ingesta (una señal o array). Payload inválido (`{}`) debe dar 400. `DELETE` limpia la memoria; el feed vuelve a mostrar datos demo de fallback (esperado, no es un bug).
- `POST /api/simulate {scenario, count}` — genera situaciones realistas; `GET` lista los escenarios. Escenarios definidos en `lib/scenarios.ts`.
- `/demo` — panel "Simulador de situaciones", triggers manuales (rage click, dead click, error JS, slow page, U-turn, abandono de formulario) y feed "Señales en vivo" (refresca cada 2s).
- Dashboard `/` — botón "🎬 Simular señales" (random_burst), filtros, resumen IA (heurístico sin OPENAI_API_KEY).

## Tips
- El rage click requiere 3+ clicks en <700ms sobre el mismo selector — clicks consecutivos rápidos con computer-use funcionan.
- La micro-encuesta del SDK aparece sola tras rage clicks / 2 dead clicks / 25s+3 clicks / exit-intent; podría tapar elementos abajo a la derecha — cerrala o respondela antes de seguir.
- El SDK dedupea señales idénticas en ventana de 5s; si repetís una acción no esperes señales duplicadas inmediatas.
- `public/feedback.js` y `extension/feedback.js` deben mantenerse idénticos; regenerar `public/feedback-extension.zip` si cambia la extensión.

## Devin Secrets Needed
- Ninguno para testing local. Opcionales: OPENAI_API_KEY (resumen IA real), SUPABASE_URL/SUPABASE_ANON_KEY (persistencia), credenciales de conectores (PostHog, Sentry, etc.) si se quieren probar conectores reales.
