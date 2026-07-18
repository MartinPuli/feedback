'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DemoPage() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/feedback.js';
    script.async = true;
    script.dataset.survey = 'true';
    script.dataset.question = '¿Qué te costó de esta página?';
    script.dataset.options = 'Precios,Funcionalidad,Diseño,No encontré algo,Otro';
    document.head.appendChild(script);

    const interval = setInterval(() => {
      fetch('/api/feedback')
        .then((r) => r.json())
        .then((data) => {
          setEvents(data.signals?.slice(0, 5).map((s: { type: string; message: string }) => `${s.type}: ${s.message}`) || []);
        });
    }, 2000);

    return () => {
      clearInterval(interval);
      script.remove();
    };
  }, []);

  function triggerError() {
    const obj = undefined;
    // @ts-expect-error test error
    console.log(obj.id);
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Demo App</h1>
            <p className="text-sm text-zinc-500">Interaccioná y mirá el dashboard.</p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Ir al dashboard
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">1. Rage click</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Hacé 3+ clicks rápidos en este botón (no hace nada a propósito).
          </p>
          <button className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg font-medium">
            Descargar reporte
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">2. Dead click</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Click en esta área gris (no es un botón).</p>
          <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-sm text-zinc-500">
            Click acá
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">3. Error JS</h2>
          <button
            onClick={triggerError}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Disparar error
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">4. Abandono de formulario</h2>
          <form className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
            />
            <p className="text-sm text-zinc-500">No envíes el formulario; salí de la página o navegá a otra.</p>
          </form>
        </div>

        <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Señales recientes recibidas</h2>
          <ul className="space-y-2 text-sm font-mono">
            {events.length === 0 && <li className="text-zinc-500">Esperando interacciones...</li>}
            {events.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
