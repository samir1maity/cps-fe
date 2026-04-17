'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, ArrowLeft, X, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { uploadManyToS3 } from '@/lib/hooks/useS3Upload';
import { useSignedUrl } from '@/lib/hooks/useSignedUrls';
import toast from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  subcategoryId: string;
  brand: string;
  stockQuantity: string;
  tags: string;
}

const emptyForm: ProductFormData = {
  name: '', description: '', price: '', originalPrice: '',
  categoryId: '', subcategoryId: '', brand: '', stockQuantity: '', tags: '',
};

// ── Small sub-components ──────────────────────────────────────────────────────

/** Resolves a single image key to a signed URL and renders it. */
function ProductImage({ imageKey, name }: { imageKey?: string; name: string }) {
  const url = useSignedUrl(imageKey);
  if (url) {
    return <img src={url} alt={name} className="h-10 w-10 rounded object-cover" />;
  }
  return (
    <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Package className="h-5 w-5 text-gray-400" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const topLevelCategories = categories.filter((c) => !c.parentId);
  const subcategories = form.categoryId
    ? categories.filter(
        (c) => c.parentId != null && String(c.parentId) === String(form.categoryId),
      )
    : [];

  useEffect(() => {
    Promise.all([loadProducts(), loadCategories()]).then(() => {
      if (searchParams.get('action') === 'new') openCreate();
    });
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const res = await api.getProducts({ limit: 50 });
    if (res.data) setProducts(res.data);
    setLoading(false);
  };

  const loadCategories = async () => {
    const res = await api.getAdminCategories();
    if (res.success && res.data) {
      const flat: Category[] = [];
      res.data.forEach((cat) => {
        flat.push({ ...cat, id: String(cat.id) });
        cat.children?.forEach((child) =>
          flat.push({ ...child, id: String(child.id), parentId: String(child.parentId) }),
        );
      });
      setCategories(flat);
    }
  };

  const openForm = (data: ProductFormData, id: string | null) => {
    setShowForm(false);
    setTimeout(() => {
      setEditingId(id);
      setForm(data);
      setImageFiles([]);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const openCreate = () => openForm(emptyForm, null);

  const openEdit = (product: Product) => {
    const catId = (product.category as any)?._id ?? product.category?.id ?? '';
    const subId = (product.subcategory as any)?._id ?? product.subcategory?.id ?? '';
    openForm(
      {
        name: product.name,
        description: product.description,
        price: String(product.price),
        originalPrice: String(product.originalPrice ?? ''),
        categoryId: String(catId),
        subcategoryId: String(subId),
        brand: product.brand ?? '',
        stockQuantity: String(product.stockQuantity),
        tags: product.tags?.join(', ') ?? '',
      },
      product.id,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload each selected file directly to S3; get back storage keys.
      const newKeys = imageFiles.length > 0
        ? await uploadManyToS3(imageFiles, 'products')
        : [];

      const tagsArray = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const body: Record<string, string> = {
        name: form.name,
        description: form.description,
        price: form.price,
        categoryId: form.categoryId,
        stockQuantity: form.stockQuantity,
        tags: JSON.stringify(tagsArray),
        imageKeys: JSON.stringify(newKeys),
      };
      if (form.originalPrice) body.originalPrice = form.originalPrice;
      if (form.subcategoryId) body.subcategoryId = form.subcategoryId;
      if (form.brand) body.brand = form.brand;

      // Send JSON — no multipart, no file bytes through our server.
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/products/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/products`;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || 'Request failed');

      toast.success(editingId ? 'Product updated' : 'Product created');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setImageFiles([]);
      loadProducts();
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    const res = await api.deleteAdminProduct(product.id);
    if (res.success) {
      toast.success('Product deleted');
      loadProducts();
    } else {
      toast.error(res.error ?? 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Manage Products</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                <input
                  required type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategoryId: '' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {topLevelCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                <select
                  value={form.subcategoryId}
                  onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
                  disabled={!form.categoryId || subcategories.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">None</option>
                  {subcategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Creative Pottery Studio"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input
                  required type="number" min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="handmade, pottery, ceramic"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images {editingId ? '(upload to add new images)' : ''}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-gray-50 hover:file:bg-gray-100"
                />
                {imageFiles.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{imageFiles.length} file(s) selected — uploaded securely to S3</p>
                )}
              </div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Uploading & Saving…' : editingId ? 'Save Changes' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                  className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            No products yet. Click "Add Product" to create one.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage imageKey={product.images?.[0]} name={product.name} />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {product.category?.name}
                      {product.subcategory && (
                        <span className="text-gray-400"> / {product.subcategory.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-900 font-medium">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {product.inStock ? `${product.stockQuantity} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="text-gray-400 hover:text-blue-600 p-1">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
