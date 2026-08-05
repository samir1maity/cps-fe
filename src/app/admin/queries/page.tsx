'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Mail,
  Phone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Clock,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type QueryStatus = 'unread' | 'read' | 'resolved';
type ReviewStatus = 'pending' | 'approved' | 'rejected';
type ItemStatus = QueryStatus | ReviewStatus;
type ItemType = 'review' | 'query';

interface Item {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  type: ItemType;
  message: string;
  status: ItemStatus;
  adminNote?: string;
  featuredOnHome?: boolean;
  createdAt: string;
}

// ─── Status config — split by type ───────────────────────────────────────────

const QUERY_STATUS_LABEL: Record<QueryStatus, string> = {
  unread: 'Unread',
  read: 'Read',
  resolved: 'Resolved',
};

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  unread:   'bg-red-100 text-red-700',
  read:     'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function statusLabel(type: ItemType, status: ItemStatus): string {
  if (type === 'review') return REVIEW_STATUS_LABEL[status as ReviewStatus] ?? status;
  return QUERY_STATUS_LABEL[status as QueryStatus] ?? status;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminQueriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState<Item | null>(null);
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

  const openDetail = async (q: Item) => {
    setSelected(q);
    setNoteText(q.adminNote ?? '');
    // Auto-mark queries as read when opened
    if (q.type === 'query' && q.status === 'unread') {
      await api.updateAdminQueryStatus(q._id, 'read');
      setItems((prev) => prev.map((i) => i._id === q._id ? { ...i, status: 'read' } : i));
    }
  };

  const closeDetail = () => { setSelected(null); setNoteText(''); };

  const handleToggleFeature = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await api.toggleFeaturedReview(selected._id);
    setSaving(false);
    if (res.success) {
      const updated = { ...selected, featuredOnHome: res.data?.featuredOnHome ?? !selected.featuredOnHome };
      setSelected(updated);
      setItems((prev) => prev.map((i) => i._id === selected._id ? updated : i));
      toast.success(updated.featuredOnHome ? 'Featured on home page' : 'Removed from home page');
    } else {
      toast.error(res.error ?? 'Failed to update');
    }
  };

  const handleStatusUpdate = async (status: ItemStatus) => {
    if (!selected) return;
    setSaving(true);
    const res = await api.updateAdminQueryStatus(selected._id, status, noteText.trim() || undefined);
    setSaving(false);
    if (res.success) {
      toast.success(`Marked as ${statusLabel(selected.type, status)}`);
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
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          >
            <option value="">All Types</option>
            <option value="query">Queries only</option>
            <option value="review">Reviews only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
          >
            <option value="">All Statuses</option>
            {/* Query statuses */}
            <optgroup label="Query statuses">
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
            </optgroup>
            {/* Review statuses */}
            <optgroup label="Review statuses">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </optgroup>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-600)]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Nothing found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Message</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((q) => (
                    <tr
                      key={q._id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        (q.status === 'unread' || q.status === 'pending') ? 'font-semibold' : ''
                      }`}
                      onClick={() => openDetail(q)}
                    >
                      <td className="px-4 py-3">
                        {q.type === 'review'
                          ? <Star className="h-4 w-4 text-amber-500" />
                          : <MessageSquare className="h-4 w-4 text-blue-500" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{q.name}</div>
                        <div className="text-xs text-gray-400 font-normal">{q.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate font-normal">{q.message}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}>
                            {statusLabel(q.type, q.status)}
                          </span>
                          {q.featuredOnHome && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                              <BookmarkCheck className="h-3 w-3" /> Featured
                            </span>
                          )}
                        </div>
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
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={closeDetail} />
          <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                {selected.type === 'review'
                  ? <Star className="h-4 w-4 text-amber-500" />
                  : <MessageSquare className="h-4 w-4 text-blue-500" />}
                <span className="font-semibold text-gray-900 capitalize">{selected.type}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                  {statusLabel(selected.type, selected.status)}
                </span>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 flex-1 space-y-5">

              {/* Sender info */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  {selected.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" /> {selected.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(selected.createdAt)}</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Message</p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Admin note */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Admin Note (internal)</p>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Add an internal note…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] resize-none"
                />
              </div>
            </div>

            {/* Actions — differ by type */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-wrap sticky bottom-0 bg-white">
              {selected.type === 'review' ? (
                // ── Review actions: Approve / Reject / Feature ────────────────
                <>
                  <button
                    disabled={saving || selected.status === 'approved'}
                    onClick={() => handleStatusUpdate('approved')}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Approve'}
                  </button>
                  <button
                    disabled={saving || selected.status === 'rejected'}
                    onClick={() => handleStatusUpdate('rejected')}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Reject'}
                  </button>
                  {selected.status !== 'pending' && (
                    <button
                      disabled={saving}
                      onClick={() => handleStatusUpdate('pending')}
                      className="flex items-center gap-1.5 border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-40 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Clock className="h-4 w-4" />
                      Reset to Pending
                    </button>
                  )}
                  {selected.status === 'approved' && (
                    <button
                      disabled={saving}
                      onClick={handleToggleFeature}
                      className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40 ${
                        selected.featuredOnHome
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : 'border border-violet-300 text-violet-700 hover:bg-violet-50'
                      }`}
                    >
                      {selected.featuredOnHome
                        ? <><BookmarkCheck className="h-4 w-4" /> Featured on Home</>
                        : <><Bookmark className="h-4 w-4" /> Feature on Home</>}
                    </button>
                  )}
                </>
              ) : (
                // ── Query actions: Mark Read / Resolved ───────────────────────
                <>
                  {selected.status !== 'read' && (
                    <button
                      disabled={saving}
                      onClick={() => handleStatusUpdate('read')}
                      className="flex items-center gap-1.5 border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-40 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Mark Read
                    </button>
                  )}
                  {selected.status !== 'resolved' && (
                    <button
                      disabled={saving}
                      onClick={() => handleStatusUpdate('resolved')}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {saving ? 'Saving…' : 'Mark Resolved'}
                    </button>
                  )}
                </>
              )}

              {/* Save note button (always available when note changed) */}
              {noteText !== (selected.adminNote ?? '') && (
                <button
                  disabled={saving}
                  onClick={() => handleStatusUpdate(selected.status)}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
