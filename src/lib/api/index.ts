// src/lib/api/index.ts
import { 
  Product, 
  Category, 
  User, 
  Order, 
  Review, 
  Coupon, 
  CartItem, 
  WishlistItem,
  ApiResponse,
  PaginatedResponse 
} from '@/lib/types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const api = {
  // Products
  async getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    await delay(500);
    
    let filteredProducts = [...products];
    
    if (filters?.category) {
      filteredProducts = filteredProducts.filter(p => p.category.slug === filters.category);
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.brand.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters?.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters?.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters?.inStock !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.inStock === filters.inStock);
    }
    
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: filteredProducts.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
      },
    };
  },

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    await delay(300);
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    return { success: true, data: product };
  },

  // Categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    await delay(200);
    return { success: true, data: categories };
  },

  async getCategory(slug: string): Promise<ApiResponse<Category>> {
    await delay(200);
    const category = categories.find(c => c.slug === slug);
    
    if (!category) {
      return { success: false, error: 'Category not found' };
    }
    
    return { success: true, data: category };
  },

  // Cart
  async getCart(userId: string): Promise<ApiResponse<CartItem[]>> {
    await delay(200);
    // In a real app, this would fetch from the database
    return { success: true, data: [] };
  },

  async addToCart(userId: string, productId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    await delay(300);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    if (!product.inStock) {
      return { success: false, error: 'Product out of stock' };
    }
    
    // In a real app, this would save to the database
    const cartItem: CartItem = {
      id: Date.now().toString(),
      productId,
      product,
      quantity,
      userId,
    };
    
    return { success: true, data: cartItem };
  },

  async updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    await delay(200);
    // In a real app, this would update the database
    return { success: true, data: {} as CartItem };
  },

  async removeFromCart(itemId: string): Promise<ApiResponse<void>> {
    await delay(200);
    // In a real app, this would remove from the database
    return { success: true };
  },

  // Wishlist
  async getWishlist(userId: string): Promise<ApiResponse<WishlistItem[]>> {
    await delay(200);
    return { success: true, data: [] };
  },

  async addToWishlist(userId: string, productId: string): Promise<ApiResponse<WishlistItem>> {
    await delay(300);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    const wishlistItem: WishlistItem = {
      id: Date.now().toString(),
      userId,
      productId,
      product,
      createdAt: new Date(),
    };
    
    return { success: true, data: wishlistItem };
  },

  async removeFromWishlist(itemId: string): Promise<ApiResponse<void>> {
    await delay(200);
    return { success: true };
  },

  // Orders
  async getOrders(userId: string): Promise<ApiResponse<Order[]>> {
    await delay(300);
    const userOrders = orders.filter(o => o.userId === userId);
    return { success: true, data: userOrders };
  },

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    await delay(200);
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    return { success: true, data: order };
  },

  async createOrder(orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    await delay(500);
    // In a real app, this would create the order in the database
    const newOrder: Order = {
      id: Date.now().toString(),
      ...orderData,
    } as Order;
    
    return { success: true, data: newOrder };
  },

  // Reviews
  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    await delay(200);
    const productReviews = reviews.filter(r => r.productId === productId);
    return { success: true, data: productReviews };
  },

  async createReview(reviewData: Partial<Review>): Promise<ApiResponse<Review>> {
    await delay(300);
    const newReview: Review = {
      id: Date.now().toString(),
      ...reviewData,
    } as Review;
    
    return { success: true, data: newReview };
  },

  // Coupons
  async validateCoupon(code: string): Promise<ApiResponse<Coupon>> {
    await delay(200);
    const coupon = coupons.find(c => c.code === code && c.isActive);
    
    if (!coupon) {
      return { success: false, error: 'Invalid or expired coupon' };
    }
    
    if (coupon.validUntil < new Date()) {
      return { success: false, error: 'Coupon has expired' };
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, error: 'Coupon usage limit reached' };
    }
    
    return { success: true, data: coupon };
  },

  // Auth
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    await delay(500);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // In a real app, you would verify the password hash
    return { success: true, data: user };
  },

  async register(userData: Partial<User>): Promise<ApiResponse<User>> {
    await delay(500);
    const existingUser = users.find(u => u.email === userData.email);
    
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      role: 'USER',
      addresses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    
    return { success: true, data: newUser };
  },

  // Admin functions
  async getAdminStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
  }>> {
    await delay(300);
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    return {
      success: true,
      data: {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
      },
    };
  },

  async getAdminOrders(): Promise<ApiResponse<Order[]>> {
    await delay(300);
    return { success: true, data: orders };
  },

  async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<Order>> {
    await delay(300);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    order.status = status as any;
    order.updatedAt = new Date();
    
    return { success: true, data: order };
  },
};

// Import dummy data
import { products, categories, users, orders, reviews, coupons } from '@/data/dummyData';




