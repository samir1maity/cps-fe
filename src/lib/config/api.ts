/**
 * API Configuration
 */
const BASE = '/api/v1';

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: `${BASE}/auth/login`,
      SIGNUP: `${BASE}/auth/signup`,
      LOGOUT: `${BASE}/auth/logout`,
      REFRESH: `${BASE}/auth/refresh`,
      ME: `${BASE}/auth/me`,
    },
    PRODUCTS: {
      LIST: `${BASE}/products`,
      DETAIL: (id: string) => `${BASE}/products/${id}`,
    },
    CATEGORIES: {
      LIST: `${BASE}/categories`,
      DETAIL: (slug: string) => `${BASE}/categories/${slug}`,
    },
    CART: {
      GET: `${BASE}/cart`,
      ADD: `${BASE}/cart`,
      UPDATE: (itemId: string) => `${BASE}/cart/${itemId}`,
      REMOVE: (itemId: string) => `${BASE}/cart/${itemId}`,
      CLEAR: `${BASE}/cart/clear`,
    },
    ORDERS: {
      LIST: `${BASE}/orders`,
      CREATE: `${BASE}/orders`,
      DETAIL: (id: string) => `${BASE}/orders/${id}`,
      VERIFY_PAYMENT: `${BASE}/orders/verify-payment`,
      CANCEL: (id: string) => `${BASE}/orders/${id}/cancel`,
    },
    WISHLIST: {
      GET: `${BASE}/wishlist`,
      ADD: `${BASE}/wishlist`,
      REMOVE: (productId: string) => `${BASE}/wishlist/${productId}`,
    },
    REVIEWS: {
      BY_PRODUCT: (productId: string) => `${BASE}/reviews/product/${productId}`,
      CREATE: `${BASE}/reviews`,
    },
    COUPONS: {
      VALIDATE: `${BASE}/coupons/validate`,
    },
    NOTIFICATIONS: {
      LIST: `${BASE}/notifications`,
      READ: (id: string) => `${BASE}/notifications/${id}/read`,
      READ_ALL: `${BASE}/notifications/read-all`,
    },
    RETURNS: {
      LIST: `${BASE}/returns`,
      CREATE: `${BASE}/returns`,
      DETAIL: (id: string) => `${BASE}/returns/${id}`,
    },
    PROFILE: {
      GET: `${BASE}/profile`,
      UPDATE: `${BASE}/profile`,
      CHANGE_PASSWORD: `${BASE}/profile/change-password`,
      ADDRESSES: `${BASE}/profile/addresses`,
      ADDRESS: (id: string) => `${BASE}/profile/addresses/${id}`,
    },
    ADMIN: {
      STATS: `${BASE}/admin/stats`,
      ORDERS: `${BASE}/admin/orders`,
      ORDER_STATUS: (id: string) => `${BASE}/admin/orders/${id}/status`,
      USERS: `${BASE}/admin/users`,
      TOGGLE_BLOCK: (id: string) => `${BASE}/admin/users/${id}/toggle-block`,
      RETURNS: `${BASE}/admin/returns`,
      COUPONS: `${BASE}/admin/coupons`,
      CATEGORIES: `${BASE}/admin/categories`,
      CATEGORY: (id: string) => `${BASE}/admin/categories/${id}`,
    },
    ADMIN_PRODUCTS: {
      LIST: `${BASE}/products`,
      CREATE: `${BASE}/products`,
      UPDATE: (id: string) => `${BASE}/products/${id}`,
      DELETE: (id: string) => `${BASE}/products/${id}`,
    },
    HEALTH: '/health',
  },
};


