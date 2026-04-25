'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ScrollText,
  X,
  Eye,
  MapPin,
  CreditCard,
  Package,
  Hash,
  User as UserIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Order, OrderStatus, PaymentAuditLog } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  CONFIRMED:  'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED:    'bg-purple-100 text-purple-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
  REFUNDED:   'bg-gray-100 text-gray-700',
};

const LOG_LEVEL_STYLES: Record<PaymentAuditLog['level'], string> = {
  INFO: 'bg-blue-100 text-blue-700',
  WARN: 'bg-amber-100 text-amber-700',
  ERROR: 'bg-red-100 text-red-700',
};

const LOG_SCOPE_STYLES: Record<PaymentAuditLog['scope'], string> = {
  PAYMENT: 'bg-slate-100 text-slate-700',
  ORDER: 'bg-emerald-100 text-emerald-700',
  REFUND: 'bg-fuchsia-100 text-fuchsia-700',
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLogs, setOrderLogs] = useState<PaymentAuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsRefreshing, setLogsRefreshing] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminOrders(page, statusFilter || undefined);
    if (res.success && res.data) {
      setOrders(res.data);
      setHasMore(res.data.length >= 20);
    } else {
      toast.error(res.error ?? 'Failed to load orders');
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    if (newStatus === order.status) return;
    setUpdating(order.id);
    const res = await api.updateOrderStatus(order.id, newStatus);
    if (res.success) {
      toast.success('Order status updated');
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus as OrderStatus } : o)),
      );
    } else {
      toast.error(res.error ?? 'Failed to update status');
    }
    setUpdating(null);
  };

  const loadOrderLogs = useCallback(async (order: Order, silent = false) => {
    if (silent) {
      setLogsRefreshing(true);
    } else {
      setLogsLoading(true);
    }

    const res = await api.getAdminPaymentLogs({ orderId: order.id });
    if (res.success && res.data) {
      setOrderLogs(res.data.logs);
      setSelectedOrder(order);
    } else {
      toast.error(res.error ?? 'Failed to load order logs');
    }

    setLogsLoading(false);
    setLogsRefreshing(false);
  }, []);

  const closeLogsPanel = () => {
    setSelectedOrder(null);
    setOrderLogs([]);
    setLogsLoading(false);
    setLogsRefreshing(false);
  };

  const openOrderDetail = useCallback(async (order: Order) => {
    setDetailLoading(true);
    setDetailOrder(order);
    const res = await api.getOrder(order.id);
    if (res.success && res.data) {
      setDetailOrder(res.data);
    } else {
      toast.error(res.error ?? 'Failed to load order details');
    }
    setDetailLoading(false);
  }, []);

  const closeDetailModal = () => {
    setDetailOrder(null);
    setDetailLoading(false);
  };

  // Client-side search filter (by order id or customer name)
  const visible = search.trim()
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.user?.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : orders;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Manage Orders</h1>
          </div>
          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or customer…"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : visible.length === 0 ? (
            <div className="py-24 text-center text-gray-500 text-sm">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Update Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trace
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visible.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900">{order.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{order.user?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          disabled={updating === order.id}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0) + s.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => loadOrderLogs(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <ScrollText className="h-3.5 w-3.5" />
                          Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && (page > 1 || hasMore) && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close detail modal"
            onClick={closeDetailModal}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Order #{detailOrder.id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date(detailOrder.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[detailOrder.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {detailOrder.status}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {detailOrder.paymentMethod}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    detailOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700'
                    : detailOrder.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700'
                    : detailOrder.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    Payment: {detailOrder.paymentStatus}
                  </span>
                  {detailOrder.trackingNumber && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      <Hash className="h-3 w-3" />
                      {detailOrder.trackingNumber}
                    </span>
                  )}
                </div>

                {/* Customer */}
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    <UserIcon className="h-3.5 w-3.5" /> Customer
                  </h3>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                    <p className="font-medium text-gray-900">{detailOrder.user?.name ?? '—'}</p>
                    <p className="text-gray-500">{detailOrder.user?.email ?? ''}</p>
                    {detailOrder.user?.phone && (
                      <p className="text-gray-500">{detailOrder.user.phone}</p>
                    )}
                  </div>
                </section>

                {/* Order Items */}
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    <Package className="h-3.5 w-3.5" /> Items ({detailOrder.items?.length ?? 0})
                  </h3>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    {(detailOrder.items ?? []).map((item, idx) => (
                      <div
                        key={item.id ?? idx}
                        className={`flex items-center gap-4 px-4 py-3 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                      >
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name ?? `Product #${item.productId?.slice(-6)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          {formatCurrency(item.quantity * item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Price Summary */}
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    <CreditCard className="h-3.5 w-3.5" /> Price Summary
                  </h3>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(detailOrder.subtotal)}</span>
                    </div>
                    {detailOrder.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span>-{formatCurrency(detailOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatCurrency(detailOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{detailOrder.shipping === 0 ? 'Free' : formatCurrency(detailOrder.shipping)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatCurrency(detailOrder.total)}</span>
                    </div>
                  </div>
                </section>

                {/* Addresses */}
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                    <MapPin className="h-3.5 w-3.5" /> Addresses
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Shipping Address', addr: detailOrder.shippingAddress },
                      { label: 'Billing Address', addr: detailOrder.billingAddress },
                    ].map(({ label, addr }) => (
                      <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                        <p className="text-xs font-semibold text-gray-400 mb-1">{label}</p>
                        {addr ? (
                          <>
                            <p className="font-medium text-gray-900">{addr.firstName} {addr.lastName}</p>
                            <p className="text-gray-600">{addr.address1}</p>
                            {addr.address2 && <p className="text-gray-600">{addr.address2}</p>}
                            <p className="text-gray-600">{addr.city}, {addr.state} {addr.zipCode}</p>
                            <p className="text-gray-600">{addr.country}</p>
                            {addr.phone && <p className="text-gray-500 mt-1">{addr.phone}</p>}
                          </>
                        ) : (
                          <p className="text-gray-400">—</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {detailOrder.notes && (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Notes</h3>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      {detailOrder.notes}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-40">
          <button
            aria-label="Close logs panel"
            onClick={closeLogsPanel}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-hidden border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 bg-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <ScrollText className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">Order Logs</h2>
                        <p className="text-sm text-slate-500">
                          #{selectedOrder.id.slice(-8).toUpperCase()} • {selectedOrder.user?.name ?? 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Total {formatCurrency(selectedOrder.total)}
                      </span>
                      <span className={`rounded-full px-3 py-1 font-medium ${STATUS_STYLES[selectedOrder.status]}`}>
                        {selectedOrder.status}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                        {selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadOrderLogs(selectedOrder, true)}
                      disabled={logsLoading || logsRefreshing}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${logsRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button
                      onClick={closeLogsPanel}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                ) : orderLogs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <p className="text-sm font-medium text-slate-900">No logs found for this order.</p>
                    <p className="mt-1 text-sm text-slate-500">Payment, order, and refund events will appear here when they are recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${LOG_LEVEL_STYLES[log.level]}`}>
                                {log.level}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${LOG_SCOPE_STYLES[log.scope]}`}>
                                {log.scope}
                              </span>
                              <span className="font-mono text-xs text-slate-500">{log.event}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{log.message}</p>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                            <p className="mb-1 text-slate-400">Payment Reference</p>
                            <p className="break-all font-mono">{log.paymentId ?? log.razorpayOrderId ?? '—'}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                            <p className="mb-1 text-slate-400">Customer</p>
                            <p className="font-medium text-slate-800">{log.user?.name ?? selectedOrder.user?.name ?? '—'}</p>
                            <p>{log.user?.email ?? selectedOrder.user?.email ?? ''}</p>
                          </div>
                        </div>

                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Details</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                              {Object.entries(log.meta).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-slate-400">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
