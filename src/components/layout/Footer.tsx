'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, MessageSquare, Star, CheckCircle2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type FormState = {
  name: string;
  email: string;
  phone: string;
  type: 'review' | 'query';
  message: string;
};

const INITIAL: FormState = { name: '', email: '', phone: '', type: 'query', message: '' };

const FIELD =
  'w-full bg-stone-800/60 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[var(--brand-500)] focus:bg-stone-800 focus:ring-1 focus:ring-[var(--brand-500)]/30 transition-all duration-200';

const Footer: React.FC = () => {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
      setTimeout(() => setSent(false), 5000);
    } else {
      toast.error(res.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto">
      {!isAdmin && (
        <div className="border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Left — brand copy */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 bg-[var(--brand-600)]/15 border border-[var(--brand-600)]/25 text-[var(--brand-400)] text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide uppercase">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Get in Touch
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                  We'd love to hear<br className="hidden sm:block" /> from you
                </h2>
                <p className="text-stone-400 text-sm leading-relaxed max-w-sm">
                  Have a question about your order, or want to share how much you loved a piece?
                  Drop us a message and we'll get back to you within 24 hours.
                </p>
                <div className="space-y-3 pt-2">
                  {[
                    { icon: <Star className="h-4 w-4" />, text: 'Share your experience with our products' },
                    { icon: <MessageSquare className="h-4 w-4" />, text: 'Ask about orders, shipping or returns' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-stone-400 text-sm">
                      <span className="text-[var(--brand-400)]">{icon}</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — form card */}
              <div className="bg-stone-800/50 border border-stone-700/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                {sent ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-[var(--brand-600)]/20 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-[var(--brand-400)]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">Message sent!</p>
                      <p className="text-stone-400 text-sm mt-1">Thanks, we'll get back to you soon.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type tabs */}
                    <div className="flex gap-2 p-1 bg-stone-900/60 rounded-xl">
                      {(['query', 'review'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            form.type === t
                              ? 'bg-[var(--brand-600)] text-white shadow-lg shadow-[var(--brand-700)]/30'
                              : 'text-stone-400 hover:text-stone-200'
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
                        <label className="block text-xs font-medium text-stone-400 tracking-wide uppercase">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={set('name')}
                          placeholder="John Doe"
                          required
                          className={FIELD}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-stone-400 tracking-wide uppercase">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={set('email')}
                          placeholder="you@example.com"
                          required
                          className={FIELD}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-stone-400 tracking-wide uppercase">
                        Phone Number <span className="text-[var(--brand-400)] normal-case font-normal">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={set('phone')}
                          placeholder="9876543210"
                          required
                          maxLength={10}
                          className={`${FIELD} pl-10`}
                        />
                        <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-stone-400 tracking-wide uppercase">
                        Message
                      </label>
                      <textarea
                        value={form.message}
                        onChange={set('message')}
                        rows={4}
                        placeholder={
                          form.type === 'review'
                            ? 'Share your experience with us…'
                            : 'Describe your query in detail…'
                        }
                        required
                        className={`${FIELD} resize-none`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[var(--brand-700)]/20 hover:shadow-[var(--brand-700)]/40"
                    >
                      {submitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {form.type === 'review' ? 'Submit Review' : 'Send Message'}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <span>© {new Date().getFullYear()} Creative Pottery Studio. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/search" className="hover:text-stone-300 transition-colors">Shop</Link>
            <Link href="/profile" className="hover:text-stone-300 transition-colors">My Account</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
