/*
  FeedbackLoop SDK - v0.1
  Agregá este script a tu app para capturar feedback nativo.
  <script src="/feedback.js" async data-endpoint="/api/feedback"></script>
*/
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[src*="feedback.js"]');
  const endpoint = script?.dataset?.endpoint || '/api/feedback';

  function send(payload) {
    const body = JSON.stringify({
      ...payload,
      source: 'sdk',
      timestamp: new Date().toISOString(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  }

  // Rage/dead clicks
  const clickTracker = new Map();
  let lastPath = location.pathname;

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      const selector = el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.className ? '.' + el.className.split(' ')[0] : '');
      const now = Date.now();
      const history = clickTracker.get(selector) || [];
      history.push(now);
      const recent = history.filter((t) => now - t < 700);
      clickTracker.set(selector, recent);

      if (recent.length >= 3) {
        send({
          type: 'rage_click',
          severity: 'warning',
          page: location.pathname,
          message: `Rage click en ${selector} (${recent.length} clicks en <700ms)`,
          selector,
        });
        clickTracker.delete(selector);
        return;
      }

      // Dead click: no pointer cursor and not in a link/button/form
      const style = window.getComputedStyle(el);
      const isActionable =
        el.tagName === 'BUTTON' ||
        el.tagName === 'A' ||
        el.closest('button, a, label, input, textarea, select') ||
        style.cursor === 'pointer';

      if (!isActionable) {
        send({
          type: 'dead_click',
          severity: 'info',
          page: location.pathname,
          message: `Click muerto en ${selector} (elemento no interactivo)`,
          selector,
        });
      }
    },
    true
  );

  // JS errors
  window.addEventListener('error', (e) => {
    send({
      type: 'js_error',
      severity: 'critical',
      page: location.pathname,
      message: `${e.message} @ ${e.filename || 'inline'}:${e.lineno}`,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    send({
      type: 'js_error',
      severity: 'critical',
      page: location.pathname,
      message: e.reason?.message || e.reason?.toString() || 'Unhandled rejection',
    });
  });

  // U-turns
  window.addEventListener('popstate', () => {
    const current = location.pathname;
    if (lastPath && current === lastPath) {
      send({
        type: 'u_turn',
        severity: 'info',
        page: `${lastPath} -> ${current}`,
        message: 'Usuario volvió a la página anterior (U-turn)',
      });
    }
    lastPath = current;
  });

  // Form abandonment
  const forms = new WeakMap();
  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const form = target.closest('form');
      if (form && !forms.has(form)) {
        forms.set(form, { started: true });
      }
    },
    true
  );

  window.addEventListener('beforeunload', () => {
    document.querySelectorAll('form').forEach((form) => {
      const state = forms.get(form);
      if (state && state.started && !state.submitted) {
        send({
          type: 'form_abandon',
          severity: 'warning',
          page: location.pathname,
          message: `Formulario abandonado: ${form.id || form.name || 'sin nombre'}`,
          selector: form.id ? `#${form.id}` : 'form',
        });
      }
    });
  });

  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target instanceof HTMLFormElement ? e.target : null;
      if (form) {
        forms.set(form, { ...forms.get(form), submitted: true });
      }
    },
    true
  );

  // Slow page
  window.addEventListener('load', () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (!nav || nav.duration === undefined) return;
      if (nav.duration > 3000) {
        send({
          type: 'slow_page',
          severity: 'info',
          page: location.pathname,
          message: `Carga lenta: ${Math.round(nav.duration)}ms`,
        });
      }
    }, 0);
  });

  // Micro-survey opcional
  if (script?.dataset?.survey === 'true') {
    setTimeout(() => {
      const answer = window.prompt('¿Encontraste lo que buscabas? (sí / no)');
      if (answer) {
        send({
          type: 'micro_survey',
          severity: 'info',
          page: location.pathname,
          message: `Respuesta encuesta: ${answer}`,
        });
      }
    }, Number(script.dataset.surveyDelay || '30000'));
  }
})();
