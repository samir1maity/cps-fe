'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, MessageSquare, Star, CheckCircle2, Phone, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

type FormState = {
  name: string;
  email: string;
  phone: string;
  type: 'review' | 'query';
  message: string;
};

const INITIAL: FormState = { name: '', email: '', phone: '', type: 'query', message: '' };

const FIELD =
  'w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-200 focus:outline-none focus:border-[var(--brand-500)] focus:bg-white focus:ring-1 focus:ring-[var(--brand-500)]/30 transition-all duration-200';

// Pages where form is always visible inline (no button needed)
const INLINE_PAGES = ['/'];

const Footer: React.FC = () => {
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);

  const isInline = INLINE_PAGES.includes(pathname);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    const res = await api.submitQuery(form);
    setSubmitting(false);
    if (res.success) {
      setSent(true);
      setForm(INITIAL);
      // Close after 2.5s on non-inline pages
      if (!isInline) {
        setTimeout(() => { setSent(false); setOpen(false); }, 2500);
      } else {
        setTimeout(() => setSent(false), 5000);
      }
    } else {
      toast.error(res.error || 'Something went wrong. Please try again.');
    }
  };

  const closeForm = () => { setOpen(false); setSent(false); setForm(INITIAL); };

  // ── Form content (shared between inline and modal) ────────────────────────
  const FormContent = (
    <>
      {sent ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[var(--brand-600)]/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-[var(--brand-600)]" />
          </div>
          <div>
            <p className="text-stone-900 font-semibold text-lg">Message sent!</p>
            <p className="text-stone-500 text-sm mt-1">Thanks, we'll get back to you soon.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type tabs */}
          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
            {(['query', 'review'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  form.type === t
                    ? 'bg-[var(--brand-600)] text-white shadow-md'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t === 'query' ? <MessageSquare className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                {t === 'query' ? 'Send a Query' : 'Leave a Review'}
              </button>
            ))}
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-500 tracking-wide uppercase">Your Name</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="John Doe" required className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-stone-500 tracking-wide uppercase">Email Address</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className={FIELD} />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-500 tracking-wide uppercase">
              Phone Number <span className="text-[var(--brand-600)] normal-case font-normal">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                onKeyDown={(e) => {
                  if (!/[\d]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="9876543210"
                required
                inputMode="numeric"
                className={`${FIELD} pl-10`}
              />
              <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-500 tracking-wide uppercase">Message</label>
            <textarea
              value={form.message}
              onChange={set('message')}
              rows={4}
              placeholder={form.type === 'review' ? 'Share your experience with us…' : 'Describe your query in detail…'}
              required
              className={`${FIELD} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {submitting ? (
              <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
            ) : (
              <><Send className="h-4 w-4" />{form.type === 'review' ? 'Submit Review' : 'Send Message'}</>
            )}
          </button>
        </form>
      )}
    </>
  );

  return (
    <>
      <footer className="bg-stone-50 text-stone-700 mt-auto border-t border-stone-200 pb-24 md:pb-0">

        {/* Inline form — home page only */}
        {!isAdmin && isInline && (
          <div className="bg-amber-50/60 border-b border-stone-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

                {/* Left — brand copy */}
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 bg-[var(--brand-600)]/10 border border-[var(--brand-600)]/20 text-[var(--brand-600)] text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide uppercase">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Get in Touch
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                    We'd love to hear<br className="hidden sm:block" /> from you
                  </h2>
                  <p className="text-stone-500 text-sm leading-relaxed max-w-sm">
                    Have a question about your order, or want to share how much you loved a piece?
                    Drop us a message and we'll get back to you within 24 hours.
                  </p>
                  <div className="space-y-3 pt-2">
                    {[
                      { icon: <Star className="h-4 w-4" />, text: 'Share your experience with our products' },
                      { icon: <MessageSquare className="h-4 w-4" />, text: 'Ask about orders, shipping or returns' },
                    ].map(({ icon, text }) => (
                      <div key={text} className="flex items-center gap-3 text-stone-500 text-sm">
                        <span className="text-[var(--brand-600)]">{icon}</span>
                        {text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — form card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                  {FormContent}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="border-t border-stone-200 bg-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
              <span>© {new Date().getFullYear()} Creative Pottery Studio. All rights reserved.</span>
              <span className="hidden sm:inline text-stone-300">·</span>
              <span>Designed &amp; Developed by <span className="text-stone-700 font-medium">Prince Globe</span></span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/search" className="hover:text-stone-800 transition-colors">Shop</Link>
              <Link href="/profile" className="hover:text-stone-800 transition-colors">My Account</Link>
              <Link href="/about" className="hover:text-stone-800 transition-colors">About Us</Link>
              <span className="text-stone-300">·</span>
              <Link href="/terms" className="hover:text-stone-800 transition-colors">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating button + modal — all pages except home and admin */}
      {!isAdmin && !isInline && (
        <>
          {/* Floating trigger button */}
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="fixed bottom-6 right-5 z-40 flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 md:bottom-6"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Get in Touch</span>
            </button>
          )}

          {/* Modal overlay */}
          {open && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={closeForm}
              />

              {/* Modal card */}
              <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[var(--brand-600)]/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-[var(--brand-600)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">Get in Touch</p>
                      <p className="text-xs text-stone-400">We'll reply within 24 hours</p>
                    </div>
                  </div>
                  <button
                    onClick={closeForm}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal body */}
                <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
                  {FormContent}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Footer;
