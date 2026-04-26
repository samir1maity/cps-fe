'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, ArrowLeft, X, Package, Star, Upload, Palette } from 'lucide-react';
import { api } from '@/lib/api';
import { Product, Category, ProductColor } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { uploadToS3, uploadManyToS3 } from '@/lib/hooks/useS3Upload';
import { useSignedUrl } from '@/lib/hooks/useSignedUrls';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  isFeatured: boolean;
}

interface SpecEntry { key: string; value: string; }
interface ExistingImage { key: string; }

// A color variant in the form. imageKey is set after upload; newFile is the pending file.
interface ColorEntry {
  _id?: string;          // existing subdocument id — preserved on edit so MongoDB doesn't regenerate
  name: string;
  imageKey: string;      // stored key (existing or uploaded)
  newFile?: File;        // pending upload
  previewUrl?: string;   // local object URL for new file
}

const emptyForm: ProductFormData = {
  name: '', description: '', price: '', originalPrice: '',
  categoryId: '', subcategoryId: '', brand: '', stockQuantity: '', tags: '',
  isFeatured: false,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ProductImage({ imageKey, name }: { imageKey?: string; name: string }) {
  const url = useSignedUrl(imageKey);
  if (url) return <img src={url} alt={name} className="h-10 w-10 rounded object-cover" />;
  return (
    <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Package className="h-5 w-5 text-gray-400" />
    </div>
  );
}

function ImageTile({
  src, isPrimary, onSetPrimary, onRemove,
}: {
  src: string; isPrimary: boolean; onSetPrimary: () => void; onRemove: () => void;
}) {
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${
      isPrimary ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
    }`}>
      <div className="aspect-square bg-gray-100">
        <img src={src} alt="product" className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center gap-1 p-1 bg-white">
        <button
          type="button"
          onClick={onSetPrimary}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-colors ${
            isPrimary
              ? 'bg-blue-500 text-white cursor-default'
              : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <Star className={`h-3 w-3 ${isPrimary ? 'fill-white' : ''}`} />
          {isPrimary ? 'Primary' : 'Set main'}
        </button>
        <button type="button" onClick={onRemove} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ExistingImageTile({ imgKey, isPrimary, onSetPrimary, onRemove }: {
  imgKey: string; isPrimary: boolean; onSetPrimary: () => void; onRemove: () => void;
}) {
  const url = useSignedUrl(imgKey);
  if (!url) return (
    <div className="rounded-xl border-2 border-gray-200 aspect-square bg-gray-100 flex items-center justify-center">
      <Package className="h-6 w-6 text-gray-300" />
    </div>
  );
  return <ImageTile src={url} isPrimary={isPrimary} onSetPrimary={onSetPrimary} onRemove={onRemove} />;
}

function ColorImagePreview({ imageKey, previewUrl }: { imageKey?: string; previewUrl?: string }) {
  const signedUrl = useSignedUrl(imageKey && !previewUrl ? imageKey : undefined);
  const src = previewUrl ?? signedUrl;
  if (!src) return (
    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Palette className="h-5 w-5 text-gray-300" />
    </div>
  );
  return <img src={src} alt="color" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200" />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const pendingColorIndexRef = useRef<number>(-1);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [specs, setSpecs] = useState<SpecEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Product images
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Color variants
  const [colors, setColors] = useState<ColorEntry[]>([]);

  // Image mode: 'standard' = plain images, 'color' = per-color images
  const [imageMode, setImageMode] = useState<'standard' | 'color'>('standard');

  const topLevelCategories = categories.filter((c) => !c.parentId);
  const subcategories = form.categoryId
    ? categories.filter((c) => c.parentId != null && String(c.parentId) === String(form.categoryId))
    : [];

  const keptExisting = existingImages;
  const totalImageCount = keptExisting.length + newFiles.length;

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

  const resetImageState = () => {
    setExistingImages([]);
    setNewFiles([]);
    setPrimaryIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openForm = (
    data: ProductFormData,
    id: string | null,
    specEntries: SpecEntry[] = [],
    imgKeys: string[] = [],
    colorVariants: ProductColor[] = [],
  ) => {
    setShowForm(false);
    setTimeout(() => {
      setEditingId(id);
      setForm(data);
      setSpecs(specEntries);
      setExistingImages(imgKeys.map((key) => ({ key })));
      setNewFiles([]);
      setPrimaryIndex(0);
      const loadedColors = colorVariants.map((c) => ({ _id: c._id, name: c.name, imageKey: c.imageKey }));
      setColors(loadedColors);
      // Auto-select mode based on existing data
      setImageMode(loadedColors.length > 0 ? 'color' : 'standard');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const openCreate = () => openForm(emptyForm, null, [], [], []);

  const openEdit = (product: Product) => {
    const catId = (product.category as any)?._id ?? product.category?.id ?? '';
    const subId = (product.subcategory as any)?._id ?? product.subcategory?.id ?? '';
    const specEntries: SpecEntry[] = Object.entries(product.specifications ?? {}).map(
      ([key, value]) => ({ key, value }),
    );
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
        isFeatured: product.isFeatured ?? false,
      },
      product.id,
      specEntries,
      product.images ?? [],
      product.colors ?? [],
    );
  };

  const switchImageMode = (mode: 'standard' | 'color') => {
    if (mode === imageMode) return;
    if (mode === 'standard') {
      // clear color state
      colors.forEach((c) => { if (c.previewUrl) URL.revokeObjectURL(c.previewUrl); });
      setColors([]);
    } else {
      // clear standard image state
      resetImageState();
    }
    setImageMode(mode);
  };

  // ── Spec helpers ──────────────────────────────────────────────────────────
  const addSpec = () => setSpecs((prev) => [...prev, { key: '', value: '' }]);
  const removeSpec = (i: number) => setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));

  // ── Image helpers ─────────────────────────────────────────────────────────
  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    if (totalImageCount + selected.length > 6) {
      toast.error(`You can have at most 6 images (currently ${totalImageCount})`);
      e.target.value = '';
      return;
    }
    setNewFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  };

  const removeNewFile = (i: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
    const absIndex = keptExisting.length + i;
    if (primaryIndex === absIndex) setPrimaryIndex(0);
    else if (primaryIndex > absIndex) setPrimaryIndex((p) => p - 1);
  };

  // ── Color helpers ─────────────────────────────────────────────────────────
  const addColor = () =>
    setColors((prev) => [...prev, { name: '', imageKey: '', previewUrl: undefined }]);

  const removeColor = (i: number) => {
    setColors((prev) => {
      const entry = prev[i];
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const updateColorName = (i: number, val: string) =>
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, name: val } : c)));

  const triggerColorFileInput = (i: number) => {
    pendingColorIndexRef.current = i;
    colorFileInputRef.current?.click();
  };

  const handleColorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = pendingColorIndexRef.current;
    e.target.value = '';
    if (!file || idx < 0) return;
    if (file.size > 250 * 1024) {
      toast.error('Color image must not exceed 250 KB');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setColors((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
        return { ...c, newFile: file, previewUrl, imageKey: '' };
      }),
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (imageMode === 'standard') {
        if (!editingId && newFiles.length === 0) {
          toast.error('Please select at least 1 image');
          setSubmitting(false);
          return;
        }
        if (totalImageCount === 0) {
          toast.error('Product must have at least 1 image');
          setSubmitting(false);
          return;
        }
      } else {
        if (colors.length === 0) {
          toast.error('Add at least 1 color variant');
          setSubmitting(false);
          return;
        }
        for (const c of colors) {
          if (!c.name.trim()) {
            toast.error('Every color variant must have a name');
            setSubmitting(false);
            return;
          }
          if (!c.imageKey && !c.newFile) {
            toast.error(`Color "${c.name || 'unnamed'}" is missing an image`);
            setSubmitting(false);
            return;
          }
        }
      }

      // Upload product images (standard mode)
      const newKeys = imageMode === 'standard' && newFiles.length > 0
        ? await uploadManyToS3(newFiles, 'products')
        : [];
      const keptKeys = imageMode === 'standard' ? keptExisting.map((img) => img.key) : [];
      const allKeys = [...keptKeys, ...newKeys];
      const orderedKeys = allKeys.length > 0
        ? [allKeys[primaryIndex], ...allKeys.filter((_, i) => i !== primaryIndex)]
        : [];

      // Upload color images (color mode)
      const resolvedColors: Array<{ _id?: string; name: string; imageKey: string }> =
        imageMode === 'color'
          ? await Promise.all(
              colors.map(async (c) => {
                if (c.newFile) {
                  const key = await uploadToS3(c.newFile, 'products');
                  return { _id: c._id, name: c.name.trim(), imageKey: key };
                }
                return { _id: c._id, name: c.name.trim(), imageKey: c.imageKey };
              }),
            )
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
        imageKeys: JSON.stringify(editingId ? newKeys : orderedKeys),
        colors: JSON.stringify(resolvedColors),
      };

      if (form.originalPrice) body.originalPrice = form.originalPrice;
      if (form.subcategoryId) body.subcategoryId = form.subcategoryId;
      if (form.brand) body.brand = form.brand;
      body.isFeatured = String(form.isFeatured);

      const specsObj = Object.fromEntries(
        specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()]),
      );
      body.specifications = JSON.stringify(specsObj);

      if (editingId) {
        body.orderedImageKeys = JSON.stringify(orderedKeys);
      }

      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
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
      setSpecs([]);
      setColors([]);
      setImageMode('standard');
      resetImageState();
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

  const combinedImages = [
    ...keptExisting.map((img, i) => ({ type: 'existing' as const, key: img.key, absIndex: i })),
    ...newFiles.map((file, i) => ({ type: 'new' as const, file, absIndex: keptExisting.length + i })),
  ];

  // ── Render ────────────────────────────────────────────────────────────────
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
              <button
                onClick={() => { setShowForm(false); setSpecs([]); setColors([]); setImageMode('standard'); resetImageState(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                <input
                  required type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Original price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
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

              {/* Subcategory */}
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

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Creative Pottery Studio"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input
                  required type="number" min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="handmade, pottery, ceramic"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Featured toggle */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox" className="sr-only"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${form.isFeatured ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                  {form.isFeatured && <span className="text-xs text-blue-600 font-medium">Shown on homepage</span>}
                </label>
              </div>

              {/* Specifications */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Specifications</label>
                  <button type="button" onClick={addSpec} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                    <Plus className="h-3 w-3" /> Add row
                  </button>
                </div>
                {specs.length === 0 ? (
                  <p className="text-xs text-gray-400 mb-1">No specifications yet.</p>
                ) : (
                  <div className="space-y-2">
                    {specs.map((s, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          value={s.key}
                          onChange={(e) => updateSpec(i, 'key', e.target.value)}
                          placeholder="e.g. Material"
                          className="w-1/3 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          value={s.value}
                          onChange={(e) => updateSpec(i, 'value', e.target.value)}
                          placeholder="e.g. Ceramic"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={() => removeSpec(i)} className="text-gray-400 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Images / Color Variants (mutually exclusive) ───────── */}
              <div className="md:col-span-2">
                {/* Tab switcher */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-4">
                  <button
                    type="button"
                    onClick={() => switchImageMode('standard')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      imageMode === 'standard'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" /> Standard Images
                  </button>
                  <button
                    type="button"
                    onClick={() => switchImageMode('color')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      imageMode === 'color'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Palette className="h-3.5 w-3.5" /> Color Variants
                  </button>
                </div>

                {/* Standard images panel */}
                {imageMode === 'standard' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file" multiple accept="image/jpeg,image/png,image/webp"
                      onChange={handleAddFiles}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">
                        {totalImageCount > 0
                          ? <>{totalImageCount}/6 images · <span className="text-blue-600">★ = primary (shown first)</span></>
                          : 'Upload up to 6 images. JPEG, PNG, WebP · max 250 KB each.'}
                      </p>
                      {totalImageCount > 0 && totalImageCount < 6 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" /> Add Images
                        </button>
                      )}
                    </div>

                    {combinedImages.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-10 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                      >
                        <Upload className="h-8 w-8" />
                        <span className="text-sm font-medium">Click to upload images</span>
                        <span className="text-xs">JPEG, PNG, WebP · max 250 KB each · up to 6</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {combinedImages.map((item) =>
                          item.type === 'existing' ? (
                            <ExistingImageTile
                              key={item.key}
                              imgKey={item.key}
                              isPrimary={primaryIndex === item.absIndex}
                              onSetPrimary={() => setPrimaryIndex(item.absIndex)}
                              onRemove={() => {
                                const origIdx = existingImages.findIndex((img) => img.key === item.key);
                                setExistingImages((prev) => prev.filter((_, i) => i !== origIdx));
                                if (primaryIndex === item.absIndex) setPrimaryIndex(0);
                                else if (primaryIndex > item.absIndex) setPrimaryIndex((p) => p - 1);
                              }}
                            />
                          ) : (
                            <ImageTile
                              key={item.absIndex}
                              src={URL.createObjectURL(item.file)}
                              isPrimary={primaryIndex === item.absIndex}
                              onSetPrimary={() => setPrimaryIndex(item.absIndex)}
                              onRemove={() => removeNewFile(item.absIndex - keptExisting.length)}
                            />
                          )
                        )}
                        {totalImageCount < 6 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                            <span className="text-[10px]">Add</span>
                          </button>
                        )}
                      </div>
                    )}
                    {!editingId && totalImageCount === 0 && (
                      <p className="text-xs text-amber-600 mt-1">At least 1 image is required</p>
                    )}
                  </>
                )}

                {/* Color variants panel */}
                {imageMode === 'color' && (
                  <>
                    <input
                      ref={colorFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleColorFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Each color variant has its own image. Customers can pick a color on the product page.</p>
                      <button
                        type="button"
                        onClick={addColor}
                        className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Color
                      </button>
                    </div>

                    {colors.length === 0 ? (
                      <button
                        type="button"
                        onClick={addColor}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors"
                      >
                        <Palette className="h-8 w-8" />
                        <span className="text-sm font-medium">Click to add a color variant</span>
                        <span className="text-xs">Name each color and upload its image</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {colors.map((color, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
                            <ColorImagePreview
                              imageKey={color.previewUrl ? undefined : color.imageKey}
                              previewUrl={color.previewUrl}
                            />
                            <input
                              value={color.name}
                              onChange={(e) => updateColorName(i, e.target.value)}
                              placeholder="Color name (e.g. Terracotta)"
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => triggerColorFileInput(i)}
                              className="flex items-center gap-1.5 text-xs bg-white border border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              {color.imageKey || color.newFile ? 'Change' : 'Upload'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeColor(i)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {colors.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">At least 1 color variant is required</p>
                    )}
                  </>
                )}
              </div>

              {/* Submit / Cancel */}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit" disabled={submitting}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Uploading & Saving…' : editingId ? 'Save Changes' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); setSpecs([]); setColors([]); setImageMode('standard'); resetImageState(); }}
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Colors</th>
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
                    <td className="px-4 py-4">
                      {product.colors?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.colors.map((c, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                              <Palette className="h-2.5 w-2.5" /> {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-900 font-medium">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
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
