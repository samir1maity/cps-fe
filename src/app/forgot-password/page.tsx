'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { KeyRound, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface RequestOtpForm {
  email: string;
}

interface ResetPasswordForm {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const formatSeconds = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendAfter, setResendAfter] = useState(0);

  const requestOtpForm = useForm<RequestOtpForm>();
  const resetPasswordForm = useForm<ResetPasswordForm>();

  useEffect(() => {
    if (step !== 'reset') return;

    const intervalId = window.setInterval(() => {
      setExpiresIn((current) => Math.max(0, current - 1));
      setResendAfter((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [step]);

  const otpStatus = useMemo(() => {
    if (expiresIn <= 0) return 'OTP expired. Request a new code.';
    return `OTP expires in ${formatSeconds(expiresIn)}`;
  }, [expiresIn]);

  const handleRequestOtp = requestOtpForm.handleSubmit(async (values) => {
    try {
      setSendingOtp(true);
      const response = await api.requestPasswordResetOtp(values.email);
      if (!response.success || !response.data) {
        toast.error(response.error ?? 'Failed to send OTP');
        return;
      }

      setEmail(values.email.trim().toLowerCase());
      setExpiresIn(response.data.expiresInSeconds);
      setResendAfter(response.data.resendAfterSeconds);
      resetPasswordForm.reset({
        otp: '',
        newPassword: '',
        confirmPassword: '',
      });
      setStep('reset');
      toast.success(response.message ?? 'If an account exists, OTP has been sent');
    } finally {
      setSendingOtp(false);
    }
  });

  const handleResetPassword = resetPasswordForm.handleSubmit(async (values) => {
    try {
      setResettingPassword(true);
      const response = await api.resetPasswordWithOtp({
        email,
        otp: values.otp.trim(),
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (!response.success) {
        toast.error(response.error ?? 'Unable to reset password');
        return;
      }

      toast.success(response.message ?? 'Password reset successful');
      router.push('/login');
    } finally {
      setResettingPassword(false);
    }
  });

  const handleResendOtp = async () => {
    if (!email || resendAfter > 0 || sendingOtp || resettingPassword) return;
    requestOtpForm.setValue('email', email);
    await handleRequestOtp();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {step === 'request' ? 'Forgot your password?' : 'Reset your password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'request'
              ? 'Enter your email address and we will send you an OTP.'
              : <>OTP sent to <span className="font-medium text-gray-800">{email}</span></>}
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            Remembered it?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {step === 'request' ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOtp}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <input
                  {...requestOtpForm.register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                />
                <Mail className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
              </div>
              {requestOtpForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{requestOtpForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={sendingOtp}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {otpStatus}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP</label>
                <div className="mt-1 relative">
                  <input
                    {...resetPasswordForm.register('otp', {
                      required: 'OTP is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Enter the 6-digit OTP',
                      },
                    })}
                    inputMode="numeric"
                    maxLength={6}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 tracking-[0.3em] focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="000000"
                  />
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
                </div>
                {resetPasswordForm.formState.errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{resetPasswordForm.formState.errors.otp.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New password</label>
                <div className="mt-1 relative">
                  <input
                    {...resetPasswordForm.register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                    type="password"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter new password"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
                </div>
                {resetPasswordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{resetPasswordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
                <div className="mt-1 relative">
                  <input
                    {...resetPasswordForm.register('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (value) =>
                        value === resetPasswordForm.getValues('newPassword') || 'Passwords do not match',
                    })}
                    type="password"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Confirm new password"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-2.5 z-10 h-5 w-5 text-gray-400" />
                </div>
                {resetPasswordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={resettingPassword || expiresIn <= 0}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resettingPassword ? 'Updating password...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendAfter > 0 || sendingOtp || resettingPassword}
                className="w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingOtp ? 'Sending OTP...' : 'Resend OTP'}
              </button>
              {resendAfter > 0 && (
                <p className="text-center text-xs text-gray-500">
                  You can request a new OTP after the current cooldown ends.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
