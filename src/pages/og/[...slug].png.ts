import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgCard, type OgCardProps } from '@/utils/ogCard';
import { readingTime } from '@/utils/readingTime';

// Non-post cards served from the same /og/<id>.png namespace. These ids are
// reserved — a blog post slugged `home`, `about`, or `resume` would collide.
const PAGE_CARDS: Record<string, OgCardProps> = {
  home: {
    eyebrowLeft: 'ARNABSEN.DEV',
    eyebrowRight: 'SOFTWARE ENGINEER · GOOGLE',
    title: 'Arnab Sen',
    dek: 'Writing on distributed systems, CS theory, and math — mostly to figure out what I actually think about them.',
    tags: ['writing', 'papershelf', 'résumé'],
    seed: 'home',
  },
  about: {
    eyebrowLeft: 'ARNAB SEN · ABOUT',
    eyebrowRight: 'ARNABSEN.DEV',
    title: "Hi, I'm Arnab.",
    dek: 'Software engineer at Google working on ads machine learning; competitive programmer and occasional CTF player.',
    tags: ['google', 'ads-ml', 'competitive-programming'],
    seed: 'about',
  },
  resume: {
    eyebrowLeft: 'ARNAB SEN · RÉSUMÉ',
    eyebrowRight: 'ARNABSEN.DEV',
    title: 'Résumé',
    dek: 'Software Engineer (L4) at Google, ads machine learning. Previously interned at Google, GMetri, Cypherock, and Summer of Bitcoin.',
    tags: ['google', 'ml', 'c++'],
    seed: 'resume',
  },
};

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const dateLabel = (date: Date) =>
    date
      .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      .toUpperCase();

  const postPaths = posts.map((post) => ({
    params: { slug: post.id },
    props: {
      eyebrowLeft: 'ARNAB SEN · WRITING',
      eyebrowRight: `${dateLabel(post.data.date)} · ${readingTime(post.body ?? '', post.data.readingTimeOverride)} MIN`,
      title: post.data.title,
      dek: post.data.dek ?? '',
      tags: post.data.tags,
      seed: post.id,
    } satisfies OgCardProps,
  }));

  const pagePaths = Object.entries(PAGE_CARDS).map(([id, props]) => ({
    params: { slug: id },
    props,
  }));

  return [...postPaths, ...pagePaths];
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgCard(props as OgCardProps);
  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
