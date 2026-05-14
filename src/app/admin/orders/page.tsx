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
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Order, OrderItem, OrderStatus, PaymentAuditLog } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { useSignedUrls } from '@/lib/hooks/useSignedUrls';
import toast from 'react-hot-toast';

function OrderItemsList({ items, onProductClick }: { items: OrderItem[]; onProductClick: (productId: string) => void }) {
  const rawKeys = items.map((i) => {
    const key = i.image ?? i.product?.images?.[0] ?? '';
    return key.startsWith('http') ? '' : key;
  });
  const signedUrls = useSignedUrls(rawKeys);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {items.map((item, idx) => {
        const rawKey = rawKeys[idx];
        const rawImage = item.image ?? item.product?.images?.[0] ?? '';
        const src = rawKey ? signedUrls[idx] : rawImage;
        const productId = item.product?.id ?? item.productId;
        return (
          <div
            key={item.id ?? idx}
            className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
            onClick={() => productId && onProductClick(productId)}
          >
            {src ? (
              <img
                src={src}
                alt={item.name ?? item.product?.name}
                className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                {item.name ?? item.product?.name ?? `Product #${item.productId?.slice(-6)}`}
              </p>
              <p className="text-xs text-gray-500">
                Qty: {item.quantity} × {formatCurrency(item.price)}
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
              {formatCurrency(item.quantity * item.price)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

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

// Human-readable labels for each event code
const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED_COD:               'Order placed (Cash on Delivery)',
  ORDER_STATUS_UPDATED:            'Status updated by admin',
  ORDER_CANCELLED:                 'Order cancelled by customer',
  RAZORPAY_ORDER_CREATED:          'Razorpay checkout initiated',
  PAYMENT_VERIFIED:                'Payment verified',
  PAYMENT_CAPTURED_WEBHOOK:        'Payment captured (webhook)',
  PAYMENT_AUTHORIZED_WEBHOOK:      'Payment authorised (webhook)',
  PAYMENT_FAILED_WEBHOOK:          'Payment failed (webhook)',
  PAYMENT_VERIFICATION_REJECTED:   'Payment verification rejected',
  PAYMENT_SIGNATURE_INVALID:       'Invalid payment signature',
  PAYMENT_PROVIDER_STATE_INVALID:  'Provider state mismatch',
  PAYMENT_CAPTURE_WEBHOOK_MISMATCH:'Webhook amount mismatch',
  REFUND_COMPLETED:                'Refund processed',
  REFUND_FAILED:                   'Refund failed',
};

// Meta key labels for display
const META_KEY_LABELS: Record<string, string> = {
  total:           'Amount',
  amount:          'Amount',
  amountInPaise:   'Amount (paise)',
  itemCount:       'Items',
  status:          'New status',
  source:          'Source',
  reason:          'Reason',
  paymentStatus:   'Payment status',
  trackingNumber:  'Tracking #',
  updatedBy:       'Updated by',
  currency:        'Currency',
  providerStatus:  'Provider status',
  providerAmount:  'Provider amount',
  expectedAmount:  'Expected amount',
};

function InfoCell({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-xs">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className={`text-slate-700 break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  );
}

function LogCard({ log }: { log: PaymentAuditLog }) {
  const isPayment = log.scope === 'PAYMENT';
  const isRefund  = log.scope === 'REFUND';

  const hasPaymentRef = !!(log.paymentId || log.razorpayOrderId);
  const hasRefundRef  = !!log.refundId;


  const metaEntries = log.meta ? Object.entries(log.meta).filter(([, v]) => v != null && v !== '') : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900 leading-snug">
          {EVENT_LABELS[log.event] ?? log.message}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {log.level !== 'INFO' && (
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${LOG_LEVEL_STYLES[log.level]}`}>
              {log.level}
            </span>
          )}
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${LOG_SCOPE_STYLES[log.scope]}`}>
            {log.scope}
          </span>
          <time className="text-[11px] text-slate-400">
            {new Date(log.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short',
              hour: '2-digit', minute: '2-digit',
            })}
          </time>
        </div>
      </div>

      {/* Context cells — only shown when relevant */}
      {(hasPaymentRef || hasRefundRef || metaEntries.length > 0) && (
        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Payment reference — only for PAYMENT scope */}
            {isPayment && hasPaymentRef && (
              <InfoCell
                label={log.paymentId ? 'Payment ID' : 'Razorpay Order ID'}
                value={(log.paymentId ?? log.razorpayOrderId)!}
                mono
              />
            )}

            {/* Both IDs when both present (e.g. verified event) */}
            {isPayment && log.paymentId && log.razorpayOrderId && (
              <InfoCell label="Razorpay Order ID" value={log.razorpayOrderId} mono />
            )}

            {/* Refund ID — only for REFUND scope */}
            {isRefund && hasRefundRef && (
              <InfoCell label="Refund ID" value={log.refundId!} mono />
            )}


          </div>

          {/* Meta details */}
          {metaEntries.length > 0 && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                {metaEntries.map(([key, value]) => (
                  <div key={key}>
                    <span className="text-slate-400">{META_KEY_LABELS[key] ?? key}:</span>{' '}
                    <span className="font-medium text-slate-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusConfirmModal({
  order,
  newStatus,
  onConfirm,
  onCancel,
}: {
  order: Order;
  newStatus: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const from = order.status.charAt(0) + order.status.slice(1).toLowerCase();
  const to   = newStatus.charAt(0) + newStatus.slice(1).toLowerCase();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Cancel" onClick={onCancel} className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-gray-900">Update order status?</h3>
          <p className="text-sm text-gray-500">
            Order <span className="font-mono font-medium text-gray-700">#{order.id.slice(-8).toUpperCase()}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {from}
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[newStatus as OrderStatus] ?? 'bg-gray-100 text-gray-700'}`}>
            {to}
          </span>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ order: Order; newStatus: string } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
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
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } else {
      toast.error(res.error ?? 'Failed to load orders');
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const requestStatusChange = (order: Order, newStatus: string) => {
    if (newStatus === order.status) return;
    setPendingStatus({ order, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    const { order, newStatus } = pendingStatus;
    setPendingStatus(null);
    setUpdating(order.id);
    const res = await api.updateOrderStatus(order.id, newStatus);
    if (res.success && res.data) {
      toast.success('Order status updated');
      const updated = res.data;
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: updated.status, paymentStatus: updated.paymentStatus } : o)),
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
      // preserve user from list data if API didn't return it
      setDetailOrder({ ...res.data, user: res.data.user ?? order.user });
    } else {
      toast.error(res.error ?? 'Failed to load order details');
    }
    setDetailLoading(false);
  }, []);

  const closeDetailModal = () => {
    setDetailOrder(null);
    setDetailLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  // Always derive the logs panel order from live data so status/payment badges stay current
  const liveSelectedOrder = selectedOrder
    ? (orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder)
    : null;

  // Client-side search filter (by order id or customer name)
  const visible = search
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Manage Orders</h1>
          </div>

          <div className="flex items-center gap-2 flex-1 ml-auto justify-end">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Order ID or customer…"
                  className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                />
                {searchInput && (
                  <button type="button" onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0">
                Search
              </button>
            </form>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>

            <button
              onClick={loadOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{order.user?.name ?? '—'}</p>
                          {order.isAdminOrder && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>
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
                          onChange={(e) => requestStatusChange(order, e.target.value)}
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
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{total} order{total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Confirmation Modal */}
      {pendingStatus && (
        <StatusConfirmModal
          order={pendingStatus.order}
          newStatus={pendingStatus.newStatus}
          onConfirm={confirmStatusChange}
          onCancel={() => setPendingStatus(null)}
        />
      )}

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
                  {detailOrder.isAdminOrder && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <ShieldCheck className="h-3 w-3" />
                      Admin Order
                    </span>
                  )}
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
                  <div className={`rounded-xl border px-4 py-3 text-sm ${detailOrder.isAdminOrder ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900">{detailOrder.user?.name ?? '—'}</p>
                      {detailOrder.isAdminOrder && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          <ShieldCheck className="h-3 w-3" />
                          Admin Order
                        </span>
                      )}
                    </div>
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
                  <OrderItemsList
                    items={detailOrder.items ?? []}
                    onProductClick={(productId) => {
                      closeDetailModal();
                      router.push(`/products/${productId}`);
                    }}
                  />
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

      {liveSelectedOrder && (
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
                          #{liveSelectedOrder.id.slice(-8).toUpperCase()} • {liveSelectedOrder.user?.name ?? 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Total {formatCurrency(liveSelectedOrder.total)}
                      </span>
                      <span className={`rounded-full px-3 py-1 font-medium ${STATUS_STYLES[liveSelectedOrder.status]}`}>
                        {liveSelectedOrder.status}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                        {liveSelectedOrder.paymentMethod} • {liveSelectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadOrderLogs(liveSelectedOrder, true)}
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
                  <div className="space-y-3">
                    {orderLogs.map((log) => (
                      <LogCard key={log.id} log={log} />
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
