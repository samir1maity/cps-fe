'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  CreditCard, MapPin, Lock, ArrowLeft,
  CheckCircle, Truck, Shield, Plus, Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/formatters';
import { api } from '@/lib/api';
import { Address } from '@/lib/types';

declare global {
  interface Window { Razorpay: any; }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShippingForm {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface PaymentForm {
  paymentMethod: 'razorpay' | 'cod';
  couponCode: string;
}

// ─── Shared input style ───────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Shipping', 'Payment', 'Review'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const s = i + 1;
        const done = current > s;
        const active = current === s;
        return (
          <React.Fragment key={s}>
            {i > 0 && (
              <div className={`w-16 h-0.5 ${current > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
            <div className={`flex items-center gap-2 ${active ? 'text-blue-600' : done ? 'text-blue-400' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {done ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Saved address card ───────────────────────────────────────────────────────

function SavedAddressCard({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm leading-5">
          <div className="flex items-center gap-1.5 mb-1">
            {address.label && (
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {address.label}
              </span>
            )}
            {address.isDefault && (
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-800">{address.firstName} {address.lastName}</p>
          <p className="text-gray-500">{address.address1}{address.address2 ? `, ${address.address2}` : ''}</p>
          <p className="text-gray-500">{address.city}, {address.state} – {address.zipCode}</p>
          <p className="text-gray-500">{address.phone}</p>
        </div>
        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
        }`}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    </button>
  );
}

// ─── Step 1: Shipping ─────────────────────────────────────────────────────────

interface ShippingStepProps {
  savedAddresses: Address[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string | null) => void;
  form: ReturnType<typeof useForm<ShippingForm>>;
  onNext: () => void;
}

function ShippingStep({ savedAddresses, selectedAddressId, onSelectAddress, form, onNext }: ShippingStepProps) {
  const { register, formState: { errors }, trigger } = form;
  const showNewForm = selectedAddressId === null;

  const handleNext = async () => {
    if (selectedAddressId) { onNext(); return; }
    const valid = await trigger(['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'country']);
    if (valid) onNext();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
      </div>

      {/* Saved addresses */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Saved Addresses</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => (
              <SavedAddressCard
                key={addr.id}
                address={addr}
                selected={selectedAddressId === addr.id}
                onSelect={() => onSelectAddress(addr.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => onSelectAddress(null)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border-2 w-full transition-colors ${
              showNewForm ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-dashed border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
          >
            <Plus className="h-4 w-4" />
            Use a different address
          </button>
        </div>
      )}

      {/* New address form */}
      {showNewForm && (
        <div className="space-y-4">
          {savedAddresses.length > 0 && (
            <p className="text-sm font-medium text-gray-700">Enter New Address</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
              })} type="email" className={INPUT} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input {...register('firstName', { required: 'Required' })} type="text" className={INPUT} />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input {...register('lastName', { required: 'Required' })} type="text" className={INPUT} />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
              <input {...register('phone', { required: 'Required' })} type="tel" className={INPUT} />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">PIN Code *</label>
              <input {...register('zipCode', { required: 'Required' })} type="text" className={INPUT} />
              {errors.zipCode && <p className="mt-1 text-xs text-red-500">{errors.zipCode.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Street Address *</label>
              <input {...register('address', { required: 'Required' })} type="text" className={INPUT} />
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
              <input {...register('city', { required: 'Required' })} type="text" className={INPUT} />
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
              <input {...register('state', { required: 'Required' })} type="text" className={INPUT} />
              {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={savedAddresses.length > 0 && selectedAddressId === null && showNewForm === false}
          className="bg-blue-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Payment ──────────────────────────────────────────────────────────

interface PaymentStepProps {
  form: ReturnType<typeof useForm<PaymentForm>>;
  discount: number;
  couponApplied: string;
  onApplyCoupon: () => void;
  onBack: () => void;
  onNext: () => void;
  formatCurrency: (n: number) => string;
}

function PaymentStep({ form, discount, couponApplied, onApplyCoupon, onBack, onNext, formatCurrency }: PaymentStepProps) {
  const { register, getValues } = form;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
      </div>

      <div className="space-y-3">
        {[
          { value: 'razorpay', label: 'Razorpay', sub: 'UPI, Cards, Wallets, Net Banking', badge: 'R', color: 'bg-blue-600' },
          { value: 'cod',      label: 'Cash on Delivery', sub: 'Pay when you receive', badge: '₹', color: 'bg-green-600' },
        ].map(({ value, label, sub, badge, color }) => (
          <label key={value} className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input {...register('paymentMethod')} type="radio" value={value} className="accent-blue-600" />
            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center shrink-0`}>
              <span className="text-white text-xs font-bold">{badge}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Coupon */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Coupon Code</label>
        <div className="flex gap-2">
          <input
            {...register('couponCode')}
            type="text"
            placeholder="Enter coupon code"
            className={`${INPUT} flex-1 uppercase`}
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Apply
          </button>
        </div>
        {couponApplied && (
          <p className="mt-1.5 text-xs text-green-600 font-medium">
            "{couponApplied}" applied — you save {formatCurrency(discount)}
          </p>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Review Order
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

interface ReviewStepProps {
  items: ReturnType<typeof useCart>['items'];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  loading: boolean;
  onBack: () => void;
}

function ReviewStep({ items, subtotal, discount, tax, total, paymentMethod, loading, onBack }: ReviewStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Review Your Order</h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <Image
              src={item.product.images[0] || '/images/placeholder.jpg'}
              alt={item.product.name}
              width={56} height={56}
              className="rounded-lg object-cover border border-gray-100 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 shrink-0">
              {formatCurrency(item.product.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        {discount > 0 && <Row label="Discount" value={`-${formatCurrency(discount)}`} valueClass="text-green-600" />}
        <Row label="GST (18%)" value={formatCurrency(tax)} />
        <Row label="Shipping" value="Free" />
        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
        <span className="font-medium">Payment:</span>{' '}
        {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Lock className="h-4 w-4" />
          }
          {paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Pay'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-gray-700' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

// ─── Order Summary sidebar ────────────────────────────────────────────────────

function OrderSummary({ subtotal, discount, tax, total }: { subtotal: number; discount: number; tax: number; total: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h3>
      <div className="space-y-2.5 mb-6">
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        {discount > 0 && <Row label="Discount" value={`-${formatCurrency(discount)}`} valueClass="text-green-600" />}
        <Row label="GST (18%)" value={formatCurrency(tax)} />
        <Row label="Shipping" value="Free" />
        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="space-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Free shipping on all orders</div>
        <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Secure payment</div>
        <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5" /> 30-day returns</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const shippingForm = useForm<ShippingForm>({
    defaultValues: {
      email: user?.email || '',
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      country: 'India',
    },
  });

  const paymentForm = useForm<PaymentForm>({
    defaultValues: { paymentMethod: 'razorpay', couponCode: '' },
  });

  const paymentMethod = paymentForm.watch('paymentMethod');
  const subtotal = getTotalPrice();
  const tax = (subtotal - discount) * 0.18;
  const total = subtotal - discount + tax;

  // Load saved addresses on mount
  useEffect(() => {
    if (!user) return;
    api.getAddresses().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setSavedAddresses(res.data);
        // Pre-select default address if any
        const def = res.data.find((a) => a.isDefault) ?? res.data[0];
        setSelectedAddressId(def.id);
      } else {
        // No saved addresses — show new form immediately
        setSelectedAddressId(null);
      }
    });
  }, [user]);

  if (!user) { router.push('/login'); return null; }
  if (items.length === 0) { router.push('/cart'); return null; }

  // ── Coupon ──
  const handleApplyCoupon = async () => {
    const code = paymentForm.getValues('couponCode');
    if (!code) return;
    const result = await api.validateCoupon(code, subtotal);
    if (result.success && result.data) {
      const coupon = result.data;
      const d = coupon.type === 'PERCENTAGE'
        ? Math.min(subtotal * (coupon.value / 100), (coupon as any).maxDiscountAmount || Infinity)
        : coupon.value;
      setDiscount(d);
      setCouponApplied(code);
      toast.success(`Coupon applied! You save ${formatCurrency(d)}`);
    } else {
      toast.error(result.error || 'Invalid coupon');
    }
  };

  // ── Razorpay loader ──
  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (typeof window.Razorpay !== 'undefined') { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ── Submit ──
  const handleSubmit = paymentForm.handleSubmit(async (paymentData) => {
    try {
      setLoading(true);
      const shippingData = shippingForm.getValues();

      // Build order payload — either a saved address id or raw fields
      const orderPayload = selectedAddressId
        ? { addressId: selectedAddressId }
        : {
            shippingAddress: {
              firstName: shippingData.firstName,
              lastName: shippingData.lastName,
              address1: shippingData.address,
              city: shippingData.city,
              state: shippingData.state,
              zipCode: shippingData.zipCode,
              country: shippingData.country,
              phone: shippingData.phone,
            },
            saveAddress: true,
          };

      const orderResult = await api.createOrder({
        ...orderPayload,
        paymentMethod: paymentData.paymentMethod === 'cod' ? 'CASH_ON_DELIVERY' : 'RAZORPAY',
        couponCode: couponApplied || undefined,
      });

      if (!orderResult.success || !orderResult.data) {
        toast.error(orderResult.error || 'Failed to create order');
        return;
      }

      const orderData = orderResult.data;

      if (paymentData.paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        router.push('/profile');
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Failed to load payment gateway.'); return; }

      const rzp = new window.Razorpay({
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Creative Pottery Studio',
        description: 'Order Payment',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          email: shippingData.email,
          contact: shippingData.phone,
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyResult = await api.verifyPayment({
              orderId: orderData.order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyResult.success) {
              clearCart();
              toast.success('Payment successful! Order confirmed.');
              router.push('/profile');
            } else {
              toast.error(verifyResult.error || 'Payment verification failed');
            }
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => { toast('Payment cancelled', { icon: '🔒' }); setLoading(false); } },
        theme: { color: '#2563eb' },
      });
      rzp.open();
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <StepBar current={step} />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {step === 1 && (
                <ShippingStep
                  savedAddresses={savedAddresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={setSelectedAddressId}
                  form={shippingForm}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <PaymentStep
                  form={paymentForm}
                  discount={discount}
                  couponApplied={couponApplied}
                  onApplyCoupon={handleApplyCoupon}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  formatCurrency={formatCurrency}
                />
              )}
              {step === 3 && (
                <ReviewStep
                  items={items}
                  subtotal={subtotal}
                  discount={discount}
                  tax={tax}
                  total={total}
                  paymentMethod={paymentMethod}
                  loading={loading}
                  onBack={() => setStep(2)}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <OrderSummary subtotal={subtotal} discount={discount} tax={tax} total={total} />
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CheckoutPage;
