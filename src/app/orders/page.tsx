'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Clock,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import ProductThumb from '@/components/ui/ProductThumb';
import { formatCurrency } from '@/lib/utils/formatters';

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: 'Awaiting confirmation',
    description: 'Your order has been placed and is waiting for confirmation.',
    badge: 'bg-amber-100 text-amber-700',
    icon: <Clock className="h-4 w-4 text-amber-600" />,
  },
  CONFIRMED: {
    label: 'Order confirmed',
    description: 'The seller has confirmed your order.',
    badge: 'bg-blue-100 text-blue-700',
    icon: <Package className="h-4 w-4 text-blue-600" />,
  },
  PROCESSING: {
    label: 'Preparing your items',
    description: 'Your order is being packed for shipment.',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: <Package className="h-4 w-4 text-indigo-600" />,
  },
  SHIPPED: {
    label: 'On the way',
    description: 'Your order has been shipped and is on the way.',
    badge: 'bg-purple-100 text-purple-700',
    icon: <Truck className="h-4 w-4 text-purple-600" />,
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Your order has been delivered successfully.',
    badge: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="h-4 w-4 text-green-600" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'This order was cancelled.',
    badge: 'bg-red-100 text-red-700',
    icon: <XCircle className="h-4 w-4 text-red-600" />,
  },
  REFUNDED: {
    label: 'Refunded',
    description: 'The payment for this order has been refunded.',
    badge: 'bg-slate-200 text-slate-700',
    icon: <XCircle className="h-4 w-4 text-slate-600" />,
  },
};

const PAYMENT_METHOD_LABEL: Record<Order['paymentMethod'], string> = {
  RAZORPAY: 'Paid online',
  CASH_ON_DELIVERY: 'Cash on delivery',
};

const PAYMENT_STATUS_LABEL: Record<Order['paymentStatus'], string> = {
  PENDING: 'Payment pending',
  PAID: 'Payment successful',
  FAILED: 'Payment failed',
  REFUNDED: 'Refund completed',
};

const formatOrderDate = (value: Date | string): string =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatAddressPreview = (order: Order): string => {
  const shippingAddress = order.shippingAddress as any;
  if (!shippingAddress) {
    return 'Delivery details will appear here.';
  }

  const name = [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ');
  const location = [shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ');
  return [name, location].filter(Boolean).join(' • ');
};

const getItemSummary = (order: Order): string => {
  if (order.items.length === 1) {
    return order.items[0].product.name;
  }

  return `${order.items[0].product.name} + ${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}`;
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const response = await api.getOrders(user.id);
        if (response.success && response.data) {
          setOrders(response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [user]);

  const orderCountLabel = useMemo(() => {
    if (orders.length === 1) {
      return '1 order';
    }
    return `${orders.length} orders`;
  }, [orders.length]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your orders</h2>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/profile" className="text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
            <p className="mt-1 text-sm text-gray-600">{orderCountLabel}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm border border-gray-200">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h2>
            <p className="text-gray-600 mb-8">When you place an order, it will appear here with delivery and payment updates.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status];
              const itemSummary = getItemSummary(order);
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const addressPreview = formatAddressPreview(order);

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">
                          Placed on {formatOrderDate(order.createdAt)}
                        </p>
                        <h2 className="text-lg font-semibold text-gray-900">{itemSummary}</h2>
                        <p className="text-sm text-gray-600">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${status.badge}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-6">
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                      <div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {order.items.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="min-w-[88px] rounded-2xl border border-gray-100 bg-gray-50 p-2"
                            >
                              <ProductThumb
                                imageKey={item.image || undefined}
                                alt={item.name ?? item.product?.name ?? ''}
                                className="h-16 w-16 rounded-xl mx-auto"
                              />
                              <p className="mt-2 truncate text-xs font-medium text-gray-700">
                                {item.quantity} x {item.name ?? item.product?.name}
                              </p>
                              {item.colorName && (
                                <p className="truncate text-[10px] text-gray-400">{item.colorName}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Delivery status</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">{status.label}</p>
                            <p className="mt-1 text-sm text-gray-600">{status.description}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Delivery to</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900">{addressPreview}</p>
                            {order.trackingNumber && (
                              <p className="mt-1 text-sm text-gray-600">Tracking: {order.trackingNumber}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order summary</p>
                        <div className="mt-4 space-y-3 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex items-center justify-between">
                              <span>Discount</span>
                              <span className="text-green-600">- {formatCurrency(order.discount)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span>Tax</span>
                            <span>{formatCurrency(order.tax)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Shipping</span>
                            <span>{order.shipping > 0 ? formatCurrency(order.shipping) : 'Free'}</span>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-500">Total paid</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</p>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {PAYMENT_METHOD_LABEL[order.paymentMethod]} • {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                          </p>
                        </div>

                        <Link
                          href={`/orders/${order.id}`}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
