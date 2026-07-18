import { fetchSocialReviews } from '@/lib/social';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reviews = await fetchSocialReviews();
  return Response.json({ reviews });
}
