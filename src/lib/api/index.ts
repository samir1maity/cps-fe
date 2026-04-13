// src/lib/api/index.ts
import {
  Product,
  Category,
  User,
  Order,
  Address,
  Review,
  Coupon,
  CartItem,
  WishlistItem,
  ApiResponse,
  PaginatedResponse,
} from '@/lib/types';
import { API_CONFIG } from '@/lib/config/api';
import { HttpClient } from '@/lib/utils/httpClient';

// Initialize HTTP client
const httpClient = new HttpClient(API_CONFIG.BASE_URL);

const normalizeProduct = (p: any): Product => ({
  ...p,
  id: p.id ?? p._id,
  images: Array.isArray(p.images) ? p.images : [],
  category: p.category ? { ...p.category, id: p.category.id ?? p.category._id } : p.category,
  subcategory: p.subcategory ? { ...p.subcategory, id: p.subcategory.id ?? p.subcategory._id } : p.subcategory,
});

const normalizeCartItems = (items: any[]): CartItem[] =>
  (items ?? []).map((item: any) => ({
    ...item,
    id: item.id ?? item._id,
    product: normalizeProduct(item.product),
  }));

const normalizeAddress = (a: any): Address => ({
  ...a,
  id: a.id ?? a._id,
});

const normalizeOrder = (o: any): any => ({
  ...o,
  id: o.id ?? o._id,
  shippingAddress: o.shippingAddress ? normalizeAddress(o.shippingAddress) : undefined,
  items: (o.items ?? []).map((item: any) => ({
    ...item,
    id: item.id ?? item._id,
    product: {
      id: item.product ?? '',
      name: item.name ?? '',
      images: item.image ? [item.image] : [],
      price: item.price ?? 0,
    },
    price: item.price ?? 0,
  })),
});

