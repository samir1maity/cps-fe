'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, Building2 } from 'lucide-react';
import { User } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  gstNumber: string;
  password: string;
  confirmPassword: string;
}

const INPUT =
  'appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--brand-500)] focus:border-[var(--brand-500)] sm:text-sm';

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        gstNumber: data.gstNumber?.trim().toUpperCase() || undefined,
      } as Partial<User> & { password: string; phone: string; gstNumber?: string });

      if (result.success) {
        toast.success('Registration successful! Please log in.');
        router.push('/login');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch {
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)]">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative">
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  type="text"
                  placeholder="Enter your full name"
                  className={INPUT}
                />
                <UserIcon className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                  })}
                  type="email"
                  placeholder="Enter your email"
                  className={INPUT}
                />
                <Mail className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Phone + GST side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
                    })}
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    className={INPUT}
                  />
                  <Phone className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GST Number <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('gstNumber', {
                      validate: (v) =>
                        !v || GST_REGEX.test(v.trim().toUpperCase()) || 'Invalid GSTIN format',
                    })}
                    type="text"
                    placeholder="27AAPFU0939F1ZV"
                    maxLength={15}
                    className={`${INPUT} uppercase`}
                  />
                  <Building2 className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
                </div>
                {errors.gstNumber && <p className="mt-1 text-sm text-red-600">{errors.gstNumber.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`${INPUT} pr-10`}
                />
                <Lock className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 z-10 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className={`${INPUT} pr-10`}
                />
                <Lock className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 z-10 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center">
            <input
              id="agree-terms"
              type="checkbox"
              required
              className="h-4 w-4 text-[var(--brand-600)] focus:ring-[var(--brand-500)] border-gray-300 rounded"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <Link href="/terms" className="text-[var(--brand-600)] hover:text-[var(--brand-700)]">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[var(--brand-600)] hover:text-[var(--brand-700)]">Privacy Policy</Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--brand-600)] hover:bg-[var(--brand-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-500)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
