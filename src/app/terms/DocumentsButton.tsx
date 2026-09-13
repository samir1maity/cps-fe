'use client';

import React, { useState } from 'react';
import { FileText, X, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface DocumentItem {
  _id: string;
  title: string;
  fileUrl: string | null;
  fileSize: number;
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    setError(null);
    const res = await api.getDocuments();
    if (res.success) {
      setDocuments(res.data ?? []);
      setLoaded(true);
    } else {
      setError(res.error || 'Failed to load documents');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <FileText className="h-4 w-4" /> See Documents
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : error ? (
                <p className="text-sm text-red-600 text-center py-6">{error}</p>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No documents available right now.</p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li key={doc._id}>
                      <a
                        href={doc.fileUrl ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 hover:border-[var(--brand-500)] hover:bg-amber-50/40 transition-colors group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <FileText className="h-4.5 w-4.5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                          {doc.fileSize > 0 && <p className="text-xs text-gray-400">{formatSize(doc.fileSize)}</p>}
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-[var(--brand-600)] transition-colors shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
