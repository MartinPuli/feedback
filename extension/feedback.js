/*
  FeedbackLoop Smart SDK - v0.3
  Uso:
    <script src="/feedback.js" async data-survey="true"></script>
    <script src="/feedback.js" async data-survey="true" data-question="¿Qué te falta?" data-options="Precios,Funciones,Soporte"></script>
    <script src="/feedback.js" async data-survey="nps"></script>
*/
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[src*="feedback.js"]');
  const endpoint = script?.dataset?.endpoint || '/api/feedback';
  const surveyEnabled = script?.dataset?.survey === 'true' || script?.dataset?.survey === 'nps';
  const surveyQuestion =
    script?.dataset?.question ||
    (script?.dataset?.survey === 'nps' ? '¿Qué tan probable es que recomiendes esta app?' : '¿Qué te está costando de esta página?');
  const surveyOptions =
    script?.dataset?.survey === 'nps'
      ? []
      : (script?.dataset?.options || 'Precios,Funcionalidad,Diseño,No encontré algo,Otro').split(',');

  // Session id persistente para agrupar señales del mismo usuario
  let sessionId;
  try {
    sessionId = sessionStorage.getItem('fl-session');
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('fl-session', sessionId);
    }
  } catch {
    sessionId = Math.random().toString(36).slice(2);
  }

  // Dedupe: no enviar la misma señal repetida en una ventana corta
  const recentSends = new Map();
  const DEDUPE_WINDOW = 5000;

  function send(payload) {
    const key = payload.type + '|' + (payload.selector || payload.message);
    const now = Date.now();
    const last = recentSends.get(key);
    if (last && now - last < DEDUPE_WINDOW) return;
    recentSends.set(key, now);

    const body = JSON.stringify({
      ...payload,
      sessionId,
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

  // ========== Señales automáticas ==========
  const clickTracker = new Map();
  let lastPath = location.pathname;

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      const selector =
        el.tagName.toLowerCase() +
        (el.id ? '#' + el.id : el.className ? '.' + el.className.split(' ')[0] : '');
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
        trackBehavior('rage_click');
        return;
      }

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
          message: `Click muerto en ${selector}`,
          selector,
        });
        trackBehavior('dead_click');
      } else {
        trackBehavior('click');
      }
    },
    true
  );

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

  // Errores de red: intercepta fetch para detectar respuestas 5xx/fallos
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const isInternal = url.includes(endpoint);
    return originalFetch.apply(this, args).then(
      (res) => {
        if (!isInternal && res.status >= 500) {
          send({
            type: 'network_error',
            severity: 'critical',
            page: location.pathname,
            message: `Request falló: ${res.status} en ${url.slice(0, 120)}`,
            selector: url.slice(0, 120),
          });
        }
        return res;
      },
      (err) => {
        if (!isInternal) {
          send({
            type: 'network_error',
            severity: 'critical',
            page: location.pathname,
            message: `Request no completado: ${err?.message || 'network error'} en ${url.slice(0, 120)}`,
            selector: url.slice(0, 120),
          });
        }
        throw err;
      }
    );
  };

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

  // ========== Smart Surveys ==========
  const behavior = {
    clicks: 0,
    deadClicks: 0,
    rageClicks: 0,
    pages: new Set([location.pathname]),
    startTime: Date.now(),
    surveyShown: false,
  };

  function trackBehavior(action) {
    if (action === 'click') behavior.clicks++;
    if (action === 'dead_click') behavior.deadClicks++;
    if (action === 'rage_click') behavior.rageClicks++;

    if (surveyEnabled && !behavior.surveyShown) {
      const elapsed = Date.now() - behavior.startTime;
      const shouldAsk =
        behavior.rageClicks >= 1 ||
        behavior.deadClicks >= 2 ||
        (elapsed > 25000 && behavior.clicks >= 3);

      if (shouldAsk) {
        behavior.surveyShown = true;
        setTimeout(showSurvey, 500);
      }
    }
  }

  function showSurvey() {
    const root = document.createElement('div');
    root.id = 'feedbackloop-survey';
    const styles = {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '320px',
      background: '#ffffff',
      color: '#111827',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: '999999',
      border: '1px solid #e5e7eb',
    };
    Object.assign(root.style, styles);

    const isNps = script?.dataset?.survey === 'nps';

    let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <strong style="font-size:14px">${escapeHtml(surveyQuestion)}</strong>
      <button id="fl-close" style="background:none;border:none;cursor:pointer;font-size:18px;color:#6b7280">×</button>
    </div>`;

    if (isNps) {
      html += `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">`;
      for (let i = 0; i <= 10; i++) {
        html += `<button class="fl-nps" data-v="${i}" style="width:28px;height:28px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:12px">${i}</button>`;
      }
      html += `</div>`;
    } else {
      html += `<div style="display:flex;flex-direction:column;gap:8px">`;
      surveyOptions.forEach((opt) => {
        html += `<button class="fl-opt" style="text-align:left;padding:10px 12px;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;cursor:pointer;font-size:13px;color:#374151">${escapeHtml(opt)}</button>`;
      });
      html += `</div>`;
      html += `<div style="display:flex;gap:6px;margin-top:8px">
        <input id="fl-free" type="text" placeholder="O contanos con tus palabras..." style="flex:1;padding:8px 10px;border-radius:8px;border:1px solid #e5e7eb;font-size:12px;color:#374151;outline:none" />
        <button id="fl-send" style="padding:8px 12px;border-radius:8px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-size:12px;font-weight:600">Enviar</button>
      </div>`;
    }

    root.innerHTML = html;
    document.body.appendChild(root);

    const close = root.querySelector('#fl-close');
    close?.addEventListener('click', () => root.remove());

    function submitAnswer(message, severity) {
      send({ type: 'micro_survey', severity: severity || 'info', page: location.pathname, message });
      showThanks(root);
    }

    if (isNps) {
      root.querySelectorAll('.fl-nps').forEach((btn) => {
        btn.addEventListener('click', () => {
          const v = Number(btn.getAttribute('data-v'));
          submitAnswer(`NPS: ${v}`, v <= 6 ? 'warning' : 'info');
        });
      });
    } else {
      root.querySelectorAll('.fl-opt').forEach((btn) => {
        btn.addEventListener('click', () => submitAnswer(`Respuesta: ${btn.textContent}`));
      });
      const freeInput = root.querySelector('#fl-free');
      const sendBtn = root.querySelector('#fl-send');
      const sendFree = () => {
        const text = freeInput?.value?.trim();
        if (text) submitAnswer(`Respuesta libre: ${text}`);
      };
      sendBtn?.addEventListener('click', sendFree);
      freeInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendFree();
      });
    }
  }

  function showThanks(root) {
    root.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:4px">
      <span style="font-size:22px">💜</span>
      <div>
        <strong style="font-size:14px;display:block">¡Gracias por tu feedback!</strong>
        <span style="font-size:12px;color:#6b7280">Nos ayuda a mejorar el producto.</span>
      </div>
    </div>`;
    setTimeout(() => root.remove(), 2500);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Exit intent survey (solo desktop)
  document.addEventListener('mouseout', (e) => {
    if (surveyEnabled && !behavior.surveyShown && e.clientY < 10) {
      behavior.surveyShown = true;
      showSurvey();
    }
  });
})();
