import type { Metadata } from 'next';
import ProductPageClient from '@/components/pages/ProductPageClient';
import { api } from '@/lib/api';
import { absoluteUrl, buildMetadata, buildProductDescription, siteConfig } from '@/lib/seo';

type ProductPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const response = await api.getProduct(params.id);

  if (!response.success || !response.data) {
    return buildMetadata({
      title: `Product Not Found | ${siteConfig.name}`,
      description: 'The requested product could not be found.',
      path: `/products/${params.id}`,
    });
  }

  const product = response.data;
  const metadata = buildMetadata({
    title: `${product.name} | ${siteConfig.name}`,
    description: buildProductDescription({
      name: product.name,
      description: product.description,
      category: product.category?.name,
      price: product.price,
    }),
    path: `/products/${params.id}`,
    keywords: [product.name, product.category?.name, product.subcategory?.name, 'handmade pottery']
      .filter(Boolean) as string[],
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'website',
      images: product.images[0]
        ? [
            {
              url: product.images[0],
              alt: product.name,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const response = await api.getProduct(params.id);
  const product = response.data;

  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images,
        category: product.category?.name,
        brand: product.brand || siteConfig.name,
        offers: {
          '@type': 'Offer',
          url: absoluteUrl(`/products/${params.id}`),
          priceCurrency: 'INR',
          price: product.price,
          availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      }
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <ProductPageClient />
    </>
  );
}
