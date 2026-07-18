import { getFeedbackSignals, ingestSignal, type FeedbackSignal } from '@/lib/data';
import { clearSignals } from '@/lib/store';

export const dynamic = 'force-dynamic';

const VALID_SEVERITIES = new Set(['critical', 'warning', 'info']);
const MAX_MESSAGE_LENGTH = 500;
const MAX_BATCH = 20;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type IncomingSignal = Partial<Omit<FeedbackSignal, 'id'>>;

function normalize(raw: IncomingSignal): Omit<FeedbackSignal, 'id' | 'timestamp'> | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.type !== 'string' || !raw.type.trim()) return null;
  if (typeof raw.message !== 'string' || !raw.message.trim()) return null;

  const severity = VALID_SEVERITIES.has(raw.severity as string)
    ? (raw.severity as FeedbackSignal['severity'])
    : 'info';

  return {
    type: raw.type.trim().slice(0, 50),
    severity,
    page: typeof raw.page === 'string' ? raw.page.slice(0, 200) : '/',
    message: raw.message.trim().slice(0, MAX_MESSAGE_LENGTH),
    selector: typeof raw.selector === 'string' ? raw.selector.slice(0, 200) : undefined,
    source: typeof raw.source === 'string' && raw.source.trim() ? raw.source.slice(0, 30) : 'sdk',
    site: typeof raw.site === 'string' && raw.site.trim() ? raw.site.trim().slice(0, 100) : undefined,
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const signals = await getFeedbackSignals();
  return Response.json({ signals }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingSignal | IncomingSignal[];
    const items = Array.isArray(body) ? body.slice(0, MAX_BATCH) : [body];

    const valid = items.map(normalize).filter((s): s is NonNullable<ReturnType<typeof normalize>> => s !== null);

    if (valid.length === 0) {
      return Response.json(
        { ok: false, error: 'Payload inválido: se requiere al menos una señal con "type" y "message".' },
        { status: 400, headers: corsHeaders }
      );
    }

    const signals = await Promise.all(valid.map((s) => ingestSignal(s)));

    return Response.json(
      { ok: true, ingested: signals.length, signal: signals[0], signals },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function DELETE() {
  clearSignals();
  return Response.json({ ok: true, cleared: true }, { headers: corsHeaders });
}
