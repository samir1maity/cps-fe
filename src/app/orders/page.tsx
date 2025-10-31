// src/app/orders/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import Image from 'next/image';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getOrders(user!.id);
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'CONFIRMED':
      case 'PROCESSING':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'SHIPPED':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view orders</h2>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/profile"
            className="text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
            <p className="text-gray-600 mb-8">Start shopping to see your orders here</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <Image
                          src={item.product.images[0] || '/images/placeholder.jpg'}
                          alt={item.product.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × ${item.price}
                          </p>
                        </div>
                        <span className="font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm text-gray-600">
                          {order.trackingNumber && `Tracking: ${order.trackingNumber}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          Total: ${order.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.paymentStatus} • {order.paymentMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;




