'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Truck,
  XCircle,
  Hash,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Order, OrderStatus, OrderMessage } from '@/lib/types';
import ProductThumb from '@/components/ui/ProductThumb';
import { formatCurrency } from '@/lib/utils/formatters';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; color: string; bg: string; border: string; dot: string }
> = {
  PENDING: {
    label: 'Awaiting Confirmation',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  CONFIRMED: {
    label: 'Order Confirmed',
    icon: <Package className="h-4 w-4" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  PROCESSING: {
    label: 'Preparing Your Order',
    icon: <Package className="h-4 w-4" />,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  SHIPPED: {
    label: 'Shipped',
    icon: <Truck className="h-4 w-4" />,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-400',
  },
  REFUNDED: {
    label: 'Refunded',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};


function StatusTimeline({ messages, orderCreatedAt }: { messages: OrderMessage[]; orderCreatedAt: Date }) {
  const all: OrderMessage[] = [
    { id: 'order-placed', message: 'Order placed successfully. Payment received.', timestamp: orderCreatedAt },
    ...messages,
  ];

  return (
    <div className="relative">
      <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-200" />

      <div className="space-y-0">
        {[...all].reverse().map((entry, idx) => {
          const isLatest = idx === 0;
          const ts = new Date(entry.timestamp);
          const dateStr = ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={entry.id} className="flex gap-4 pb-6 last:pb-0">
              <div className="relative flex-shrink-0 z-10">
                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isLatest ? 'border-blue-500 bg-blue-500 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-400'
                }`}>
                  {isLatest
                    ? <Package className="h-3.5 w-3.5" />
                    : <CheckCircle className="h-3.5 w-3.5 text-gray-400" />}
                </div>
              </div>

              <div className={`flex-1 rounded-2xl border p-4 transition-all ${
                isLatest ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${
                    isLatest ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isLatest ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    {isLatest ? 'Latest Update' : 'Update'}
                  </span>
                  <time className="text-[11px] text-gray-400 shrink-0">{dateStr} · {timeStr}</time>
                </div>
                <p className={`mt-1.5 text-sm leading-relaxed ${isLatest ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {entry.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrder = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    const res = await api.getOrder(id);
    if (res.success && res.data) {
      setOrder(res.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) void loadOrder();
  }, [user, id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your order</h2>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
          <Link href="/orders" className="text-blue-600 hover:underline text-sm">Back to orders</Link>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              Order Details
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => void loadOrder(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Current Status Banner */}
        <div className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
              {cfg.icon}
            </span>
            <div>
              <p className={`text-base font-bold ${cfg.color}`}>{cfg.label}</p>
              {order.messages && order.messages.length > 0 ? (
                <p className="text-sm text-gray-600 mt-0.5">
                  {order.messages[order.messages.length - 1].message}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-0.5">
                  {order.trackingNumber && `Tracking: ${order.trackingNumber}`}
                </p>
              )}
            </div>
          </div>

          {order.trackingNumber && (
            <div className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold border ${cfg.border} ${cfg.color} bg-white/60`}>
              <Hash className="h-3 w-3" />
              Tracking #{order.trackingNumber}
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div className="rounded-2xl bg-white border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-6">Status Timeline</p>
          <StatusTimeline
            messages={order.messages ?? []}
            orderCreatedAt={order.createdAt}
          />
        </div>

        {/* Items */}
        <div className="rounded-2xl bg-white border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
            Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
          </p>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={item.id ?? idx} className="flex items-center gap-4 rounded-xl bg-gray-50 p-3">
                <ProductThumb
                  imageKey={item.image || undefined}
                  alt={item.name ?? item.product?.name ?? ''}
                  className="h-14 w-14 rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.name ?? item.product?.name ?? `Product #${item.productId?.slice(-6)}`}
                  </p>
                  {item.colorName && (
                    <p className="text-xs text-gray-500">{item.colorName}</p>
                  )}
                  <p className="text-xs text-gray-500">Qty {item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {formatCurrency(item.quantity * item.price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary + Address */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white border border-gray-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Price Summary
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>−{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className={`mt-4 rounded-lg px-3 py-2 text-xs font-medium text-center ${
              order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700'
              : order.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-600'
              : order.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-700'
              : 'bg-amber-50 text-amber-700'
            }`}>
              {order.paymentStatus === 'PAID' ? 'Payment successful'
                : order.paymentStatus === 'REFUNDED' ? 'Refund processed'
                : order.paymentStatus === 'FAILED' ? 'Payment failed'
                : 'Payment pending'}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Delivery Address
            </p>
            {order.shippingAddress ? (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold text-gray-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p className="text-gray-600">{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p className="text-gray-600">{order.shippingAddress.address2}</p>}
                <p className="text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-gray-600">{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-gray-500 mt-1">{order.shippingAddress.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No address on file</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
