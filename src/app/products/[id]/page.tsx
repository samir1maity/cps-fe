// src/app/products/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  ShoppingCart, 
  Share2, 
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';
import { Product } from '@/lib/types';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePendingActions } from '@/hooks/usePendingActions';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/formatters';

const ProductPage: React.FC = () => {
  const params = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { requireAuthForCart, requireAuthForWishlist } = useRequireAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Handle pending actions after login
  usePendingActions();

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productResponse = await api.getProduct(params.id as string);

      if (productResponse.success && productResponse.data) {
        setProduct(productResponse.data);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check auth and redirect if needed
    if (!requireAuthForCart(product.id, quantity)) {
      return;
    }
    
    await addToCart(product, quantity);
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    
    // Check auth and redirect if needed
    if (!requireAuthForWishlist(product.id)) {
      return;
    }
    
    toast.success('Added to wishlist');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-blue-600">
            {product.category.name}
          </Link>
          {product.subcategory && (
            <>
              <span>/</span>
              <Link
                href={`/categories/${product.category.slug}/${product.subcategory.slug}`}
                className="hover:text-blue-600"
              >
                {product.subcategory.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg shadow-md overflow-hidden">
              <Image
                src={product.images[selectedImage] || '/images/placeholder.jpg'}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg shadow-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image || '/images/placeholder.jpg'}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{product.description}</p>
              
              {/* Ratings removed */}

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                    Save {formatCurrency(product.originalPrice - product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {product.stockQuantity} in stock
                </span>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart className="h-5 w-5" />
                </button>
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-600">30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications only (reviews removed) */}
        <div className="mt-16">
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button className="py-4 px-1 border-b-2 border-blue-600 text-blue-600 font-medium">
                  Specifications
                </button>
              </nav>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">{key}</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
