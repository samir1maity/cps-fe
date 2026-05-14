'use client';

import React from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, LogIn } from 'lucide-react';
import ProductThumb from '@/components/ui/ProductThumb';
import { useCart, guestItemToCartItem } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { getCartItemImageKey } from '@/lib/utils/product';
import { CartItem } from '@/lib/types';

const CartPage: React.FC = () => {
  const { items, guestItems, isGuest, updateQuantity, removeFromCart, getTotalPrice, loading } = useCart();

  // Unified list: server items for logged-in users, converted guest items for guests
  const displayItems: CartItem[] = isGuest
    ? guestItems.map(guestItemToCartItem)
    : items;

  const isEmpty = displayItems.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] px-4 py-8 pb-28 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-13rem)] max-w-md items-center justify-center">
          <div className="w-full rounded-2xl bg-white/80 px-6 py-10 text-center shadow-sm ring-1 ring-stone-200/70 backdrop-blur">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
              <ShoppingBag className="h-10 w-10 text-stone-400" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-stone-600">Add some products to get started</p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-600)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] py-4 pb-24 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center sm:mb-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Shopping Cart</h1>
        </div>

        {/* Guest login banner */}
        {isGuest && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-amber-900">You're shopping as a guest</p>
              <p className="mt-0.5 text-sm text-amber-700">
                Login or create an account to save your cart and checkout.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                href={`/login?redirectTo=/cart`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-600)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href={`/register?redirectTo=/cart`}
                className="inline-flex items-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70">
              <div className="border-b border-stone-200/70 px-4 py-4 sm:px-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart Items ({displayItems.length})
                </h2>
              </div>
              <div className="divide-y divide-stone-200/70">
                {displayItems.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-shrink-0">
                        <ProductThumb
                          imageKey={getCartItemImageKey(item)}
                          alt={item.product.name}
                          className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl shrink-0"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.product.brand}
                          {item.colorId && item.product.colors?.length ? (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {item.product.colors.find((c) => String(c._id) === String(item.colorId))?.name}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900 mt-2">
                          {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      <div className="flex w-full items-center justify-between sm:w-auto sm:justify-start sm:space-x-3">
                        <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={loading}
                            className="p-2 text-gray-900 hover:bg-stone-100 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 text-sm font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={loading || !item.product.inStock}
                            className="p-2 text-gray-900 hover:bg-stone-100 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={loading}
                          className="ml-3 rounded-xl p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 sm:ml-0"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 lg:sticky lg:top-8 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{formatCurrency(getTotalPrice() * 0.08)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(getTotalPrice() * 1.08)}</span>
                  </div>
                </div>
              </div>

              {isGuest ? (
                <Link
                  href="/login?redirectTo=/cart"
                  className="mb-4 block w-full rounded-xl bg-[var(--brand-600)] px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
                >
                  Login to Checkout
                </Link>
              ) : (
                <Link
                  href="/checkout"
                  className="mb-4 block w-full rounded-xl bg-[var(--brand-600)] px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-[var(--brand-700)]"
                >
                  Proceed to Checkout
                </Link>
              )}

              <Link
                href="/"
                className="block w-full rounded-xl border border-stone-300 px-4 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-stone-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
