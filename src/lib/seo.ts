import type { Metadata } from 'next';

const SITE_NAME = 'Creative Pottery Studio';
const DEFAULT_TITLE = 'Handcrafted Pottery, Ceramic Decor, and Artisan Gifts';
const DEFAULT_DESCRIPTION =
  'Shop handcrafted pottery, ceramic home decor, tableware, and artisan gifts at Creative Pottery Studio. Explore unique handmade pieces for everyday living and thoughtful gifting.';

const sanitizeUrl = (value?: string | null) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

export const getSiteUrl = () =>
  sanitizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  sanitizeUrl(process.env.VERCEL_URL) ??
  'http://localhost:3000';

export const absoluteUrl = (path = '/') => new URL(path, getSiteUrl()).toString();

const normalizeText = (value?: string | null) =>
  value?.replace(/\s+/g, ' ').trim() || '';

const clip = (value: string, max = 160) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
};

export const siteConfig = {
  name: SITE_NAME,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

export const buildMetadata = ({
  title,
  description,
  path = '/',
  keywords,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}): Metadata => {
  const canonical = absoluteUrl(path);
  const normalizedDescription = clip(normalizeText(description));

  return {
    title,
    description: normalizedDescription,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: normalizedDescription,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: normalizedDescription,
    },
  };
};

export const buildCategoryDescription = (name: string, description?: string | null) => {
  const fallback = `Browse ${name.toLowerCase()} at ${SITE_NAME}. Find handmade pottery, artisan decor, and ceramic pieces selected for quality, craft, and everyday use.`;
  return clip(normalizeText(description) || fallback);
};

export const buildProductDescription = ({
  name,
  description,
  category,
  price,
}: {
  name: string;
  description?: string | null;
  category?: string | null;
  price?: number | null;
}) => {
  const parts = [
    normalizeText(description),
    category ? `Category: ${category}.` : '',
    typeof price === 'number' ? `Price: ${price}.` : '',
    `Shop ${name} at ${SITE_NAME}.`,
  ].filter(Boolean);

  return clip(parts.join(' '));
};
