import { ingestSignal } from '@/lib/data';
import { generateScenario, scenarios, type ScenarioId } from '@/lib/scenarios';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ scenarios });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { scenario?: string; count?: number };
    const id = body.scenario as ScenarioId | undefined;

    if (!id || !scenarios.some((s) => s.id === id)) {
      return Response.json(
        { ok: false, error: `Escenario inválido. Opciones: ${scenarios.map((s) => s.id).join(', ')}` },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(body.count ?? 5, 1), 20);
    const templates = generateScenario(id, count);
    const signals = await Promise.all(templates.map((t) => ingestSignal(t)));

    return Response.json({ ok: true, scenario: id, generated: signals.length, signals });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
