'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Product } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  productIds: Set<string>;
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (product: Product) => Promise<boolean>; // returns true if added
  isInWishlist: (productId: string) => boolean;
  getCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setProductIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await api.getWishlist(user.id);
      if (res.success && res.data) {
        // Backend returns an array of populated Product objects
        const ids = new Set(res.data.map((item: any) => item.id ?? item._id));
        setProductIds(ids as Set<string>);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!user) return;
    await api.addToWishlist(user.id, productId);
    setProductIds(prev => new Set([...prev, productId]));
  }, [user]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!user) return;
    await api.removeFromWishlist(productId);
    setProductIds(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, [user]);

  const toggleWishlist = useCallback(async (product: Product): Promise<boolean> => {
    const id = product.id;
    if (productIds.has(id)) {
      await removeFromWishlist(id);
      return false;
    } else {
      await addToWishlist(id);
      return true;
    }
  }, [productIds, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const getCount = useCallback(() => productIds.size, [productIds]);

  return (
    <WishlistContext.Provider value={{ productIds, loading, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, getCount }}>
      {children}
    </WishlistContext.Provider>
  );
};
