import type { Metadata } from 'next';
import CategoryPageClient from '@/components/pages/CategoryPageClient';
import { api } from '@/lib/api';
import { buildCategoryDescription, buildMetadata, siteConfig } from '@/lib/seo';

type CategoryPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const response = await api.getCategory(params.slug);

  if (!response.success || !response.data) {
    return buildMetadata({
      title: `Category Not Found | ${siteConfig.name}`,
      description: 'The requested category could not be found.',
      path: `/categories/${params.slug}`,
    });
  }

  const category = response.data;

  return buildMetadata({
    title: `${category.name} | ${siteConfig.name}`,
    description: buildCategoryDescription(category.name, category.description),
    path: `/categories/${params.slug}`,
    keywords: [category.name, 'pottery category', 'handmade ceramics', 'artisan decor'],
  });
}

export default function CategoryPage() {
  return <CategoryPageClient />;
}
