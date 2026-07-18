import { getFeedbackSignals, ingestSignal, type FeedbackSignal } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const signals = await getFeedbackSignals();
  return Response.json({ signals });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<FeedbackSignal, 'id' | 'timestamp'>;
    const signal = await ingestSignal(body);
    return Response.json({ ok: true, signal });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
