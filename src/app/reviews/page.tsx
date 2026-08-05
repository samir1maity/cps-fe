'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface PublicReview {
  _id: string;
  name: string;
  message: string;
  createdAt: string;
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
];
function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ── Card — fixed height, message area scrolls internally ─────────────────────
function ReviewCard({ review }: { review: PublicReview }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const isOverflow = el.scrollHeight > el.clientHeight + 2;
      setOverflows(isOverflow);
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
    };
    check();
    el.addEventListener('scroll', check);
    return () => el.removeEventListener('scroll', check);
  }, [review.message]);

  const showFade = overflows && !atBottom;

  return (
    <div className="relative bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <Quote className="absolute top-4 right-4 h-7 w-7 text-[var(--brand-600)] fill-[var(--brand-600)] opacity-20 pointer-events-none" />

      <div className="relative pr-1">
        <div
          ref={scrollRef}
          className="overflow-y-auto pr-5"
          style={{
            maxHeight: '7.5rem',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}
        >
          <p className="text-sm text-gray-700 leading-6">
            "{review.message}"
          </p>
        </div>
        {/* Fade — only when content is cut off and not scrolled to bottom */}
        {showFade && (
          <div
            className="absolute bottom-0 left-0 right-0 h-7 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.6))' }}
          />
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(review.name)}`}>
          {getInitials(review.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{review.name}</p>
          <p className="text-[11px] text-gray-400">
            {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className="ml-auto text-[10px] font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full shrink-0">
          Verified
        </span>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const res = await api.getAllPublicReviews(p, 12);
    if (res.success && res.data) {
      setReviews(res.data);
      setTotalPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <div className="bg-amber-50/60 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 text-stone-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <MessageSquare className="h-3.5 w-3.5" />
            Customer Reviews
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">What our customers say</h1>
          {total > 0 && (
            <p className="mt-2 text-sm text-stone-500">{total} verified review{total !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse space-y-3">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-400 gap-3">
            <MessageSquare className="h-10 w-10 opacity-40" />
            <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages >= 1 && !loading && reviews.length > 0 && (
          <div className="flex flex-col items-center gap-3 mt-10">
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => goTo(page - 1)}
                className="p-2 border border-[var(--brand-600)] text-[var(--brand-600)] rounded-lg disabled:opacity-30 hover:bg-[var(--brand-600)] hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-stone-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goTo(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-[var(--brand-600)] text-white'
                            : 'border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => goTo(page + 1)}
                className="p-2 border border-[var(--brand-600)] text-[var(--brand-600)] rounded-lg disabled:opacity-30 hover:bg-[var(--brand-600)] hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-stone-400">Page {page} of {totalPages} · {total} reviews</p>
          </div>
        )}
      </div>
    </main>
  );
}