export const api = {
  // Products
  async getProducts(filters?: {
    category?: string;
    subcategory?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.subcategory) params.set('subcategory', filters.subcategory);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters?.inStock !== undefined) params.set('inStock', String(filters.inStock));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.sort) params.set('sort', filters.sort);

    const query = params.toString();
    const url = `${API_CONFIG.ENDPOINTS.PRODUCTS.LIST}${query ? '?' + query : ''}`;
    const response = await httpClient.get<any>(url);
    return {
      data: (response.data || []).map(normalizeProduct),
      pagination: response.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 },
    };
  },

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.PRODUCTS.DETAIL(id));
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Product not found' };
    }
  },

  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.CATEGORIES.LIST);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getCategory(slug: string): Promise<ApiResponse<Category>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.CATEGORIES.DETAIL(slug));
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Cart
  async getCart(_userId: string): Promise<ApiResponse<CartItem[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.CART.GET);
      return { success: true, data: normalizeCartItems(response.data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async addToCart(_userId: string, productId: string, quantity: number): Promise<ApiResponse<CartItem[]>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.CART.ADD, { productId, quantity });
      return { success: true, data: normalizeCartItems(response.data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<CartItem[]>> {
    try {
      const response = await httpClient.put<any>(API_CONFIG.ENDPOINTS.CART.UPDATE(itemId), { quantity });
      return { success: true, data: normalizeCartItems(response.data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async removeFromCart(itemId: string): Promise<ApiResponse<void>> {
    try {
      await httpClient.delete(API_CONFIG.ENDPOINTS.CART.REMOVE(itemId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Wishlist
  async getWishlist(_userId: string): Promise<ApiResponse<WishlistItem[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.WISHLIST.GET);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async addToWishlist(_userId: string, productId: string): Promise<ApiResponse<void>> {
    try {
      await httpClient.post(API_CONFIG.ENDPOINTS.WISHLIST.ADD, { productId });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async removeFromWishlist(productId: string): Promise<ApiResponse<void>> {
    try {
      await httpClient.delete(API_CONFIG.ENDPOINTS.WISHLIST.REMOVE(productId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Orders
  async getOrders(_userId: string): Promise<ApiResponse<Order[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.ORDERS.LIST);
      return { success: true, data: (response.data ?? []).map(normalizeOrder) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.ORDERS.DETAIL(id));
      return { success: true, data: normalizeOrder(response.data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createOrder(orderData: {
    addressId?: string;
    shippingAddress?: Record<string, string>;
    saveAddress?: boolean;
    paymentMethod?: string;
    couponCode?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.ORDERS.CREATE, orderData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async verifyPayment(payload: {
    orderId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }): Promise<ApiResponse<Order>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.ORDERS.VERIFY_PAYMENT, payload);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await httpClient.patch<any>(API_CONFIG.ENDPOINTS.ORDERS.CANCEL(orderId));
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Reviews
  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.REVIEWS.BY_PRODUCT(productId));
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createReview(reviewData: {
    productId: string;
    orderId: string;
    rating: number;
    title?: string;
    comment: string;
  }): Promise<ApiResponse<Review>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.REVIEWS.CREATE, reviewData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Coupons
  async validateCoupon(code: string, orderAmount?: number): Promise<ApiResponse<Coupon>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.COUPONS.VALIDATE, { code, orderAmount });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Notifications
  async getNotifications(): Promise<ApiResponse<any[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async markNotificationRead(id: string): Promise<ApiResponse<void>> {
    try {
      await httpClient.patch(API_CONFIG.ENDPOINTS.NOTIFICATIONS.READ(id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Returns
  async createReturnRequest(data: {
    orderId: string;
    orderItemId: string;
    reason: string;
    description?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.RETURNS.CREATE, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getUserReturns(): Promise<ApiResponse<any[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.RETURNS.LIST);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Profile
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.PROFILE.GET);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateProfile(data: { name?: string; phone?: string }): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.put<any>(API_CONFIG.ENDPOINTS.PROFILE.UPDATE, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getAddresses(): Promise<ApiResponse<Address[]>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.PROFILE.ADDRESSES);
      return { success: true, data: (response.data ?? []).map(normalizeAddress) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async addAddress(address: Omit<Address, 'id' | 'user'>): Promise<ApiResponse<Address>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.PROFILE.ADDRESSES, address);
      return { success: true, data: normalizeAddress(response.data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateAddress(addressId: string, data: Partial<Omit<Address, 'id' | 'user'>>): Promise<ApiResponse<Address>> {
    try {
      const response = await httpClient.put<any>(API_CONFIG.ENDPOINTS.PROFILE.ADDRESS(addressId), data);
      return { success: true, data: normalizeAddress(response.data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async deleteAddress(addressId: string): Promise<ApiResponse<void>> {
    try {
      await httpClient.delete(API_CONFIG.ENDPOINTS.PROFILE.ADDRESS(addressId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Auth
  async login(email: string, password: string): Promise<ApiResponse<User & { accessToken?: string; refreshToken?: string }>> {
    try {
      const response = await httpClient.post<{
        success: boolean;
        data?: { user: User; accessToken: string; refreshToken: string };
        error?: string;
        message?: string;
      }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password });

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return {
          success: true,
          data: {
            ...response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          },
        };
      }
      return { success: false, error: response.error || response.message || 'Login failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred during login' };
    }
  },

  async register(userData: Partial<User> & { password: string }): Promise<ApiResponse<User & { accessToken?: string; refreshToken?: string }>> {
    try {
      const response = await httpClient.post<{
        success: boolean;
        data?: { user: User; accessToken: string; refreshToken: string };
        error?: string;
        message?: string;
      }>(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return {
          success: true,
          data: {
            ...response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          },
        };
      }
      return { success: false, error: response.error || response.message || 'Registration failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred during registration' };
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    try {
      await httpClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return { success: true };
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.get<{ success: boolean; data?: User }>(API_CONFIG.ENDPOINTS.AUTH.ME);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return { success: false, error: 'No refresh token available' };

      const response = await httpClient.post<{
        success: boolean;
        data?: { accessToken: string; refreshToken: string };
        error?: string;
      }>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, { refreshToken });

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error || 'Failed to refresh token' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Admin
  async getAdminStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalCategories: number;
  }>> {
    try {
      const response = await httpClient.get<any>(API_CONFIG.ENDPOINTS.ADMIN.STATS);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getAdminOrders(page = 1, status?: string): Promise<ApiResponse<Order[]>> {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      const response = await httpClient.get<any>(`${API_CONFIG.ENDPOINTS.ADMIN.ORDERS}?${params}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<ApiResponse<Order>> {
    try {
      const response = await httpClient.patch<any>(
        API_CONFIG.ENDPOINTS.ADMIN.ORDER_STATUS(orderId),
        { status, trackingNumber }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getAdminUsers(page = 1, search?: string): Promise<ApiResponse<User[]>> {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const response = await httpClient.get<any>(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}?${params}`);
      const users = (response.data ?? []).map((u: any) => ({ ...u, id: u.id ?? u._id }));
      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async toggleUserBlock(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.patch<any>(API_CONFIG.ENDPOINTS.ADMIN.TOGGLE_BLOCK(userId), {});
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Admin Categories
  async getAdminCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await httpClient.get<any>(`${API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES}?includeInactive=true`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createAdminCategory(data: { name: string; description?: string; image?: string; parentId?: string | null }): Promise<ApiResponse<Category>> {
    try {
      const response = await httpClient.post<any>(API_CONFIG.ENDPOINTS.ADMIN.CATEGORIES, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateAdminCategory(id: string, data: { name?: string; description?: string; image?: string; parentId?: string | null; isActive?: boolean }): Promise<ApiResponse<Category>> {
    try {
      const response = await httpClient.put<any>(API_CONFIG.ENDPOINTS.ADMIN.CATEGORY(id), data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async deleteAdminCategory(id: string, hard = false): Promise<ApiResponse<void>> {
    try {
      await httpClient.delete<any>(`${API_CONFIG.ENDPOINTS.ADMIN.CATEGORY(id)}${hard ? '?hard=true' : ''}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Admin Products
  async createAdminProduct(formData: FormData): Promise<ApiResponse<Product>> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_PRODUCTS.CREATE}`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || 'Failed to create product');
      return { success: true, data: json.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateAdminProduct(id: string, formData: FormData): Promise<ApiResponse<Product>> {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_PRODUCTS.UPDATE(id)}`, {
        method: 'PUT',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || 'Failed to update product');
      return { success: true, data: json.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async deleteAdminProduct(id: string): Promise<ApiResponse<void>> {
    try {
      await httpClient.delete<any>(API_CONFIG.ENDPOINTS.ADMIN_PRODUCTS.DELETE(id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

