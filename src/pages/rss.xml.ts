import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Arnab Sen',
    description: 'Writing on distributed systems, CS theory, math, and other things.',
    site: context.site ?? 'https://arnabsen.dev',
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.dek ?? '',
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
  });
}
