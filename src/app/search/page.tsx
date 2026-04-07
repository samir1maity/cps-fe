import type { Metadata } from 'next';
import SearchPageClient from '@/components/pages/SearchPageClient';
import { buildMetadata, siteConfig } from '@/lib/seo';

type SearchPageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q;
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    return buildMetadata({
      title: `${normalizedQuery} | Search ${siteConfig.name}`,
      description: `Search ${siteConfig.name} for ${normalizedQuery}, handcrafted pottery, ceramic decor, artisan tableware, and gift-worthy handmade pieces.`,
      path: `/search?q=${encodeURIComponent(normalizedQuery)}`,
      keywords: [normalizedQuery, 'pottery search', 'ceramic products'],
    });
  }

  return buildMetadata({
    title: `Search Products | ${siteConfig.name}`,
    description:
      'Browse all handmade pottery, ceramic decor, and artisan homeware available at Creative Pottery Studio.',
    path: '/search',
    keywords: ['search pottery', 'shop ceramics', 'artisan home decor'],
  });
}

export default function SearchPage() {
  return <SearchPageClient />;
}
