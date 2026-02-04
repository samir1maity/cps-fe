// src/app/cart/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils/formatters';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, loading } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Please login to view your cart</p>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart Items ({items.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-shrink-0">
                        <Image
                          src={item.product.images[0] || '/images/placeholder.jpg'}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="rounded-lg object-cover w-24 h-24"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.product.brand}
                        </p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900 mt-2">
                          {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start sm:space-x-3 w-full sm:w-auto">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={loading}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={loading || !item.product.inStock}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 ml-3 sm:ml-0"
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
            <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">
                    {formatCurrency(getTotalPrice() * 0.08)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>
                      {formatCurrency(getTotalPrice() * 1.08)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold block mb-4"
              >
                Proceed to Checkout
              </Link>
              
              <Link
                href="/"
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center font-semibold block"
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
