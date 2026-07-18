'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Eye,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type QueryStatus = 'unread' | 'read' | 'resolved';
type QueryType = 'review' | 'query';

interface Query {
  _id: string;
  name: string;
  email: string;
  type: QueryType;
  subject: string;
  message: string;
  status: QueryStatus;
  adminNote?: string;
  createdAt: string;
}

const STATUS_LABELS: Record<QueryStatus, string> = {
  unread: 'Unread',
  read: 'Read',
  resolved: 'Resolved',
};

const STATUS_COLORS: Record<QueryStatus, string> = {
  unread: 'bg-red-100 text-red-700',
  read: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

export default function AdminQueriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState<Query | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getAdminQueries({
      page,
      limit: 15,
      status: filterStatus || undefined,
      type: filterType || undefined,
    });
    if (res.success && res.data) {
      setItems(res.data);
      setTotalPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    }
    setLoading(false);
  }, [page, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (q: Query) => {
    setSelected(q);
    setNoteText(q.adminNote ?? '');
    // mark as read if unread
    if (q.status === 'unread') {
      await api.updateAdminQueryStatus(q._id, 'read');
      setItems((prev) => prev.map((i) => i._id === q._id ? { ...i, status: 'read' } : i));
    }
  };

  const closeDetail = () => { setSelected(null); setNoteText(''); };

  const handleStatusUpdate = async (status: QueryStatus) => {
    if (!selected) return;
    setSaving(true);
    const res = await api.updateAdminQueryStatus(selected._id, status, noteText.trim() || undefined);
    setSaving(false);
    if (res.success) {
      toast.success(`Marked as ${STATUS_LABELS[status]}`);
      const updated = { ...selected, status, adminNote: noteText.trim() || selected.adminNote };
      setSelected(updated);
      setItems((prev) => prev.map((i) => i._id === selected._id ? updated : i));
    } else {
      toast.error(res.error ?? 'Failed to update');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Queries & Reviews</h1>
            {total > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">{total}</span>
            )}
          </div>
          <button
            onClick={load}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500,#f97316)]"
          >
            <option value="">All Statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500,#f97316)]"
          >
            <option value="">All Types</option>
            <option value="query">Queries</option>
            <option value="review">Reviews</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-600,#c2410c)]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">No queries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-6">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((q) => (
                    <tr
                      key={q._id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${q.status === 'unread' ? 'font-semibold' : ''}`}
                      onClick={() => openDetail(q)}
                    >
                      <td className="px-4 py-3">
                        {q.type === 'review' ? (
                          <Star className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{q.name}</div>
                        <div className="text-xs text-gray-400 font-normal">{q.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{q.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}>
                          {STATUS_LABELS[q.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(q.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Eye className="h-4 w-4 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer / modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />
          <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                {selected.type === 'review' ? (
                  <Star className="h-4 w-4 text-yellow-500" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                )}
                <span className="font-semibold text-gray-900 capitalize">{selected.type}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 flex-1 space-y-5">
              {/* Sender */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Subject</p>
                <p className="text-gray-900 font-medium">{selected.subject}</p>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Admin note */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Admin Note (internal)</p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Add an internal note…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500,#f97316)] resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-wrap sticky bottom-0 bg-white">
              {selected.status !== 'read' && (
                <button
                  disabled={saving}
                  onClick={() => handleStatusUpdate('read')}
                  className="flex items-center gap-1.5 border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Mark Read
                </button>
              )}
              {selected.status !== 'resolved' && (
                <button
                  disabled={saving}
                  onClick={() => handleStatusUpdate('resolved')}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Mark Resolved'}
                </button>
              )}
              {noteText !== (selected.adminNote ?? '') && (
                <button
                  disabled={saving}
                  onClick={() => handleStatusUpdate(selected.status)}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Note'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
