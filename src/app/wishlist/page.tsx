import type { Metadata } from 'next';
import WishlistPageClient from '@/components/pages/WishlistPageClient';

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Products you have saved to your wishlist.',
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
