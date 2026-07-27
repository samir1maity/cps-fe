'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, ShoppingCart, RefreshCw, HeadphonesIcon } from 'lucide-react';

export default function CheckoutFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reason = searchParams.get('reason') || 'Your payment could not be processed.';

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[linear-gradient(180deg,#fff1f2_0%,#f8fafc_30%,#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="p-8 sm:p-10">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <XCircle className="h-8 w-8" />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-500">
                Payment Failed
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Something went wrong
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                {reason}
              </p>
            </div>

            {orderId && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Order Reference</p>
                <p className="mt-1 font-mono text-sm text-slate-700">#{orderId.slice(-10).toUpperCase()}</p>
                <p className="mt-1 text-xs text-slate-500">
                  No payment was charged. You can try again or contact support with this reference.
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Back to Cart
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-950 px-8 py-6 text-white sm:px-10">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-red-300 mb-4">
              Why did this happen?
            </p>
            <div className="space-y-3 text-sm text-slate-300">
              <p>• Insufficient balance or card declined by your bank</p>
              <p>• Network timeout during payment processing</p>
              <p>• Payment session expired — please retry</p>
              <p>• Card not enabled for online transactions</p>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <HeadphonesIcon className="mt-0.5 h-4 w-4 text-red-300 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Need help?</p>
                <p className="text-sm text-slate-400 mt-1">
                  If money was deducted from your account, it will be automatically refunded within 5–7 business days.
                  Contact us with your order reference if you need assistance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
