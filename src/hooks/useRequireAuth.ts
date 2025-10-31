// src/hooks/useRequireAuth.ts
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { setRedirectUrl, setPendingAction, PendingAction, createLoginRedirect } from '@/lib/auth/redirects';
import toast from 'react-hot-toast';

/**
 * Hook to handle authentication requirements with redirect support
 */
export const useRequireAuth = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Requires authentication and redirects to login if needed
   * @param action Optional action to complete after login
   * @param customMessage Optional custom toast message
   */
  const requireAuth = (action?: PendingAction, customMessage?: string): boolean => {
    if (user) {
      return true;
    }

    // Store the current path for redirect after login
    setRedirectUrl(pathname || '/');

    // Store any pending action
    if (action) {
      setPendingAction(action);
    }

    // Show message
    toast.error(customMessage || 'Please login to continue');

    // Redirect to login
    router.push(createLoginRedirect(pathname || '/'));
    
    return false;
  };

  /**
   * Requires auth for adding to cart
   */
  const requireAuthForCart = (productId: string, quantity: number = 1): boolean => {
    return requireAuth(
      {
        type: 'add_to_cart',
        productId,
        quantity,
      },
      'Please login to add items to cart'
    );
  };

  /**
   * Requires auth for wishlist
   */
  const requireAuthForWishlist = (productId: string): boolean => {
    return requireAuth(
      {
        type: 'add_to_wishlist',
        productId,
      },
      'Please login to add items to wishlist'
    );
  };

  /**
   * Requires auth for checkout
   */
  const requireAuthForCheckout = (): boolean => {
    return requireAuth(
      {
        type: 'checkout',
      },
      'Please login to proceed to checkout'
    );
  };

  return {
    requireAuth,
    requireAuthForCart,
    requireAuthForWishlist,
    requireAuthForCheckout,
    isAuthenticated: !!user,
  };
};

