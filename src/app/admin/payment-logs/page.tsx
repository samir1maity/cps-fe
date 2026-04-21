'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ScrollText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { PaymentAuditLog } from '@/lib/types';

const LEVEL_STYLES: Record<PaymentAuditLog['level'], string> = {
  INFO: 'bg-blue-100 text-blue-700',
  WARN: 'bg-amber-100 text-amber-700',
  ERROR: 'bg-red-100 text-red-700',
};

const SCOPE_STYLES: Record<PaymentAuditLog['scope'], string> = {
  PAYMENT: 'bg-slate-100 text-slate-700',
  ORDER: 'bg-emerald-100 text-emerald-700',
  REFUND: 'bg-fuchsia-100 text-fuchsia-700',
};

export default function AdminPaymentLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [scope, setScope] = useState('');
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState(searchParams.get('orderId') ?? '');

  const loadLogs = async (nextPage = page) => {
    setLoading(true);
    const response = await api.getAdminPaymentLogs({
      page: nextPage,
      scope: scope || undefined,
      level: level || undefined,
      orderId: searchParams.get('orderId') || undefined,
      search: search.trim() || undefined,
    });

    if (response.success && response.data) {
      setLogs(response.data.logs);
      setHasMore(nextPage < response.data.pagination.totalPages);
    } else {
      toast.error(response.error ?? 'Failed to load payment logs');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadLogs(page);
  }, [page, scope, level, searchParams]);

  const handleApplySearch = () => {
    setPage(1);
    void loadLogs(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-slate-700" />
              <h1 className="text-xl font-bold text-gray-900">Payment Logs</h1>
            </div>
          </div>
          <button
            onClick={() => loadLogs(page)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleApplySearch();
                }
              }}
              placeholder="Search event, message, payment ID, or Razorpay order ID"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Scopes</option>
            <option value="PAYMENT">Payment</option>
            <option value="ORDER">Order</option>
            <option value="REFUND">Refund</option>
          </select>
          <select
            value={level}
            onChange={(event) => {
              setLevel(event.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
          </select>
          <button
            onClick={handleApplySearch}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-24 text-center text-gray-500 text-sm">No payment logs found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log.id} className="p-5 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${LEVEL_STYLES[log.level]}`}>
                        {log.level}
                      </span>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${SCOPE_STYLES[log.scope]}`}>
                        {log.scope}
                      </span>
                      <span className="font-mono text-xs text-gray-500">{log.event}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-900">{log.message}</p>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-xs text-gray-600">
                    <div>
                      <p className="text-gray-400 mb-1">Order</p>
                      <p className="font-mono">{log.order?.id ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Payment</p>
                      <p className="font-mono break-all">{log.paymentId ?? log.razorpayOrderId ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Customer</p>
                      <p>{log.user?.name ?? '—'}</p>
                      <p className="text-gray-500">{log.user?.email ?? ''}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">State</p>
                      <p>{log.order ? `${log.order.status} / ${log.order.paymentStatus}` : '—'}</p>
                    </div>
                  </div>

                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
                        {Object.entries(log.meta).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-400">{key}:</span> {value}
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

        {!loading && (page > 1 || hasMore) && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
