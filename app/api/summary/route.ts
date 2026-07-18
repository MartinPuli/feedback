import { generateDailySummary } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = await generateDailySummary();
  return Response.json({ summary });
}
