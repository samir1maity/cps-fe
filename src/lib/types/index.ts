// src/lib/types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  phone?: string;
  isBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  user: string;
  label?: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category;
  subcategory?: Category;
  brand: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  specifications: Record<string, string>;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  children?: Category[];
  productCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  userId: string;
}

export interface Order {
  id: string;
  userId: string;
  user: User;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentAuditLog {
  id: string;
  scope: 'PAYMENT' | 'ORDER' | 'REFUND';
  event: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  order?: Pick<Order, 'id' | 'status' | 'paymentStatus' | 'total' | 'createdAt'>;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  paymentId?: string;
  razorpayOrderId?: string;
  refundId?: string;
  meta?: Record<string, string>;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  name?: string;
  image?: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'RAZORPAY'
  | 'CASH_ON_DELIVERY';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  user: User;
  productId: string;
  product: Product;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}




