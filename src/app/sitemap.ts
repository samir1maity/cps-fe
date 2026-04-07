import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categoriesResponse;
  let productsResponse;

  try {
    [categoriesResponse, productsResponse] = await Promise.all([
      api.getCategories(),
      api.getProducts({ limit: 100 }),
    ]);
  } catch {
    categoriesResponse = { data: [] };
    productsResponse = { data: [] };
  }

  const categoryEntries =
    categoriesResponse.data?.flatMap((category) => {
      const routes: MetadataRoute.Sitemap = [
        {
          url: absoluteUrl(`/categories/${category.slug}`),
          changeFrequency: 'weekly',
          priority: 0.8,
        },
      ];

      for (const child of category.children ?? []) {
        routes.push({
          url: absoluteUrl(`/categories/${category.slug}/${child.slug}`),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }

      return routes;
    }) ?? [];

  const productEntries =
    productsResponse.data?.map((product) => ({
      url: absoluteUrl(`/products/${product.id}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) ?? [];

  return [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/search'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
