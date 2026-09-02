'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { uploadWebsiteImageAction } from '@/app/actions/wedding-actions';
import { CURATED_WEDDING_MEDIA, CuratedMediaItem } from '@/lib/curated-media';

interface ImagePickerUploaderProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  eventId: string;
  adminToken: string;
  category?: 'cover' | 'story' | 'venue' | 'avatar' | 'texture' | 'template' | 'general';
  aspectRatio?: 'landscape' | 'square' | 'avatar' | 'banner';
  helperText?: string;
  className?: string;
}

export const ImagePickerUploader: React.FC<ImagePickerUploaderProps> = ({
  label,
  value,
  onChange,
  eventId,
  adminToken,
  category = 'general',
  aspectRatio = 'landscape',
  helperText,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCuratedModal, setShowCuratedModal] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(
    category === 'general' ? 'cover' : category
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('adminToken', adminToken);
      formData.append('category', category);
      formData.append('file', file);

      const result = await uploadWebsiteImageAction(formData);

      if (result.success && result.url) {
        onChange(result.url);
      } else {
        setUploadError(result.error || 'Failed to upload image.');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setShowUrlInput(false);
      setUrlDraft('');
    }
  };

  const handleSelectCurated = (item: CuratedMediaItem) => {
    onChange(item.url);
    setShowCuratedModal(false);
  };

  const filteredCuratedItems = CURATED_WEDDING_MEDIA.filter((item) =>
    activeCategoryTab === 'all' ? true : item.category === activeCategoryTab
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Helper Header */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-aisle-charcoal">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCuratedModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-aisle-terracotta hover:text-aisle-charcoal transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Curated Presets</span>
            </button>
            <span className="text-aisle-border">·</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-aisle-muted hover:text-aisle-charcoal transition-colors cursor-pointer"
            >
              <LinkIcon className="h-3 w-3" />
              <span>{showUrlInput ? 'Hide URL' : 'Direct URL'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image Preview or Upload Dropzone */}
      {value ? (
        <div className="relative group rounded-2xl border border-aisle-border bg-[#FAF7F2] p-2 overflow-hidden">
          <div
            className={`w-full overflow-hidden bg-aisle-sand/30 flex items-center justify-center relative ${
              aspectRatio === 'avatar'
                ? 'h-24 w-24 rounded-full mx-auto'
                : aspectRatio === 'banner'
                ? 'h-36 rounded-xl'
                : aspectRatio === 'square'
                ? 'h-32 rounded-xl'
                : 'h-40 rounded-xl'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Selected media asset"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback display if URL fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-aisle-charcoal shadow-md hover:bg-white cursor-pointer transition-all hover:scale-105"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-aisle-terracotta" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 text-aisle-terracotta" />
                )}
                <span>Change</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1 rounded-full bg-rose-600/95 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-rose-700 cursor-pointer transition-all hover:scale-105"
              >
                <X className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-aisle-muted">
            <span className="truncate max-w-[240px] font-mono text-[10px]">
              {value.startsWith('data:') ? 'Custom Uploaded Image' : value}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-aisle-terracotta font-semibold hover:underline cursor-pointer"
            >
              Replace Image
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-aisle-border bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] hover:border-aisle-terracotta/60 p-6 transition-all cursor-pointer ${
            isUploading ? 'opacity-70 pointer-events-none' : ''
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-aisle-terracotta" />
              <p className="text-xs font-semibold text-aisle-charcoal">
                Uploading high-res image...
              </p>
              <p className="text-[10px] text-aisle-muted">Saving to secure storage</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-2">
              <div className="rounded-full bg-white border border-aisle-border p-3 shadow-2xs group-hover:scale-110 transition-transform">
                <UploadCloud className="h-5 w-5 text-aisle-terracotta" />
              </div>
              <div>
                <p className="text-xs font-semibold text-aisle-charcoal">
                  Click to select an image from your computer
                </p>
                <p className="text-[10px] text-aisle-muted mt-0.5">
                  JPG, PNG, WebP, or SVG up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Direct URL Input Toggle */}
      {showUrlInput && (
        <div className="flex gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="flex-1 rounded-xl border border-aisle-border px-3 py-2 text-xs bg-white text-aisle-charcoal focus:outline-none focus:border-aisle-terracotta"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="rounded-xl bg-aisle-charcoal px-3 py-2 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
      )}

      {/* Helper Subtext */}
      {helperText && !uploadError && (
        <p className="text-[10px] text-aisle-muted">{helperText}</p>
      )}

      {/* Curated Media Selection Modal */}
      {showCuratedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 text-xs font-sans">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-aisle-border/40">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-aisle-border/60 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-aisle-terracotta block mb-1">
                  Curated Asset Library
                </span>
                <h3 className="font-serif text-2xl font-semibold text-aisle-charcoal">
                  Select Editorial Wedding Media
                </h3>
                <p className="text-xs text-aisle-muted mt-0.5">
                  Hand-picked boutique photography, lakefront landscapes, and vintage motifs ready for your website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCuratedModal(false)}
                className="rounded-full p-2 text-aisle-muted hover:bg-aisle-sand hover:text-aisle-charcoal cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#FAF7F2] border border-aisle-border">
              {[
                { id: 'all', label: '✨ All Assets' },
                { id: 'cover', label: '🌅 Covers & Sunsets' },
                { id: 'story', label: '📖 Our Story' },
                { id: 'venue', label: '🏛️ Venues & Villas' },
                { id: 'texture', label: '📜 Textures & Motifs' },
                { id: 'avatar', label: '👥 Wedding Party' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeCategoryTab === tab.id
                      ? 'bg-white text-aisle-charcoal shadow-sm'
                      : 'text-aisle-muted hover:text-aisle-charcoal'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredCuratedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectCurated(item)}
                  className={`group relative rounded-2xl border p-2 bg-[#FAF7F2]/50 hover:bg-white hover:border-aisle-terracotta transition-all cursor-pointer space-y-2 ${
                    value === item.url
                      ? 'border-aisle-terracotta ring-2 ring-aisle-terracotta/20 bg-white shadow-sm'
                      : 'border-aisle-border'
                  }`}
                >
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-aisle-sand/40 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {value === item.url && (
                      <div className="absolute top-2 right-2 rounded-full bg-aisle-terracotta text-white p-1 shadow-md">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-aisle-charcoal truncate">
                      {item.title}
                    </h5>
                    <p className="text-[10px] text-aisle-muted line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-aisle-border/60">
              <span className="text-[11px] text-aisle-muted">
                {filteredCuratedItems.length} photos available
              </span>
              <button
                type="button"
                onClick={() => setShowCuratedModal(false)}
                className="rounded-full bg-aisle-charcoal px-5 py-2.5 text-xs font-semibold text-white hover:bg-aisle-terracotta cursor-pointer transition-colors"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
