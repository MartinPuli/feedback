export type SocialReview = {
  id: string;
  source: 'reddit' | 'twitter' | 'trustpilot' | 'g2' | 'capterra';
  title?: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
  timestamp: string;
  tags: string[];
};

function id() {
  return Math.random().toString(36).slice(2);
}

function sentiment(text: string): SocialReview['sentiment'] {
  const t = text.toLowerCase();
  const bad = ['malo', 'horrible', 'peor', 'error', 'bug', 'crash', 'lento', 'no sirve', 'mierda', 'basura', 'frustrante'];
  const good = ['bueno', 'excelente', 'genial', 'me encanta', 'increíble', 'rápido', 'útil', 'perfecto', 'brutal'];
  const b = bad.filter((w) => t.includes(w)).length;
  const g = good.filter((w) => t.includes(w)).length;
  if (b > g) return 'negative';
  if (g > b) return 'positive';
  return 'neutral';
}

const demoReviews: SocialReview[] = [
  {
    id: id(),
    source: 'reddit',
    content: 'La app está buena pero el checkout es una pesadilla, se queda cargando.',
    sentiment: 'negative',
    url: 'https://reddit.com/r/startups/comments/xyz',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ['checkout', 'performance'],
  },
  {
    id: id(),
    source: 'twitter',
    content: 'Me encanta la nueva feature, super fácil de usar 🚀',
    sentiment: 'positive',
    url: 'https://twitter.com/user/status/123',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ['feature', 'ux'],
  },
  {
    id: id(),
    source: 'trustpilot',
    content: 'El soporte tardó 3 días en responder. La app funciona bien igual.',
    sentiment: 'neutral',
    url: 'https://trustpilot.com/review/example',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    tags: ['support'],
  },
  {
    id: id(),
    source: 'g2',
    content: 'Muy buena herramienta, le falta integración con Notion.',
    sentiment: 'positive',
    url: 'https://g2.com/products/example/reviews',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    tags: ['integrations', 'feature request'],
  },
];

async function searchReddit(query: string): Promise<SocialReview[]> {
  try {
    const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=25`, {
      headers: { 'User-Agent': 'FeedbackLoop/0.1' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: { children?: Array<{ data?: { title?: string; selftext?: string; permalink?: string; created_utc?: number } }> } };
    return (data.data?.children || []).slice(0, 10).map((child) => {
      const d = child.data || {};
      const text = `${d.title || ''} ${d.selftext || ''}`;
      return {
        id: id(),
        source: 'reddit',
        title: d.title,
        content: text.slice(0, 280),
        sentiment: sentiment(text),
        url: d.permalink ? `https://reddit.com${d.permalink}` : undefined,
        timestamp: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : new Date().toISOString(),
        tags: ['reddit'],
      };
    });
  } catch (err) {
    console.error('Reddit search failed:', err);
    return [];
  }
}

async function searchTwitter(query: string): Promise<SocialReview[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=25`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error('Twitter fetch failed:', res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as { data?: Array<{ id: string; text: string; created_at?: string }> };
    return (data.data || []).slice(0, 10).map((t) => ({
      id: t.id,
      source: 'twitter',
      content: t.text.slice(0, 280),
      sentiment: sentiment(t.text),
      url: `https://twitter.com/i/web/status/${t.id}`,
      timestamp: t.created_at || new Date().toISOString(),
      tags: ['twitter'],
    }));
  } catch (err) {
    console.error('Twitter search failed:', err);
    return [];
  }
}

async function searchTrustpilot(brand: string): Promise<SocialReview[]> {
  // Trustpilot no tiene API pública sin key. Requiere TRUSTPILOT_API_KEY.
  const key = process.env.TRUSTPILOT_API_KEY;
  if (!key) return [];
  try {
    // Buscar unidad de negocio
    const search = await fetch(`https://api.trustpilot.com/v1/business-units/find?name=${encodeURIComponent(brand)}&apiKey=${key}`);
    if (!search.ok) return [];
    const unit = (await search.json()) as { id?: string };
    if (!unit.id) return [];
    const res = await fetch(`https://api.trustpilot.com/v1/business-units/${unit.id}/reviews?apiKey=${key}&limit=20`);
    if (!res.ok) return [];
    const data = (await res.json()) as { reviews?: Array<{ id: string; title?: string; text: string; createdAt: string; stars: number }> };
    return (data.reviews || []).map((r) => ({
      id: r.id,
      source: 'trustpilot',
      title: r.title,
      content: r.text.slice(0, 280),
      sentiment: r.stars <= 2 ? 'negative' : r.stars >= 4 ? 'positive' : 'neutral',
      url: `https://www.trustpilot.com/reviews/${r.id}`,
      timestamp: r.createdAt,
      tags: ['trustpilot'],
    }));
  } catch (err) {
    console.error('Trustpilot search failed:', err);
    return [];
  }
}

export async function fetchSocialReviews(): Promise<SocialReview[]> {
  const query = process.env.SOCIAL_SEARCH_QUERY || 'feedback app';
  const brand = process.env.BRAND_NAME || query;

  const results = await Promise.allSettled([
    searchReddit(query),
    searchTwitter(query),
    searchTrustpilot(brand),
  ]);

  const real = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  if (real.length === 0) return demoReviews;
  return real;
}
