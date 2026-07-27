'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  ShoppingBag,
  XCircle,
  RotateCcw,
  CheckCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type NotifType = 'NEW_ORDER' | 'ORDER_CANCELLED' | 'RETURN_REQUEST';

interface AdminNotif {
  _id: string;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  data?: { orderId?: string };
  createdAt: string;
}

const TYPE_ICON: Record<NotifType, React.ReactNode> = {
  NEW_ORDER: <ShoppingBag className="h-4 w-4 text-green-600" />,
  ORDER_CANCELLED: <XCircle className="h-4 w-4 text-red-500" />,
  RETURN_REQUEST: <RotateCcw className="h-4 w-4 text-orange-500" />,
};

const TYPE_BG: Record<NotifType, string> = {
  NEW_ORDER: 'bg-green-50',
  ORDER_CANCELLED: 'bg-red-50',
  RETURN_REQUEST: 'bg-orange-50',
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const LIMIT = 10;
  const [items, setItems] = useState<AdminNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminNotificationsList({ page, limit: LIMIT, unread: unreadOnly || undefined });
    if (res.success && res.data) {
      setItems(res.data);
      setUnreadCount(res.unreadCount ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    }
    setLoading(false);
  }, [page, unreadOnly]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    const res = await api.markAdminNotificationRead(id);
    if (res.success) {
      setItems((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(res.data?.unreadCount ?? 0);
    }
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    const res = await api.markAllAdminNotificationsRead();
    setMarking(false);
    if (res.success) {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Bell className="h-5 w-5 text-gray-600" />
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={marking}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                {marking ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => { setUnreadOnly(false); setPage(1); }}
            className={`text-sm px-4 py-1.5 rounded-full font-medium border transition-colors ${!unreadOnly ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            All
          </button>
          <button
            onClick={() => { setUnreadOnly(true); setPage(1); }}
            className={`text-sm px-4 py-1.5 rounded-full font-medium border transition-colors ${unreadOnly ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            Unread only
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">{unreadOnly ? 'No unread notifications' : 'No notifications yet'}</p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}
              >
                {/* Icon */}
                <div className={`mt-0.5 p-2 rounded-full shrink-0 ${TYPE_BG[n.type] ?? 'bg-gray-100'}`}>
                  {TYPE_ICON[n.type] ?? <Bell className="h-4 w-4 text-gray-500" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {n.data?.orderId && (
                    <button
                      onClick={() => router.push(`/admin/orders?order=${n.data!.orderId}`)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View order"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              {total === 0
                ? 'No notifications'
                : `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="px-2 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  «
                </button>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[32px] h-8 px-2 text-sm rounded-lg border transition-colors ${
                          page === p
                            ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="px-2 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
