'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Home,
  MapPin,
  Package,
  Receipt,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import ProductThumb from '@/components/ui/ProductThumb';

const statusCopy = (mode: string | null) => {
  if (mode === 'cod') {
    return {
      headline: 'Order placed successfully',
      subline: 'Your order is confirmed. Pay when it arrives at your doorstep.',
      accent: 'Cash on Delivery',
    };
  }

  return {
    headline: 'Payment successful',
    subline: 'Your payment is complete and the order is now confirmed.',
    accent: 'Paid Online',
  };
};

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const mode = searchParams.get('mode');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.replace('/orders');
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      const response = await api.getOrder(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        router.replace('/orders');
      }
      setLoading(false);
    };

    void loadOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-10 shadow-sm">
            <div className="flex items-center justify-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const copy = statusCopy(mode);
  const shippingAddress = order.shippingAddress as any;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[linear-gradient(180deg,#eefbf3_0%,#f8fafc_30%,#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="p-8 sm:p-10">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                  {copy.accent}
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {copy.headline}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  {copy.subline}
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Order ID</p>
                  <p className="mt-2 font-mono text-sm text-slate-700">#{order.id.slice(-10).toUpperCase()}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Amount</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(order.total)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Payment</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{order.paymentMethod.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-slate-500">{order.paymentStatus}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  View My Orders
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Continue Shopping
                  <ShoppingBag className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-950 p-8 text-white lg:border-l lg:border-t-0">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-300">Next steps</p>
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-xl bg-white/10 p-2"><Receipt className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-semibold">Confirmation sent</p>
                        <p className="text-sm text-slate-300">Your order is saved and ready for processing.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-xl bg-white/10 p-2"><Package className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-semibold">Preparation starts</p>
                        <p className="text-sm text-slate-300">The seller will now pack your items for dispatch.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-xl bg-white/10 p-2"><Truck className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-semibold">Track from orders</p>
                        <p className="text-sm text-slate-300">Shipping updates will appear in your order history.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Delivery Address</p>
                  <div className="mt-3 flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <div className="space-y-1 text-sm text-slate-200">
                      <p className="font-semibold">{shippingAddress?.firstName} {shippingAddress?.lastName}</p>
                      <p>{shippingAddress?.address1}</p>
                      {shippingAddress?.address2 && <p>{shippingAddress.address2}</p>}
                      <p>{shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.zipCode}</p>
                      <p>{shippingAddress?.country}</p>
                      <p>{shippingAddress?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Items in this order</h2>
            </div>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                  <ProductThumb
                    imageKey={item.product.images[0]}
                    alt={item.product.name}
                    className="h-16 w-16 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{item.product.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Qty {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>- {formatCurrency(order.discount || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span>{formatCurrency(order.tax || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping || 0)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total Paid</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <Home className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-900">Need anything else?</p>
                  <p className="mt-1">You can track this order, review status updates, and access purchase history from your orders page.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
