'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Save,
  X,
  Info,
  UploadCloud,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { uploadToS3 } from '@/lib/hooks/useS3Upload';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const LABEL = 'block text-xs font-medium text-gray-600 mb-1';
const INPUT =
  'w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)] transition-colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentItem {
  _id: string;
  title: string;
  fileKey: string;
  fileUrl: string | null;
  fileName: string;
  fileSize: number;
  isActive: boolean;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── New document form ────────────────────────────────────────────────────────

interface NewDocFormProps {
  onSave: (title: string, file: File) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function NewDocumentForm({ onSave, onCancel, saving }: NewDocFormProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError(null);

    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Only PDF files are allowed.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`File is too large (${formatSize(f.size)}). Maximum is 5 MB.`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ''));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!file) { toast.error('Please select a PDF file'); return; }
    await onSave(title.trim(), file);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <h3 className="text-base font-semibold text-gray-900">Add Document</h3>

      <div>
        <label className={LABEL}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Privacy Policy"
          className={INPUT}
        />
      </div>

      <div className="space-y-2">
        <label className={LABEL}>PDF File</label>
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>PDF only · Max 5 MB.</span>
        </div>

        {fileError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
            <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {file ? (
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
            <FileText className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[var(--brand-500)] hover:text-[var(--brand-600)] transition-colors py-10"
          >
            <UploadCloud className="h-8 w-8" />
            <span className="text-xs font-medium">Click to select a PDF</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFile} />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving
            ? <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save className="h-4 w-4" />}
          {saving ? 'Uploading…' : 'Save Document'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 border border-gray-300 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.getAdminDocuments();
    if (res.success && res.data) setDocuments(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeCount = documents.filter((d) => d.isActive).length;

  const handleCreate = async (title: string, file: File) => {
    setSaving(true);
    try {
      const fileKey = await uploadToS3(file, 'documents');
      const res = await api.createDocument({
        title,
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        isActive: true,
      });
      if (!res.success) throw new Error(res.error);
      toast.success('Document added');
      setCreating(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add document');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (doc: DocumentItem) => {
    const nextActive = !doc.isActive;
    if (!nextActive && activeCount <= 1) {
      toast.error('At least one active document is required — activate another one first.');
      return;
    }
    const res = await api.updateDocument(doc._id, { isActive: nextActive });
    if (res.success) {
      setDocuments((prev) => prev.map((d) => d._id === doc._id ? { ...d, isActive: nextActive } : d));
      toast.success(nextActive ? 'Document shown to users' : 'Document hidden from users');
    } else {
      toast.error(res.error || 'Failed to update');
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    const isLastActive = doc.isActive && activeCount <= 1;
    const warning = isLastActive
      ? `Delete "${doc.title}"? This is your only active document — after deleting it, the Terms page will show no documents until you upload a new one. This cannot be undone.`
      : `Delete "${doc.title}"? This cannot be undone.`;
    if (!confirm(warning)) return;
    const res = await api.deleteDocument(doc._id);
    if (res.success) { toast.success('Document deleted'); await load(); }
    else toast.error(res.error || 'Failed to delete');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Manage Documents</h1>
            </div>
            {!creating && (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Document
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {creating && (
          <NewDocumentForm
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={saving}
          />
        )}

        {/* Document list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
            <p className="text-xs text-gray-500 mt-0.5">{activeCount} active · shown on the Terms &amp; Conditions page</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 border-2 border-[var(--brand-600)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <FileText className="h-10 w-10" />
              <p className="text-sm">No documents yet — add one above.</p>
            </div>
          ) : (
            <ul>
              {documents.map((doc) => (
                <li
                  key={doc._id}
                  className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {doc.fileName || 'document.pdf'} · {formatSize(doc.fileSize)}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                      doc.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {doc.isActive ? 'Active' : 'Inactive'}
                  </span>

                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--brand-600)] hover:underline shrink-0"
                    >
                      View
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(doc)}
                      title={doc.isActive ? 'Hide from users' : 'Show to users'}
                      className={`p-2 rounded-lg transition-colors ${doc.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {doc.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      title="Delete"
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Guidelines */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" /> Guidelines
          </h3>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            <li><strong>Format:</strong> PDF only</li>
            <li><strong>File size:</strong> Up to 5 MB per document</li>
            <li><strong>Visibility:</strong> Only active documents appear on the Terms &amp; Conditions page</li>
            <li><strong>Hiding</strong> the last active document is blocked — at least one must stay visible while any exist</li>
            <li><strong>Deleting</strong> is permanent and always allowed, even for the last active document — the Terms page will show none until you upload another</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
