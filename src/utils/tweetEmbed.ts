// Build-time oEmbed fetch for TweetEmbed.astro, memoized per build so a
// tweet referenced from multiple posts (or re-rendered across pages in the
// same build) only hits the network once.
const cache = new Map<string, Promise<string | null>>();

export function getTweetEmbedHtml(url: string): Promise<string | null> {
  let promise = cache.get(url);
  if (!promise) {
    promise = fetchTweetEmbedHtml(url);
    cache.set(url, promise);
  }
  return promise;
}

async function fetchTweetEmbedHtml(url: string): Promise<string | null> {
  try {
    const endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&dnt=true`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = (await res.json()) as { html?: string };
    return data.html ?? null;
  } catch {
    return null;
  }
}
