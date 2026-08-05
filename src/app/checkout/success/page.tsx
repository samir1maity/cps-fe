'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, ShoppingBag } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const shortId = orderId.slice(-8).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-amber-50/40 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm px-8 py-10 text-center">

          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <CheckCircle2 className="h-8 w-8 text-[var(--brand-600)]" />
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Payment Successful!</h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            Your order has been placed and confirmed. We'll send you an email with the details.
          </p>

          {/* Order ID */}
          {shortId && (
            <div className="mt-6 inline-block bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">Order ID</p>
              <p className="font-mono text-sm font-semibold text-stone-700">#{shortId}</p>
            </div>
          )}

          {/* Steps */}
          <div className="mt-8 space-y-3 text-left">
            {[
              { icon: '📧', text: 'Confirmation email sent to your inbox' },
              { icon: '📦', text: "We'll start packing your order shortly" },
              { icon: '🚚', text: 'Shipping update will follow once dispatched' },
            ].map((step) => (
              <div key={step.text} className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">{step.icon}</span>
                <p className="text-sm text-stone-500">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/orders"
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] px-5 py-3 text-sm font-semibold text-white transition-colors"
            >
              <Package className="h-4 w-4" />
              View My Orders
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-700 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>

        </div>

        {/* Sub note */}
        <p className="mt-4 text-center text-xs text-stone-400">
          If your confirmation email doesn't arrive within a few minutes, check your spam folder.
        </p>

      </div>
    </div>
  );
}
