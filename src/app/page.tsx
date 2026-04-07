import type { Metadata } from 'next';
import HomePageClient from '@/components/pages/HomePageClient';
import { buildMetadata, siteConfig } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} | ${siteConfig.title}`,
  description: siteConfig.description,
  path: '/',
  keywords: [
    'handcrafted pottery',
    'ceramic home decor',
    'artisan gifts',
    'pottery studio',
    'handmade ceramics',
  ],
});

export default function HomePage() {
  return <HomePageClient />;
}
