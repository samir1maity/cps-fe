'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import toast from 'react-hot-toast';

interface CategoryFormData {
  name: string;
  description: string;
  parentId: string;
}

const emptyForm: CategoryFormData = { name: '', description: '', parentId: '' };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    const res = await api.getAdminCategories();
    if (res.success && res.data) setCategories(res.data);
    setLoading(false);
  };

  const openCreate = (parentId = '') => {
    setEditingId(null);
    setForm({ ...emptyForm, parentId });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name,
      description: form.description || undefined,
      parentId: form.parentId || null,
    };

    const res = editingId
      ? await api.updateAdminCategory(editingId, payload)
      : await api.createAdminCategory(payload);

    if (res.success) {
      toast.success(editingId ? 'Category updated' : 'Category created');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadCategories();
    } else {
      toast.error(res.error ?? 'Something went wrong');
    }
    setSubmitting(false);
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Deactivate "${cat.name}"?`)) return;
    const res = await api.deleteAdminCategory(cat.id);
    if (res.success) {
      toast.success('Category deactivated');
      loadCategories();
    } else {
      toast.error(res.error ?? 'Something went wrong');
    }
  };

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Manage Categories</h1>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId
                ? form.parentId ? 'Edit Subcategory' : 'Edit Category'
                : form.parentId ? 'New Subcategory' : 'New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {form.parentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {topLevel.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
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

        {/* Category List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : topLevel.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
            No categories yet. Click "Add Category" to create one.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
            {topLevel.map((cat) => {
              const subs = cat.children ?? [];
              const isExpanded = expanded[cat.id];
              return (
                <div key={cat.id}>
                  {/* Top-level row */}
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpanded({ ...expanded, [cat.id]: !isExpanded })}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {subs.length > 0
                          ? isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          : <span className="w-4 inline-block" />}
                      </button>
                      <div>
                        <p className="font-medium text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-500">{cat.slug} · {cat.productCount} products · {subs.length} subcategories</p>
                      </div>
                      {!cat.isActive && (
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCreate(cat.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                      >
                        + Subcategory
                      </button>
                      <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-blue-600 p-1">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(cat)} className="text-gray-400 hover:text-red-600 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategory rows */}
                  {isExpanded && subs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center gap-2 pl-6">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{sub.name}</p>
                          <p className="text-xs text-gray-500">{sub.slug} · {sub.productCount} products</p>
                        </div>
                        {!sub.isActive && (
                          <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(sub)} className="text-gray-400 hover:text-blue-600 p-1">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(sub)} className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
