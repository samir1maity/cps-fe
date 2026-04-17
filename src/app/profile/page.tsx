'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, MapPin, Package, Settings, LogOut,
  Edit2, Plus, Trash2, Clock, Truck, CheckCircle, XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Address, Order, OrderStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { uploadToS3 } from '@/lib/hooks/useS3Upload';
import { useSignedUrl } from '@/lib/hooks/useSignedUrls';
import Image from 'next/image';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ICON: Record<OrderStatus, React.ReactNode> = {
  PENDING:    <Clock       className="h-4 w-4 text-yellow-500" />,
  CONFIRMED:  <Package     className="h-4 w-4 text-blue-500"   />,
  PROCESSING: <Package     className="h-4 w-4 text-blue-500"   />,
  SHIPPED:    <Truck       className="h-4 w-4 text-purple-500" />,
  DELIVERED:  <CheckCircle className="h-4 w-4 text-green-500"  />,
  CANCELLED:  <XCircle     className="h-4 w-4 text-red-500"    />,
  REFUNDED:   <XCircle     className="h-4 w-4 text-red-500"    />,
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  CONFIRMED:  'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED:    'bg-purple-100 text-purple-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
  REFUNDED:   'bg-red-100 text-red-800',
};

// ─── Address Form ─────────────────────────────────────────────────────────────

