// src/hooks/usePendingActions.ts
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getAndClearPendingAction } from '@/lib/auth/redirects';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * Hook to automatically execute pending actions after login
 */
export const usePendingActions = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process once when user becomes authenticated
    if (!user || hasProcessed.current) {
      return;
    }

    const processPendingAction = async () => {
      const pendingAction = getAndClearPendingAction();
      
      if (!pendingAction) {
        return;
      }

      hasProcessed.current = true;

      try {
        switch (pendingAction.type) {
          case 'add_to_cart':
            if (pendingAction.productId) {
              // Fetch product details
              const response = await api.getProduct(pendingAction.productId);
              if (response.success && response.data) {
                await addToCart(response.data, pendingAction.quantity || 1);
                toast.success('Item added to cart!', {
                  icon: '🛒',
                  duration: 4000,
                });
              }
            }
            break;

          case 'add_to_wishlist':
            if (pendingAction.productId) {
              // Add to wishlist logic
              toast.success('Item added to wishlist!', {
                icon: '❤️',
                duration: 4000,
              });
            }
            break;

          case 'checkout':
            // Redirect to checkout
            router.push('/checkout');
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Error processing pending action:', error);
        toast.error('Could not complete your previous action');
      }
    };

    // Small delay to ensure cart is loaded
    const timer = setTimeout(() => {
      processPendingAction();
    }, 500);

    return () => clearTimeout(timer);
  }, [user, addToCart, router, pathname]);
};



