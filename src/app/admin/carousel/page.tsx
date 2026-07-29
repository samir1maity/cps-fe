'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ImageIcon,
  Save,
  X,
  Info,
  Link2,
  ZoomIn,
  ZoomOut,
  Crop,
  RotateCcw,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { uploadToS3 } from '@/lib/hooks/useS3Upload';

// ─── Constants ────────────────────────────────────────────────────────────────

// Target aspect ratio 3:1 (carousel banner)
const TARGET_RATIO = 3;
const OUTPUT_W = 1440;
const OUTPUT_H = 480;
// Minimum source dimensions — anything smaller won't look good at full width
const MIN_W = 600;
const MIN_H = 200;
// Tolerance: allow ±5% ratio deviation so perfectly-valid images aren't blocked
const RATIO_TOLERANCE = 0.05;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  _id: string;
  imageKey: string;
  imageUrl: string | null;
  bgColor: string;
  ctaLink: string;
  order: number;
  isActive: boolean;
}

type SlideForm = Omit<Slide, '_id' | 'order' | 'imageUrl'> & { imageFile?: File };

const EMPTY_FORM: SlideForm = {
  imageKey: '',
  bgColor: 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100',
  ctaLink: '',
  isActive: true,
};

const BG_OPTIONS = [
  { label: 'Rose → Amber', value: 'bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100' },
  { label: 'Amber → Rose', value: 'bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100' },
  { label: 'Amber → Orange', value: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-50' },
  { label: 'Stone → Warm', value: 'bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50' },
  { label: 'Sky → Indigo', value: 'bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-100' },
];

const LABEL = 'block text-xs font-medium text-gray-600 mb-1';
const INPUT =
  'w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)] transition-colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to read image')); };
    img.src = url;
  });
}

function canvasToFile(canvas: HTMLCanvasElement, originalName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Failed to export crop')); return; }
        const name = originalName.replace(/\.[^.]+$/, '') + '_cropped.jpg';
        resolve(new File([blob], name, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  });
}

// ─── Image Cropper Modal ──────────────────────────────────────────────────────

interface CropperModalProps {
  src: string;          // object URL of the raw file
  fileName: string;
  naturalW: number;
  naturalH: number;
  onDone: (croppedFile: File, previewUrl: string) => void;
  onClose: () => void;
}

