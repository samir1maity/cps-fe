// src/app/checkout/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  CreditCard,
  MapPin,
  Lock,
  ArrowLeft,
  CheckCircle,
  Truck,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/formatters';
import { api } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  paymentMethod: 'razorpay' | 'cod';
  couponCode: string;
}

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<CheckoutForm>({
    defaultValues: {
      email: user?.email || '',
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      country: 'India',
      paymentMethod: 'razorpay',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const subtotal = getTotalPrice();
  const tax = (subtotal - discount) * 0.18;
  const shipping = 0;
  const total = subtotal - discount + tax + shipping;

  const applyCoupon = async () => {
    const code = getValues('couponCode');
    if (!code) return;
    try {
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
    } catch {
      toast.error('Failed to apply coupon');
    }
  };

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window.Razorpay !== 'undefined') { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (!user) { router.push('/login'); return; }

    try {
      setLoading(true);

      const shippingAddress = {
        firstName: data.firstName,
        lastName: data.lastName,
        address1: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        phone: data.phone,
      };

      const orderResult = await api.createOrder({
        shippingAddress,
        paymentMethod: data.paymentMethod === 'cod' ? 'CASH_ON_DELIVERY' : 'RAZORPAY',
        couponCode: couponApplied || undefined,
      });

      if (!orderResult.success || !orderResult.data) {
        toast.error(orderResult.error || 'Failed to create order');
        return;
      }

      const orderData = orderResult.data;

      if (data.paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        router.push('/orders');
        return;
      }

      // Razorpay flow
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        return;
      }

      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Creative Pottery Studio',
        description: 'Order Payment',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          contact: data.phone,
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
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
              router.push('/orders');
            } else {
              toast.error(verifyResult.error || 'Payment verification failed');
            }
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setLoading(false);
          },
        },
        theme: { color: '#7c3aed' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <div className={`w-16 h-0.5 ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                <div className={`flex items-center ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {s}
                  </div>
                  <span className="ml-2 font-medium hidden sm:inline">
                    {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Step 1: Shipping */}
              {step === 1 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-6">
                    <MapPin className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })}
                        type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input {...register('phone', { required: 'Phone is required' })}
                        type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input {...register('firstName', { required: 'First name is required' })}
                        type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input {...register('lastName', { required: 'Last name is required' })}
                        type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input {...register('address', { required: 'Address is required' })}
                        type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input {...register('city', { required: 'City is required' })}
                        type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input {...register('state', { required: 'State is required' })}
                        type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                      <input {...register('zipCode', { required: 'PIN code is required' })}
                        type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <select {...register('country', { required: 'Country is required' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="India">India</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button type="button" onClick={() => setStep(2)}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-6">
                    <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                      <input {...register('paymentMethod')} type="radio" value="razorpay" className="mr-3" />
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">R</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Razorpay</div>
                          <div className="text-sm text-gray-500">UPI, Cards, Wallets, Net Banking</div>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                      <input {...register('paymentMethod')} type="radio" value="cod" className="mr-3" />
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 bg-green-600 rounded mr-3 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">₹</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Cash on Delivery</div>
                          <div className="text-sm text-gray-500">Pay when you receive</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Coupon code */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                    <div className="flex gap-2">
                      <input {...register('couponCode')} type="text" placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" />
                      <button type="button" onClick={applyCoupon}
                        className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
                        Apply
                      </button>
                    </div>
                    {couponApplied && (
                      <p className="mt-1 text-sm text-green-600">Coupon &ldquo;{couponApplied}&rdquo; applied - You save {formatCurrency(discount)}</p>
                    )}
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button type="button" onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-900">
                      ← Back to Shipping
                    </button>
                    <button type="button" onClick={() => setStep(3)}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                      Review Order
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-6">
                    <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Review Your Order</h2>
                  </div>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <Image src={item.product.images[0] || '/images/placeholder.jpg'}
                          alt={item.product.name} width={60} height={60} className="rounded-lg object-cover" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-6 pt-6 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span><span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>GST (18%)</span><span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span><span>Free</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total</span><span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <div className="mt-6 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                    <strong>Payment:</strong> {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}
                  </div>
                  <div className="mt-8 flex justify-between">
                    <button type="button" onClick={() => setStep(2)} className="text-gray-600 hover:text-gray-900">
                      ← Back to Payment
                    </button>
                    <button type="submit" disabled={loading}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      ) : (
                        <Lock className="h-5 w-5 mr-2" />
                      )}
                      {paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Pay'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">Free</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center"><Truck className="h-4 w-4 mr-2" /><span>Free shipping on all orders</span></div>
                <div className="flex items-center"><Shield className="h-4 w-4 mr-2" /><span>Secure payment processing</span></div>
                <div className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" /><span>30-day return policy</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
