'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { CartItem, Product } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import {
  GuestCartItem,
  getGuestCart,
  addGuestItem,
  removeGuestItem,
  updateGuestItemQuantity,
  clearGuestCart,
} from '@/lib/utils/guestCart';

interface CartContextType {
  items: CartItem[];
  guestItems: GuestCartItem[];
  isGuest: boolean;
  loading: boolean;
  addToCart: (product: Product, quantity?: number, colorId?: string | null) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  mergeGuestCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error('useCart must be used within a CartProvider');
  return context;
};

// Converts a GuestCartItem to the CartItem shape for uniform rendering
export const guestItemToCartItem = (g: GuestCartItem): CartItem => ({
  id: `${g.productId}_${g.colorId ?? 'none'}`,
  productId: g.productId,
  product: g.product as unknown as Product,
  quantity: g.quantity,
  colorId: g.colorId,
  userId: 'guest',
});

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Keep a stable ref so callbacks always see the latest user without re-creating
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const isGuest = !user;

  const loadCart = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await api.getCart(currentUser.id);
      if (response.success && response.data) setItems(response.data);
    } catch {
      // silently fail — cart will show as empty
    } finally {
      setLoading(false);
    }
  }, []);

  const mergeGuestCart = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    const guest = getGuestCart();
    if (!guest.length) return;

    try {
      setLoading(true);
      await Promise.all(
        guest.map((item) =>
          api.addToCart(currentUser.id, item.productId, item.quantity, item.colorId)
        )
      );
      clearGuestCart();
      setGuestItems([]);
      // Reload server cart to get canonical state
      const response = await api.getCart(currentUser.id);
      if (response.success && response.data) setItems(response.data);
      toast.success(
        `${guest.length} item${guest.length > 1 ? 's' : ''} moved to your cart`,
        { icon: '🛒', duration: 3000 }
      );
    } catch {
      toast.error('Some items could not be moved to your cart');
    } finally {
      setLoading(false);
    }
  }, []);

  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const currId = user?.id ?? null;
    prevUserIdRef.current = currId;

    if (currId) {
      // Transition from guest → logged in: merge if there were guest items
      if (!prevId && getGuestCart().length > 0) {
        mergeGuestCart();
      } else {
        loadCart();
      }
    } else {
      setItems([]);
      setGuestItems(getGuestCart());
    }
  }, [user, loadCart, mergeGuestCart]);

  const addToCart = async (product: Product, quantity = 1, colorId: string | null = null) => {
    if (!user) {
      const updated = addGuestItem(product.id, quantity, colorId, {
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
        images: product.images,
        colors: product.colors,
        inStock: product.inStock,
      });
      setGuestItems(updated);
      toast.success('Added to cart');
      return;
    }

    try {
      setLoading(true);
      const response = await api.addToCart(user.id, product.id, quantity, colorId);
      if (response.success && response.data) {
        setItems(response.data);
        toast.success('Added to cart');
      } else {
        toast.error(response.error || 'Failed to add to cart');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) {
      // Guest itemId format: `${productId}_${colorId ?? 'none'}`
      const sep = itemId.indexOf('_');
      const productId = itemId.slice(0, sep);
      const colorIdPart = itemId.slice(sep + 1);
      const colorId = colorIdPart === 'none' ? null : colorIdPart;
      setGuestItems(removeGuestItem(productId, colorId));
      toast.success('Removed from cart');
      return;
    }

    try {
      setLoading(true);
      const response = await api.removeFromCart(itemId);
      if (response.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success('Removed from cart');
      } else {
        toast.error('Failed to remove item');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) {
      const sep = itemId.indexOf('_');
      const productId = itemId.slice(0, sep);
      const colorIdPart = itemId.slice(sep + 1);
      const colorId = colorIdPart === 'none' ? null : colorIdPart;
      if (quantity <= 0) {
        setGuestItems(removeGuestItem(productId, colorId));
      } else {
        setGuestItems(updateGuestItemQuantity(productId, colorId, quantity));
      }
      return;
    }

    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    try {
      setLoading(true);
      const response = await api.updateCartItem(itemId, quantity);
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        toast.error(response.message || response.error || 'Failed to update quantity');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    if (!user) {
      clearGuestCart();
      setGuestItems([]);
    } else {
      setItems([]);
    }
  };

  const getTotalItems = () =>
    isGuest
      ? guestItems.reduce((t, i) => t + i.quantity, 0)
      : items.reduce((t, i) => t + i.quantity, 0);

  const getTotalPrice = () =>
    isGuest
      ? guestItems.reduce((t, i) => t + i.product.price * i.quantity, 0)
      : items.reduce((t, i) => t + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        guestItems,
        isGuest,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        mergeGuestCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