function CropperModal({ src, fileName, naturalW, naturalH, onDone, onClose }: CropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // crop box in image-space coordinates (what we actually cut out)
  const [zoom, setZoom] = useState(1);
  // pan offset in image-space pixels (top-left corner of visible crop window)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // The crop window is always TARGET_RATIO wide for every 1 unit of height
  // At zoom=1 the crop window covers the full source width
  const cropW = naturalW / zoom;
  const cropH = cropW / TARGET_RATIO;

  // Clamp pan so crop window never goes outside image bounds
  const clamp = useCallback(
    (raw: { x: number; y: number }) => ({
      x: Math.max(0, Math.min(raw.x, naturalW - cropW)),
      y: Math.max(0, Math.min(raw.y, naturalH - cropH)),
    }),
    [naturalW, naturalH, cropW, cropH],
  );

  // Draw preview onto canvas whenever crop params change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const clamped = clamp(pan);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        imgRef.current!,
        clamped.x, clamped.y, cropW, cropH,   // source rect
        0, 0, canvas.width, canvas.height,     // dest rect (fills canvas)
      );
    };

    if (imgRef.current?.complete) {
      draw();
    } else {
      const img = new window.Image();
      img.onload = () => { imgRef.current = img; draw(); };
      img.src = src;
    }
  }, [zoom, pan, src, cropW, cropH, clamp]);

  // Reset pan when zoom changes so we stay within bounds
  useEffect(() => {
    setPan((p) => clamp(p));
  }, [zoom, clamp]);

  // Mouse drag on canvas
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const canvas = canvasRef.current!;
    // pixels dragged on screen → pixels in image-space
    const scaleX = cropW / canvas.clientWidth;
    const scaleY = cropH / canvas.clientHeight;
    const dx = (e.clientX - lastPos.current.x) * scaleX;
    const dy = (e.clientY - lastPos.current.y) * scaleY;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => clamp({ x: p.x - dx, y: p.y - dy }));
  };
  const onMouseUp = () => { dragging.current = false; };

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const scaleX = cropW / canvas.clientWidth;
    const scaleY = cropH / canvas.clientHeight;
    const dx = (e.touches[0].clientX - lastPos.current.x) * scaleX;
    const dy = (e.touches[0].clientY - lastPos.current.y) * scaleY;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setPan((p) => clamp({ x: p.x - dx, y: p.y - dy }));
  };

  const handleApply = async () => {
    // Render final output at 1440×480
    const out = document.createElement('canvas');
    out.width = OUTPUT_W;
    out.height = OUTPUT_H;
    const ctx = out.getContext('2d')!;
    const clamped = clamp(pan);
    ctx.drawImage(
      imgRef.current!,
      clamped.x, clamped.y, cropW, cropH,
      0, 0, OUTPUT_W, OUTPUT_H,
    );
    const file = await canvasToFile(out, fileName);
    const previewUrl = URL.createObjectURL(file);
    onDone(file, previewUrl);
  };

  const maxZoom = Math.min(naturalW / (OUTPUT_W / 2), naturalH / (OUTPUT_H / 2), 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-[var(--brand-600)]" />
            <h2 className="text-sm font-semibold text-gray-900">Crop & Adjust — 3:1 banner</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="px-5 pt-4">
          <p className="text-[10px] text-gray-400 mb-2 text-center">Drag to pan · use the zoom slider to fit the area you want</p>
          <canvas
            ref={canvasRef}
            width={OUTPUT_W}
            height={OUTPUT_H}
            className="w-full rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing select-none"
            style={{ aspectRatio: `${TARGET_RATIO}` }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          />
        </div>

        {/* Zoom + reset */}
        <div className="px-5 py-4 flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={maxZoom}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--brand-600)]"
          />
          <ZoomIn className="h-4 w-4 text-gray-400 shrink-0" />
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            title="Reset"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Info */}
        <div className="mx-5 mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Output will be saved at <strong>1440 × 480 px</strong> (3:1). Pan and zoom to frame the key area of your image.</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={handleApply}
            className="flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            <Crop className="h-4 w-4" /> Apply Crop
          </button>
          <button
            onClick={onClose}
            className="text-gray-600 border border-gray-300 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slide form (create / edit) ───────────────────────────────────────────────

interface SlideFormPanelProps {
  initial: SlideForm;
  onSave: (form: SlideForm) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}

function SlideFormPanel({ initial, onSave, onCancel, saving, isEdit }: SlideFormPanelProps) {
  const [form, setForm] = useState<SlideForm>(initial);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [rawFile, setRawFile] = useState<{ file: File; src: string; w: number; h: number } | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeError(null);

    try {
      const { w, h } = await getImageDimensions(file);

      // Hard block: too small
      if (w < MIN_W || h < MIN_H) {
        setSizeError(`Image is too small (${w}×${h} px). Minimum is ${MIN_W}×${MIN_H} px.`);
        if (fileRef.current) fileRef.current.value = '';
        return;
      }

      // Ratio check: must be within ±5% of 3:1
      const ratio = w / h;
      if (Math.abs(ratio - TARGET_RATIO) / TARGET_RATIO > RATIO_TOLERANCE) {
        // Don't block — open cropper so admin can fix it
        const src = URL.createObjectURL(file);
        setRawFile({ file, src, w, h });
        return;
      }

      // Ratio is fine — still open cropper so admin can adjust framing
      const src = URL.createObjectURL(file);
      setRawFile({ file, src, w, h });
    } catch {
      toast.error('Could not read image file.');
    }
  };

  const handleCropDone = (croppedFile: File, previewUrl: string) => {
    setForm((f) => ({ ...f, imageFile: croppedFile, imageKey: '' }));
    setPreview(previewUrl);
    setRemoved(false);
    if (rawFile) URL.revokeObjectURL(rawFile.src);
    setRawFile(null);
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, imageFile: undefined, imageKey: '' }));
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setRemoved(true);
    setSizeError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const currentPreview = removed ? null : (preview ?? (initial.imageKey ? (initial as any).imageUrl : null));

  return (
    <>
      {rawFile && (
        <CropperModal
          src={rawFile.src}
          fileName={rawFile.file.name}
          naturalW={rawFile.w}
          naturalH={rawFile.h}
          onDone={handleCropDone}
          onClose={() => {
            URL.revokeObjectURL(rawFile.src);
            setRawFile(null);
            if (fileRef.current) fileRef.current.value = '';
          }}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Slide' : 'New Slide'}</h3>

        {/* Image upload */}
        <div className="space-y-2">
          <label className={LABEL}>Banner Image</label>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>Required: min 600 × 200 px · 3:1 ratio</strong> · Recommended: 1440 × 480 px · Max 5 MB · JPG, PNG, WebP.
              After picking, a crop tool opens so you can adjust framing.
            </span>
          </div>

          {sizeError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
              <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{sizeError}</span>
            </div>
          )}

          <div className="mt-2">
            {currentPreview ? (
              <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 group" style={{ aspectRatio: `${TARGET_RATIO}` }}>
                <Image src={currentPreview} alt="Preview" fill className="object-cover" unoptimized={currentPreview.startsWith('blob:')} />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-gray-100 transition-colors"
                  >
                    <Crop className="h-3.5 w-3.5" /> Replace & Crop
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-red-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[var(--brand-500)] hover:text-[var(--brand-600)] transition-colors"
                style={{ aspectRatio: `${TARGET_RATIO}`, minHeight: '8rem' }}
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs font-medium">Click to upload banner image</span>
                <span className="text-[10px]">Crop tool opens after picking · 3:1 ratio · min 600 × 200 px · max 2 MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        {/* Fallback bg — only when no image */}
        {!currentPreview && (
          <div>
            <label className={LABEL}>Fallback Background (used when no image)</label>
            <select
              value={form.bgColor}
              onChange={(e) => setForm((f) => ({ ...f, bgColor: e.target.value }))}
              className={INPUT}
            >
              {BG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Click link (optional) */}
        <div>
          <label className={LABEL}>
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Click destination <span className="text-gray-400 font-normal">(optional)</span>
            </span>
          </label>
          <input
            type="text"
            value={form.ctaLink}
            onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
            className={INPUT}
            placeholder="/search"
          />
          <p className="mt-1 text-[10px] text-gray-400">When set, clicking the slide navigates to this route.</p>
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isActive ? 'bg-[var(--brand-600)]' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
          </div>
          <span className="text-sm text-gray-700">Show on homepage</span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving}
            className="flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving
              ? <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Slide'}
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
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCarouselPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOverId = useRef<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await api.getAdminCarouselSlides();
    if (res.success && res.data) setSlides(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolveImageKey = async (form: SlideForm): Promise<string> => {
    if (form.imageFile) return uploadToS3(form.imageFile, 'carousel');
    return form.imageKey;
  };

  const handleCreate = async (form: SlideForm) => {
    setSaving(true);
    try {
      const imageKey = await resolveImageKey(form);
      const res = await api.createCarouselSlide({
        imageKey,
        bgColor: form.bgColor,
        ctaLink: form.ctaLink,
        isActive: form.isActive,
      });
      if (!res.success) throw new Error(res.error);
      toast.success('Slide created');
      setCreating(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create slide');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form: SlideForm) => {
    if (!editing) return;
    setSaving(true);
    try {
      const imageKey = await resolveImageKey(form);
      const res = await api.updateCarouselSlide(editing._id, {
        imageKey,
        bgColor: form.bgColor,
        ctaLink: form.ctaLink,
        isActive: form.isActive,
      });
      if (!res.success) throw new Error(res.error);
      toast.success('Slide updated');
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update slide');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide? This cannot be undone.')) return;
    const res = await api.deleteCarouselSlide(id);
    if (res.success) { toast.success('Slide deleted'); await load(); }
    else toast.error(res.error || 'Failed to delete');
  };

  const handleToggleActive = async (slide: Slide) => {
    const res = await api.updateCarouselSlide(slide._id, { isActive: !slide.isActive });
    if (res.success) {
      setSlides((prev) => prev.map((s) => s._id === slide._id ? { ...s, isActive: !s.isActive } : s));
    } else {
      toast.error('Failed to update');
    }
  };

  const handleDragEnd = async () => {
    if (!draggingId || !dragOverId.current || draggingId === dragOverId.current) {
      setDraggingId(null);
      return;
    }
    const reordered = [...slides];
    const fromIdx = reordered.findIndex((s) => s._id === draggingId);
    const toIdx = reordered.findIndex((s) => s._id === dragOverId.current);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setSlides(reordered);
    setDraggingId(null);
    dragOverId.current = null;
    await api.reorderCarouselSlides(reordered.map((s) => s._id));
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
              <h1 className="text-lg font-bold text-gray-900">Manage Carousel</h1>
            </div>
            {!creating && !editing && (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Slide
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {creating && (
          <SlideFormPanel
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={saving}
            isEdit={false}
          />
        )}

        {editing && (
          <SlideFormPanel
            initial={{
              imageKey: editing.imageKey,
              imageUrl: editing.imageUrl,
              bgColor: editing.bgColor,
              ctaLink: editing.ctaLink,
              isActive: editing.isActive,
            } as any}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
            saving={saving}
            isEdit={true}
          />
        )}

        {/* Slide list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Slides</h2>
            <p className="text-xs text-gray-500 mt-0.5">Drag rows to reorder · {slides.filter(s => s.isActive).length} active</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 border-2 border-[var(--brand-600)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm">No slides yet — add one above.</p>
            </div>
          ) : (
            <ul>
              {slides.map((slide, idx) => (
                <li
                  key={slide._id}
                  draggable
                  onDragStart={() => setDraggingId(slide._id)}
                  onDragOver={(e) => { e.preventDefault(); dragOverId.current = slide._id; }}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-colors ${
                    draggingId === slide._id ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50/60'
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-gray-300 cursor-grab shrink-0" />
                  <span className="text-xs font-mono text-gray-400 w-4 shrink-0">{idx + 1}</span>

                  {/* Thumbnail — 3:1 ratio to match carousel */}
                  <div className="relative shrink-0 rounded-lg overflow-hidden border border-gray-200" style={{ width: 120, height: 40 }}>
                    {slide.imageUrl ? (
                      <Image src={slide.imageUrl} alt="Slide" fill className="object-cover" sizes="120px" />
                    ) : (
                      <div className={`absolute inset-0 ${slide.bgColor || 'bg-gradient-to-br from-rose-200 to-amber-100'}`} />
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0">
                    {slide.ctaLink ? (
                      <p className="text-xs text-[var(--brand-600)] truncate flex items-center gap-1">
                        <Link2 className="h-3 w-3 shrink-0" /> {slide.ctaLink}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No click destination</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(slide)}
                      title={slide.isActive ? 'Hide slide' : 'Show slide'}
                      className={`p-2 rounded-lg transition-colors ${slide.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {slide.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => { setEditing(slide); setCreating(false); }}
                      title="Edit"
                      className="p-2 rounded-lg text-gray-500 hover:text-[var(--brand-600)] hover:bg-[var(--brand-50)] transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(slide._id)}
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

        {/* Image spec */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" /> Image Guidelines
          </h3>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            <li><strong>Minimum size:</strong> 600 × 200 px — smaller images are blocked</li>
            <li><strong>Recommended:</strong> 1440 × 480 px (3:1 ratio) — fits perfectly on laptop screens</li>
            <li><strong>Retina:</strong> Upload at 2880 × 960 px for crisp display on high-DPI screens</li>
            <li><strong>Max display size:</strong> 480px tall — carousel never exceeds this height</li>
            <li><strong>Format:</strong> JPG (photos), PNG (graphics), WebP (best compression)</li>
            <li><strong>File size:</strong> Up to 5 MB per image</li>
            <li><strong>Crop tool:</strong> Drag to pan, use the zoom slider to zoom in/out, then click Apply</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