interface AddressFields {
  label: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const BLANK: AddressFields = {
  label: '', firstName: '', lastName: '', address1: '', address2: '',
  city: '', state: '', zipCode: '', country: 'India', phone: '', isDefault: false,
};

interface AddressFormProps {
  initial?: Partial<AddressFields>;
  onSave: (data: AddressFields) => Promise<void>;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ initial = {}, onSave, onCancel }) => {
  const [form, setForm] = useState<AddressFields>({ ...BLANK, ...initial });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof AddressFields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Label (optional)</label>
          <input value={form.label} onChange={set('label')} placeholder="Home, Office…" className={inp} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} className="w-4 h-4 accent-blue-600" />
            Set as default
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
          <input value={form.firstName} onChange={set('firstName')} required className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
          <input value={form.lastName} onChange={set('lastName')} required className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Street Address *</label>
          <input value={form.address1} onChange={set('address1')} required className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Apt / Floor (optional)</label>
          <input value={form.address2} onChange={set('address2')} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
          <input value={form.city} onChange={set('city')} required className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
          <input value={form.state} onChange={set('state')} required className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">PIN Code *</label>
          <input value={form.zipCode} onChange={set('zipCode')} required className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
          <input value={form.phone} onChange={set('phone')} type="tel" required className={inp} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
};

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'orders' | 'addresses' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'orders',    label: 'Orders',    icon: Package  },
  { id: 'addresses', label: 'Addresses', icon: MapPin   },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('orders');

  const [orders, setOrders]               = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [addresses, setAddresses]                   = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading]     = useState(false);
  const [showAddForm, setShowAddForm]               = useState(false);
  const [editingAddress, setEditingAddress]         = useState<Address | null>(null);

  // Settings tab state
  const [settingsName, setSettingsName]   = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  // Resolve the stored avatar key to a signed URL for display.
  const avatarUrl = useSignedUrl((user as any)?.avatar ?? null);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    const res = await api.getOrders(user!.id);
    if (res.success && res.data) setOrders(res.data);
    setOrdersLoading(false);
  }, [user]);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    const res = await api.getAddresses();
    if (res.success && res.data) setAddresses(res.data);
    setAddressesLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'orders')    loadOrders();
    if (activeTab === 'addresses') loadAddresses();
    if (activeTab === 'settings') {
      setSettingsName(user.name ?? '');
      setSettingsPhone((user as any).phone ?? '');
    }
  }, [activeTab, user, loadOrders, loadAddresses]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      let avatarKey: string | undefined;
      if (avatarFile) {
        avatarKey = await uploadToS3(avatarFile, 'avatars');
      }
      const res = await api.updateProfile({
        name: settingsName,
        phone: settingsPhone,
        ...(avatarKey ? { avatarKey } : {}),
      });
      if (res.success) {
        toast.success('Profile updated');
        setAvatarFile(null);
      } else {
        toast.error(res.error ?? 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong');
    } finally {
      setSavingSettings(false);
    }
  };

  if (!user) { router.push('/login'); return null; }

  // ── Address handlers ──
  const handleAddAddress = async (data: AddressFields) => {
    const res = await api.addAddress(data);
    if (res.success) { toast.success('Address saved'); setShowAddForm(false); loadAddresses(); }
    else toast.error(res.error || 'Failed to save address');
  };

  const handleUpdateAddress = async (data: AddressFields) => {
    if (!editingAddress) return;
    const res = await api.updateAddress(editingAddress.id, data);
    if (res.success) { toast.success('Address updated'); setEditingAddress(null); loadAddresses(); }
    else toast.error(res.error || 'Failed to update address');
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    const res = await api.deleteAddress(id);
    if (res.success) { toast.success('Address deleted'); setAddresses((p) => p.filter((a) => a.id !== id)); }
    else toast.error(res.error || 'Failed to delete address');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ── User card ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            {avatarUrl
              ? <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              : <User className="h-6 w-6 text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
          </div>
          <button onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar ── */}
          <nav className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-2 h-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* ── Content ── */}
          <div className="lg:col-span-3">

            {/* Orders */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Order History</h2>
                </div>

                {ordersLoading ? (
                  <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Package className="h-10 w-10 text-gray-300 mx-auto" />
                    <p className="text-sm text-gray-500">No orders yet</p>
                    <Link href="/" className="text-sm text-blue-600 hover:underline">Start shopping</Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {orders.map((order) => {
                      const addr = order.shippingAddress as Address | undefined;
                      return (
                        <div key={order.id} className="p-6 space-y-4">
                          {/* Order header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                #{(order.id as string).slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {STATUS_ICON[order.status]}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[order.status]}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
                            {order.items.map((item) => {
                              const p = item.product as any;
                              return (
                                <div key={item.id} className="flex items-center gap-3">
                                  <Image
                                    src={p.images?.[0] || '/images/placeholder.jpg'}
                                    alt={p.name}
                                    width={44} height={44}
                                    className="rounded-lg object-cover border border-gray-100 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                    <p className="text-xs text-gray-400">Qty {item.quantity} × {formatCurrency(item.price)}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                                    {formatCurrency(item.price * item.quantity)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer: address + total */}
                          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-3 border-t border-gray-50">
                            {addr && (
                              <div className="text-xs text-gray-400 leading-5">
                                <p className="font-medium text-gray-600 mb-0.5">Ship to</p>
                                <p>{addr.firstName} {addr.lastName}</p>
                                <p>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</p>
                                <p>{addr.city}, {addr.state} – {addr.zipCode}</p>
                                <p>{addr.phone}</p>
                              </div>
                            )}
                            <div className="text-right shrink-0">
                              <p className="text-xs text-gray-400">{order.paymentMethod} · {order.paymentStatus}</p>
                              <p className="text-base font-bold text-gray-900">{formatCurrency(order.total)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Saved Addresses</h2>
                  {!showAddForm && !editingAddress && (
                    <button onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <Plus className="h-4 w-4" /> Add New
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {showAddForm && (
                    <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">New Address</p>
                      <AddressForm onSave={handleAddAddress} onCancel={() => setShowAddForm(false)} />
                    </div>
                  )}

                  {addressesLoading ? (
                    <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
                  ) : addresses.length === 0 && !showAddForm ? (
                    <div className="py-10 text-center space-y-2">
                      <MapPin className="h-10 w-10 text-gray-300 mx-auto" />
                      <p className="text-sm text-gray-500">No saved addresses</p>
                      <button onClick={() => setShowAddForm(true)} className="text-sm text-blue-600 hover:underline">
                        Add your first address
                      </button>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className="border border-gray-100 rounded-xl p-4">
                        {editingAddress?.id === addr.id ? (
                          <AddressForm
                            initial={addr}
                            onSave={handleUpdateAddress}
                            onCancel={() => setEditingAddress(null)}
                          />
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="text-sm leading-6 text-gray-500">
                              <div className="flex gap-1.5 mb-1">
                                {addr.label && (
                                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {addr.label}
                                  </span>
                                )}
                                {addr.isDefault && (
                                  <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-gray-800">{addr.firstName} {addr.lastName}</p>
                              <p>{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</p>
                              <p>{addr.city}, {addr.state} – {addr.zipCode}</p>
                              <p>{addr.country} · {addr.phone}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => setEditingAddress(addr)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-900 mb-5">Account Settings</h2>
                <div className="space-y-4 max-w-sm">
                  {/* Avatar */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Profile Photo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                        {avatarFile
                          ? <img src={URL.createObjectURL(avatarFile)} alt="preview" className="w-full h-full object-cover" />
                          : avatarUrl
                            ? <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            : <User className="h-7 w-7 text-blue-500" />}
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                        Change Photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-100 bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      placeholder="Add phone number"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {savingSettings ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
