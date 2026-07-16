import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

const posts = await getCollection('blog', ({ data }) => !data.draft);

const pages = Object.fromEntries(
  posts.map((post) => [
    post.id,
    {
      title: post.data.title,
      description: post.data.dek ?? '',
    },
  ]),
);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page: (typeof pages)[string]) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[251, 250, 247]],
    border: { color: [140, 47, 38], width: 4 },
    padding: 80,
    font: {
      title: {
        color: [27, 30, 36],
        size: 64,
        weight: 'SemiBold',
        lineHeight: 1.2,
      },
      description: {
        color: [74, 78, 88],
        size: 32,
      },
    },
  }),
});
