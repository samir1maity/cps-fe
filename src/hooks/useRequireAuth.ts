'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { setRedirectUrl, setPendingAction, PendingAction, createLoginRedirect } from '@/lib/auth/redirects';
import toast from 'react-hot-toast';

export const useRequireAuth = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const requireAuth = (action?: PendingAction, customMessage?: string): boolean => {
    if (user) return true;

    setRedirectUrl(pathname || '/');
    if (action) setPendingAction(action);
    toast(customMessage || 'Please login to continue', { icon: '🔒' });
    router.push(createLoginRedirect(pathname || '/'));
    return false;
  };

  // Cart no longer requires auth — guests use localStorage cart
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const requireAuthForCart = (_productId?: string, _quantity?: number): boolean => true;

  const requireAuthForWishlist = (productId: string): boolean =>
    requireAuth(
      { type: 'add_to_wishlist', productId },
      'Please login to add items to wishlist'
    );

  // Checkout still requires login
  const requireAuthForCheckout = (): boolean =>
    requireAuth({ type: 'checkout' }, 'Please login to proceed to checkout');

  return {
    requireAuth,
    requireAuthForCart,
    requireAuthForWishlist,
    requireAuthForCheckout,
    isAuthenticated: !!user,
  };
};
