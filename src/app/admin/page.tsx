'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/formatters';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAdminStats();
        if (res.success && res.data) setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            bg="bg-blue-100"
            label="Total Users"
            value={stats.totalUsers}
          />
          <StatCard
            icon={<ShoppingCart className="h-6 w-6 text-green-600" />}
            bg="bg-green-100"
            label="Total Orders"
            value={stats.totalOrders}
          />
          <StatCard
            icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
            bg="bg-yellow-100"
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
          />
          <StatCard
            icon={<Package className="h-6 w-6 text-purple-600" />}
            bg="bg-purple-100"
            label="Total Products"
            value={stats.totalProducts}
          />
        </div>

        {/* Quick Actions — full width */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              icon={<ClipboardList className="h-5 w-5 text-orange-600" />}
              label="Manage Orders"
              onClick={() => router.push('/admin/orders')}
            />
            <QuickAction
              icon={<Users className="h-5 w-5 text-green-600" />}
              label="Manage Users"
              onClick={() => router.push('/admin/users')}
            />
            <QuickAction
              icon={<Package className="h-5 w-5 text-purple-600" />}
              label="Manage Products"
              onClick={() => router.push('/admin/products')}
            />
            <QuickAction
              icon={<TrendingUp className="h-5 w-5 text-yellow-600" />}
              label="Manage Categories"
              onClick={() => router.push('/admin/categories')}
            />
            <QuickAction
              icon={<ScrollText className="h-5 w-5 text-slate-600" />}
              label="Payment Logs"
              onClick={() => router.push('/admin/payment-logs')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 ${bg} rounded-lg`}>{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <span className="text-gray-400">→</span>
    </button>
  );
}

export default AdminDashboard;
