import type { Metadata } from 'next';
import SubcategoryPageClient from '@/components/pages/SubcategoryPageClient';
import { api } from '@/lib/api';
import { buildCategoryDescription, buildMetadata, siteConfig } from '@/lib/seo';

type SubcategoryPageProps = {
  params: {
    slug: string;
    subcategory: string;
  };
};

export async function generateMetadata({ params }: SubcategoryPageProps): Promise<Metadata> {
  const categoriesResponse = await api.getCategories();
  const category = categoriesResponse.data?.find((item) => item.slug === params.slug);
  const subcategory = category?.children?.find((item) => item.slug === params.subcategory);

  if (!category || !subcategory) {
    return buildMetadata({
      title: `Collection Not Found | ${siteConfig.name}`,
      description: 'The requested collection could not be found.',
      path: `/categories/${params.slug}/${params.subcategory}`,
    });
  }

  return buildMetadata({
    title: `${subcategory.name} | ${category.name} | ${siteConfig.name}`,
    description: buildCategoryDescription(
      `${subcategory.name} ${category.name}`,
      subcategory.description || category.description
    ),
    path: `/categories/${params.slug}/${params.subcategory}`,
    keywords: [subcategory.name, category.name, 'ceramic collection', 'handmade pottery'],
  });
}

export default function SubcategoryPage() {
  return <SubcategoryPageClient />;
}
