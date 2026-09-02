'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  Image as ImageIcon,
  Maximize2,
  Palette,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  Monitor,
  Smartphone,
  CheckCircle2,
  RotateCcw,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Gift,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import WaxSealOpening from '@/components/WaxSeal';
import { BotanicalCorner, GoldHairlineDivider } from '@/components/MotifDecorations';
import { uploadTemplateMediaAssetAction } from '@/app/actions/template-design-actions';
import { CURATED_WEDDING_MEDIA } from '@/lib/curated-media';
import {
  GuestPortalSectionId,
  GuestPortalSectionStyle,
  GuestPortalSectionStyleMap,
  GuestPortalSectionStyleTarget,
  GuestPortalCanvasWidth,
  GuestPortalBackgroundMode,
  GuestPortalContainerLayout,
  GuestPortalContainerPadding,
  GuestPortalTextFrameStyle,
  GuestPortalOpeningStyle,
  TemplateDesignRecord,
} from '@/lib/types';

export type SelectedPreviewElement =
  | 'identity'
  | 'page'
  | 'welcome'
  | 'hero'
  | 'navigation'
  | 'sections'
  | 'countdown'
  | 'rsvp'
  | 'schedule'
  | 'story'
  | 'travel'
  | 'registry'
  | 'faq'
  | 'local'
  | 'wedding-party'
  | 'photos'
  | 'opening'
  | 'library';

export type PreviewMode = 'guest' | 'desktop' | 'opening' | 'sections';
export type PreviewLayoutId =
  | 'editorial-ceremony'
  | 'minimal-itinerary'
  | 'destination-weekend'
  | 'garden-formal'
  | 'royal-floral';

export interface TemplateMediaAsset {
  id: string;
  title: string;
  category: 'Hero' | 'Background' | 'Story' | 'Venue' | 'Gallery' | 'Texture' | 'Other';
  image_url: string;
  created_at: string;
}

export interface TemplateDesignRow {
  id: string;
  name: string;
  slug: string;
  taxonomy: string;
  description: string;
  best_for: string;
  status: 'draft' | 'published' | 'archived';
  bg_color: string;
  text_color: string;
  accent_color: string;
  muted_color: string;
  surface_color: string;
  border_color: string;
  shadow_color: string;
  canvas_width: GuestPortalCanvasWidth;
  page_background_image_url: string;
  page_background_mode: GuestPortalBackgroundMode;
  container_surface_color: string;
  container_border_color: string;
  container_shadow_color: string;
  container_radius: number;
  container_border_width: number;
  container_layout: GuestPortalContainerLayout;
  container_padding: GuestPortalContainerPadding;
  text_frame_style: GuestPortalTextFrameStyle;
  text_frame_radius: number;
  text_frame_border_width: number;
  section_order: GuestPortalSectionId[];
  hidden_sections: GuestPortalSectionId[];
  section_styles: GuestPortalSectionStyleMap;
  font_family: 'classic-serif' | 'modern-sans' | 'vintage-editorial';
  opening_style: GuestPortalOpeningStyle;
  hero_treatment: 'photo-card' | 'paper-frame' | 'dark-card' | 'minimal-type' | 'botanical-frame' | 'coastal-postcard' | 'editorial-split' | 'postcard';
  motif: 'floral' | 'minimal' | 'gilded' | 'botanical' | 'blush' | 'coastal' | 'vineyard' | 'marigold' | 'black-tie' | 'editorial';
  needs_photo: boolean;
  sample_image_url: string;
  eyebrow_text?: string;
  poetic_line?: string;
  invitation_phrase?: string;
  floron?: string;
  border_flair?: 'clean' | 'botanical-crest' | 'arch' | 'double-line' | 'hairline-gold';
  created_at?: string;
  updated_at?: string;
}

export const ALL_GUEST_SECTIONS: GuestPortalSectionId[] = [
  'our-story',
  'schedule',
  'travel',
  'rsvp',
  'registry',
  'photos',
  'wedding-party',
  'local-recs',
  'faq',
];

// Authentic Curated AisleFlow System Designs
export const SYSTEM_DESIGNS: TemplateDesignRow[] = [
  {
    id: 'royal-floral',
    name: 'Royal Floral',
    slug: 'royal-floral',
    taxonomy: 'Classic Floral',
    description: 'Wax seal opening, delicate botanical crest, deckle-edge paper framing, and soft champagne/blush palette.',
    best_for: 'Château, villa, and formal garden celebrations seeking regal romanticism.',
    status: 'published',
    bg_color: '#FAF7F2',
    text_color: '#2C2523',
    accent_color: '#9E5A44',
    muted_color: '#7D746D',
    surface_color: '#FFFFFF',
    border_color: '#E8E0D7',
    shadow_color: 'rgba(44, 37, 35, 0.06)',
    canvas_width: 'medium',
    page_background_image_url: '',
    page_background_mode: 'none',
    container_surface_color: '#FFFFFF',
    container_border_color: '#E8E0D7',
    container_shadow_color: 'rgba(44, 37, 35, 0.06)',
    container_radius: 28,
    container_border_width: 1,
    container_layout: 'card',
    container_padding: 'balanced',
    text_frame_style: 'glass',
    text_frame_radius: 20,
    text_frame_border_width: 1,
    section_order: ALL_GUEST_SECTIONS,
    hidden_sections: [],
    section_styles: {},
    font_family: 'classic-serif',
    opening_style: 'wax-seal',
    hero_treatment: 'photo-card',
    motif: 'floral',
    needs_photo: true,
    sample_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    eyebrow_text: 'Among the camellias & old oaks',
    poetic_line: 'A garden in bloom, a love in flower',
    invitation_phrase: 'request the honour of your presence at the celebration of their marriage',
    floron: '❦',
    border_flair: 'botanical-crest',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    slug: 'modern-minimal',
    taxonomy: 'Modern Minimal',
    description: 'Architectural lines, bold editorial typography, deep charcoal ink, and airy negative space.',
    best_for: 'Art galleries, private penthouses, and contemporary loft weddings.',
    status: 'published',
    bg_color: '#F4F3F0',
    text_color: '#1A1A1A',
    accent_color: '#4A4A4A',
    muted_color: '#666666',
    surface_color: '#FFFFFF',
    border_color: '#E2E2DF',
    shadow_color: 'rgba(0, 0, 0, 0.04)',
    canvas_width: 'narrow',
    page_background_image_url: '',
    page_background_mode: 'none',
    container_surface_color: '#FFFFFF',
    container_border_color: '#E2E2DF',
    container_shadow_color: 'rgba(0, 0, 0, 0.04)',
    container_radius: 16,
    container_border_width: 1,
    container_layout: 'borderless',
    container_padding: 'balanced',
    text_frame_style: 'outline',
    text_frame_radius: 8,
    text_frame_border_width: 1,
    section_order: ALL_GUEST_SECTIONS,
    hidden_sections: [],
    section_styles: {},
    font_family: 'modern-sans',
    opening_style: 'minimal-fade',
    hero_treatment: 'editorial-split',
    motif: 'minimal',
    needs_photo: true,
    sample_image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    eyebrow_text: 'Iron, light, and one long table',
    poetic_line: 'One day. One lifelong promise.',
    invitation_phrase: 'invite you to share in the beginning of their marriage',
    floron: '—',
    border_flair: 'clean',
  },
  {
    id: 'tuscan-wine',
    name: 'Tuscan Wine & Olive',
    slug: 'tuscan-wine',
    taxonomy: 'Destination & Countryside',
    description: 'Sun-drenched terracotta, vineyard sprigs, envelope unfold animation, and rustic Italian soul.',
    best_for: 'Vineyards, olive groves, and Tuscan country estates.',
    status: 'published',
    bg_color: '#FBF7F0',
    text_color: '#342820',
    accent_color: '#8C4A32',
    muted_color: '#7D6E63',
    surface_color: '#FFFFFF',
    border_color: '#E7DDD2',
    shadow_color: 'rgba(52, 40, 32, 0.06)',
    canvas_width: 'medium',
    page_background_image_url: '',
    page_background_mode: 'none',
    container_surface_color: '#FFFFFF',
    container_border_color: '#E7DDD2',
    container_shadow_color: 'rgba(52, 40, 32, 0.06)',
    container_radius: 20,
    container_border_width: 1,
    container_layout: 'card',
    container_padding: 'balanced',
    text_frame_style: 'glass',
    text_frame_radius: 16,
    text_frame_border_width: 1,
    section_order: ALL_GUEST_SECTIONS,
    hidden_sections: [],
    section_styles: {},
    font_family: 'vintage-editorial',
    opening_style: 'envelope',
    hero_treatment: 'postcard',
    motif: 'vineyard',
    needs_photo: true,
    sample_image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
    eyebrow_text: 'Among the cypress and olive groves',
    poetic_line: 'Where the rolling hills hold our beginning',
    invitation_phrase: 'invite you to gather beneath the Tuscan sky for our wedding celebration',
    floron: '✦',
    border_flair: 'double-line',
  },
  {
    id: 'celestial-magic',
    name: 'Celestial Magic',
    slug: 'celestial-magic',
    taxonomy: 'Elegant Dark / Gold',
    description: 'Deep midnight navy, luminous gold foil accents, constellation motifs, and dramatic curtain reveal.',
    best_for: 'Black-tie evening receptions, candlelight historic manors, and celestial themes.',
    status: 'published',
    bg_color: '#0F141C',
    text_color: '#F2EFE9',
    accent_color: '#D4AF37',
    muted_color: '#9FA8B7',
    surface_color: '#161D27',
    border_color: '#283446',
    shadow_color: 'rgba(0, 0, 0, 0.5)',
    canvas_width: 'medium',
    page_background_image_url: '',
    page_background_mode: 'none',
    container_surface_color: '#161D27',
    container_border_color: '#283446',
    container_shadow_color: 'rgba(0, 0, 0, 0.5)',
    container_radius: 24,
    container_border_width: 1,
    container_layout: 'card',
    container_padding: 'balanced',
    text_frame_style: 'glass',
    text_frame_radius: 16,
    text_frame_border_width: 1,
    section_order: ALL_GUEST_SECTIONS,
    hidden_sections: [],
    section_styles: {},
    font_family: 'classic-serif',
    opening_style: 'curtain',
    hero_treatment: 'dark-card',
    motif: 'gilded',
    needs_photo: true,
    sample_image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
    eyebrow_text: 'A night of candlelight & gold',
    poetic_line: 'Where our story meets the constellations',
    invitation_phrase: 'request the pleasure of your company for an evening of vows and celebration',
    floron: '✧',
    border_flair: 'hairline-gold',
  },
  {
    id: 'botanical-garden',
    name: 'Botanical Garden',
    slug: 'botanical-garden',
    taxonomy: 'Garden Botanical',
    description: 'Earthy eucalyptus greens, soft porcelain panels, and delicate botanical linework.',
    best_for: 'Glasshouse conservatories, botanical gardens, and spring vineyard weddings.',
    status: 'published',
    bg_color: '#F3F4EA',
    text_color: '#1F261E',
    accent_color: '#5F7857',
    muted_color: '#747D69',
    surface_color: '#FFFDF8',
    border_color: '#DCE3D3',
    shadow_color: 'rgba(61, 86, 55, 0.13)',
    canvas_width: 'narrow',
    page_background_image_url: '',
    page_background_mode: 'none',
    container_surface_color: '#FFFDF8',
    container_border_color: '#DCE3D3',
    container_shadow_color: 'rgba(61, 86, 55, 0.13)',
    container_radius: 28,
    container_border_width: 1,
    container_layout: 'card',
    container_padding: 'balanced',
    text_frame_style: 'glass',
    text_frame_radius: 20,
    text_frame_border_width: 1,
    section_order: ALL_GUEST_SECTIONS,
    hidden_sections: [],
    section_styles: {},
    font_family: 'classic-serif',
    opening_style: 'venue-reveal',
    hero_treatment: 'botanical-frame',
    motif: 'botanical',
    needs_photo: true,
    sample_image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    eyebrow_text: 'Under eucalyptus & wisteria',
    poetic_line: 'Rooted together in grace and natural wonder',
    invitation_phrase: 'request the honour of your presence among the gardens',
    floron: '❦',
    border_flair: 'botanical-crest',
  },
  {
    id: 'romantic-blush',
    name: 'Romantic Blush',
    slug: 'romantic-blush',
    taxonomy: 'Romantic Blush',
    description: 'Blush linen background, warm dusty rose accents, and poetic French script flourishes.',
    best_for: 'Romantic villas, lakeside vows, and intimate outdoor ceremonies.',
    status: 'published',
    bg_color: '#FCF2EF',
    text_color: '#2D2020',
    accent_color: '#B86470',
    muted_color: '#92716D',
    surface_color: '#FFF9F7',
    border_color: '#EBCFCB',
    shadow_color: 'rgba(148, 85, 91, 0.15)',
    canvas_width: 'narrow',
    page_background_image_url: '',
    page_background_mode: 'none',
    container_surface_color: '#FFF9F7',
    container_border_color: '#EBCFCB',
    container_shadow_color: 'rgba(148, 85, 91, 0.15)',
    container_radius: 24,
    container_border_width: 1,
    container_layout: 'card',
    container_padding: 'balanced',
    text_frame_style: 'glass',
    text_frame_radius: 16,
    text_frame_border_width: 1,
    section_order: ALL_GUEST_SECTIONS,
    hidden_sections: [],
    section_styles: {},
    font_family: 'classic-serif',
    opening_style: 'envelope',
    hero_treatment: 'photo-card',
    motif: 'blush',
    needs_photo: true,
    sample_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    eyebrow_text: 'Soft petals, sweet vows',
    poetic_line: 'Every sunrise brought us here',
    invitation_phrase: 'joyfully invite you to celebrate their union',
    floron: '❦',
    border_flair: 'botanical-crest',
  },
];

// Initial Media Assets
export const INITIAL_MEDIA_ASSETS: TemplateMediaAsset[] = [
  {
    id: 'media-1',
    title: 'Lake Como Villa Balbianello',
    category: 'Hero',
    image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'media-2',
    title: 'Vintage Couple Lake Shore',
    category: 'Story',
    image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'media-3',
    title: 'Tuscan Hills & Cypress',
    category: 'Venue',
    image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'media-4',
    title: 'Amalfi Coast Villa',
    category: 'Venue',
    image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'media-5',
    title: 'Black Tie Night Manor',
    category: 'Hero',
    image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 'media-6',
    title: 'Eucalyptus Botanical Glasshouse',
    category: 'Background',
    image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date().toISOString(),
  },
];

type ImagePickTarget =
  | { type: 'field'; key: keyof TemplateDesignRow }
  | { type: 'section'; target: GuestPortalSectionStyleTarget; key: keyof GuestPortalSectionStyle };

interface TemplateDesignStudioProps {
  ownerToken?: string;
  initialTemplates?: TemplateDesignRow[];
  initialMediaAssets?: TemplateMediaAsset[];
}

export default function TemplateDesignStudio({
  ownerToken = 'owner-dev',
  initialTemplates,
  initialMediaAssets,
}: TemplateDesignStudioProps) {
  // State
  const [ownerDesigns, setOwnerDesigns] = useState<TemplateDesignRow[]>(
    initialTemplates && initialTemplates.length > 0 ? initialTemplates : []
  );
  const [mediaAssets, setMediaAssets] = useState<TemplateMediaAsset[]>(
    initialMediaAssets && initialMediaAssets.length > 0 ? initialMediaAssets : INITIAL_MEDIA_ASSETS
  );
  const [currentDesign, setCurrentDesign] = useState<TemplateDesignRow>(SYSTEM_DESIGNS[0]);
  const [selectedElement, setSelectedElement] = useState<SelectedPreviewElement>('page');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('guest');
  const [previewLayout, setPreviewLayout] = useState<PreviewLayoutId>('editorial-ceremony');
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [saveDetailsOpen, setSaveDetailsOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [imagePickTarget, setImagePickTarget] = useState<ImagePickTarget | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Media Upload Form State
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaCategory, setNewMediaCategory] = useState<TemplateMediaAsset['category']>('Hero');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const studioFileInputRef = useRef<HTMLInputElement>(null);
  const [saveModalForm, setSaveModalForm] = useState({
    name: currentDesign.name,
    slug: currentDesign.slug,
    taxonomy: currentDesign.taxonomy,
    description: currentDesign.description,
    best_for: currentDesign.best_for,
    status: currentDesign.status,
  });
  const [saveModalError, setSaveModalError] = useState('');

  // Toast Helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Upload New Media Asset via File Picker
  const handleSelectUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('ownerToken', ownerToken);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('category', newMediaCategory.toLowerCase());
      formData.append('file', file);

      const result = await uploadTemplateMediaAssetAction(formData);
      if (result.success && result.asset) {
        const newAsset: TemplateMediaAsset = {
          id: result.asset.id,
          title: result.asset.title,
          category: (result.asset.category.charAt(0).toUpperCase() + result.asset.category.slice(1)) as any,
          image_url: result.asset.image_url,
          created_at: result.asset.created_at,
        };
        setMediaAssets((prev) => [newAsset, ...prev]);
        showToast(`Uploaded asset "${newAsset.title}".`);
      } else {
        // Fallback local data URL
        const reader = new FileReader();
        reader.onload = () => {
          const newAsset: TemplateMediaAsset = {
            id: 'media_' + Date.now(),
            title: file.name.replace(/\.[^/.]+$/, ''),
            category: newMediaCategory,
            image_url: reader.result as string,
            created_at: new Date().toISOString(),
          };
          setMediaAssets((prev) => [newAsset, ...prev]);
          showToast(`Uploaded asset "${newAsset.title}".`);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast('Failed to upload image.', 'error');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Move Section Up/Down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const order = [...(currentDesign.section_order || ALL_GUEST_SECTIONS)];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const [moved] = order.splice(index, 1);
    order.splice(targetIdx, 0, moved);
    setCurrentDesign({ ...currentDesign, section_order: order });
  };

  // Toggle Section Visibility
  const toggleSectionVisibility = (sectionId: GuestPortalSectionId) => {
    const hidden = (currentDesign.hidden_sections || []).includes(sectionId)
      ? (currentDesign.hidden_sections || []).filter((s) => s !== sectionId)
      : [...(currentDesign.hidden_sections || []), sectionId];
    setCurrentDesign({ ...currentDesign, hidden_sections: hidden });
  };

  // Duplicate System Design into new Owner Design
  const handleDuplicateSystemDesign = (design: TemplateDesignRow) => {
    const newId = 'owner_' + Math.random().toString(36).substring(2, 10);
    const newSlug = `${design.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newDesign: TemplateDesignRow = {
      ...design,
      id: newId,
      name: `${design.name} (Custom)`,
      slug: newSlug,
      status: 'draft',
    };
    setOwnerDesigns((prev) => [newDesign, ...prev]);
    setCurrentDesign(newDesign);
    setSelectedElement('identity');
    showToast(`Created draft duplicate "${newDesign.name}".`);
  };

  // Create Blank New Template
  const handleCreateNewTemplate = () => {
    const newId = 'owner_' + Math.random().toString(36).substring(2, 10);
    const newDesign: TemplateDesignRow = {
      ...SYSTEM_DESIGNS[0],
      id: newId,
      name: 'New Custom Template',
      slug: 'new-custom-template',
      status: 'draft',
      taxonomy: 'Custom Design',
      description: 'Custom owner-created invitation aesthetic.',
      best_for: 'Boutique intimate celebrations.',
    };
    setOwnerDesigns((prev) => [newDesign, ...prev]);
    setCurrentDesign(newDesign);
    setSelectedElement('identity');
    showToast('Created new blank template draft.');
  };

  // Delete Template
  const handleDeleteDesign = (id: string) => {
    if (confirm(`Are you sure you want to delete template "${currentDesign.name}"?`)) {
      setOwnerDesigns((prev) => prev.filter((d) => d.id !== id));
      setCurrentDesign(SYSTEM_DESIGNS[0]);
      showToast('Template deleted successfully.');
    }
  };

  // Open Save Details Modal
  const handleOpenSaveDetails = () => {
    setSaveModalForm({
      name: currentDesign.name,
      slug: currentDesign.slug,
      taxonomy: currentDesign.taxonomy,
      description: currentDesign.description,
      best_for: currentDesign.best_for,
      status: currentDesign.status,
    });
    setSaveModalError('');
    setSaveDetailsOpen(true);
  };

  // Confirm Save Details
  const handleConfirmSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveModalForm.name.trim()) {
      setSaveModalError('Template name is required.');
      return;
    }

    const updated: TemplateDesignRow = {
      ...currentDesign,
      name: saveModalForm.name,
      slug: saveModalForm.slug || saveModalForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      taxonomy: saveModalForm.taxonomy,
      description: saveModalForm.description,
      best_for: saveModalForm.best_for,
      status: saveModalForm.status,
      updated_at: new Date().toISOString(),
    };

    setCurrentDesign(updated);
    setOwnerDesigns((prev) => {
      const exists = prev.some((d) => d.id === updated.id);
      if (exists) {
        return prev.map((d) => (d.id === updated.id ? updated : d));
      }
      return [updated, ...prev];
    });

    setSaveDetailsOpen(false);
    showToast(`Template "${updated.name}" saved successfully!`);
  };

  // Field Setters
  const setField = (key: keyof TemplateDesignRow, value: any) => {
    setCurrentDesign((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const setSectionStyle = (
    target: GuestPortalSectionStyleTarget,
    key: keyof GuestPortalSectionStyle,
    value: any
  ) => {
    setCurrentDesign((current) => {
      const styles = current.section_styles || {};
      const currentTargetStyle = styles[target] || {};
      return {
        ...current,
        section_styles: {
          ...styles,
          [target]: {
            ...currentTargetStyle,
            [key]: value,
          },
        },
      };
    });
  };

  // Media Picker Handler
  const openImagePicker = (target: ImagePickTarget) => {
    setImagePickTarget(target);
    setMediaLibraryOpen(true);
  };

  const handlePickMediaUrl = (url: string) => {
    if (!imagePickTarget) return;

    if (imagePickTarget.type === 'field') {
      setField(imagePickTarget.key, url);
    } else {
      setSectionStyle(imagePickTarget.target, imagePickTarget.key, url);
    }

    setMediaLibraryOpen(false);
    setImagePickTarget(null);
    showToast('Image updated.');
  };

  // Upload New Media Asset
  const handleUploadMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaTitle || !newMediaUrl) return;

    const newAsset: TemplateMediaAsset = {
      id: 'media_' + Date.now(),
      title: newMediaTitle,
      category: newMediaCategory,
      image_url: newMediaUrl,
      created_at: new Date().toISOString(),
    };

    setMediaAssets((prev) => [newAsset, ...prev]);
    setNewMediaTitle('');
    setNewMediaUrl('');
    showToast(`Uploaded asset "${newAsset.title}".`);
  };

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_18%_0%,rgba(168,90,82,0.12),transparent_32%),linear-gradient(180deg,#FAF6F0_0%,#FBF1EC_100%)] px-4 sm:px-6 py-6 font-sans text-stone-950 selection:bg-aisle-terracotta selection:text-white">
      {/* 1. TOP PILL HEADER */}
      <header className="mx-auto flex max-w-[1500px] items-center justify-between rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur md:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>AisleFlow Home</span>
        </Link>
        <span className="rounded-full bg-rose-100/70 border border-rose-200/60 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-900">
          Site Owner Studio
        </span>
      </header>

      {/* 2. PAGE INTRO HEADER */}
      <section className="mx-auto max-w-[1500px] pb-6 pt-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-aisle-terracotta" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
            Owner Template Studio
          </span>
        </div>
        <h1 className="mt-2 max-w-4xl font-serif text-3xl sm:text-5xl leading-[1.02] text-stone-950">
          Build the design catalogue without changing code.
        </h1>
        <p className="mt-3 max-w-[75ch] text-xs sm:text-sm leading-relaxed text-stone-600">
          Tune colors, typography, container framing, and interactive behaviors for every element with live preview reflection.
        </p>

        {statusMessage && (
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{statusMessage.text}</span>
          </div>
        )}
      </section>

      {/* 3. THREE-COLUMN STUDIO WORKSPACE */}
      <div className="mx-auto max-w-[1500px] grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 items-start">
        
        {/* LEFT COLUMN: CONFIGURATION CONTROLS */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
          {/* Top Selected Element Header Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
                  Selected Element
                </span>
                <h2 className="font-serif text-xl font-semibold text-stone-900 leading-tight">
                  {selectedElementLabel(selectedElement)}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleOpenSaveDetails}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-aisle-terracotta transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
            </div>

            {/* Quick Element Jump Bar */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedElement('page')}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  selectedElement === 'page'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Palette className="h-3 w-3" /> Global
              </button>
              <button
                type="button"
                onClick={() => setSelectedElement('hero')}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  selectedElement === 'hero'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Hero
              </button>
              <button
                type="button"
                onClick={() => setSelectedElement('story')}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  selectedElement === 'story'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setSelectedElement('schedule')}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  selectedElement === 'schedule'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => setSelectedElement('rsvp')}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  selectedElement === 'rsvp'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                RSVP
              </button>
              <button
                type="button"
                onClick={() => setSelectedElement('sections')}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  selectedElement === 'sections'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Layers className="h-3 w-3" /> Order
              </button>
            </div>
          </div>

          {/* DYNAMIC CONFIGURATION FORM CONTROLS */}
          <SelectedElementControls
            selectedElement={selectedElement}
            draft={currentDesign}
            setField={setField}
            setSectionStyle={setSectionStyle}
            onPickImage={openImagePicker}
          />

          {/* Section Order & Visibility Card */}
          <SectionOrderControls
            order={currentDesign.section_order || ALL_GUEST_SECTIONS}
            hiddenSections={currentDesign.hidden_sections || []}
            onMove={(secId, dir) => {
              const idx = (currentDesign.section_order || ALL_GUEST_SECTIONS).indexOf(secId);
              moveSection(idx, dir === -1 ? 'up' : 'down');
            }}
            onToggle={toggleSectionVisibility}
            onSelect={setSelectedElement}
          />
        </aside>

        {/* CENTER COLUMN: LIVE DESIGN PREVIEW */}
        <section className="lg:col-span-5 space-y-4 flex flex-col items-center">
          {/* Top Preview Control Bar */}
          <div className="w-full rounded-3xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-aisle-terracotta" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Live Design Preview
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('guest')}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      previewMode === 'guest'
                        ? 'bg-stone-900 text-white shadow-sm font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Guest Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('opening')}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      previewMode === 'opening'
                        ? 'bg-stone-900 text-white shadow-sm font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Opening
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setFullPreviewOpen(true)}
                  title="Open Fullscreen Immersion Preview"
                  className="rounded-full border border-stone-200 p-2 hover:bg-stone-100 text-stone-700 transition-colors"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Layout Preset Selector */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
              <span className="text-stone-400 font-medium text-[11px]">Preview Layout:</span>
              <select
                value={previewLayout}
                onChange={(e) => setPreviewLayout(e.target.value as any)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-800"
              >
                <option value="editorial-ceremony">Editorial Ceremony</option>
                <option value="minimal-itinerary">Minimal Itinerary</option>
                <option value="destination-weekend">Destination Weekend</option>
                <option value="garden-formal">Garden Formal</option>
                <option value="royal-floral">Royal Floral</option>
              </select>
            </div>
          </div>

          {/* Actual Scrollable Guest Invite Canvas */}
          <div className="w-full flex justify-center">
            {previewMode === 'opening' ? (
              <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-wedding-lg border border-stone-200">
                <WaxSealOpening
                  coupleNames="Sarah & James"
                  openingStyle={currentDesign.opening_style}
                  guestName="Elena"
                  onOpen={() => setPreviewMode('guest')}
                />
              </div>
            ) : (
              <LiveGuestInvitePreview
                design={currentDesign}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                previewLayout={previewLayout}
              />
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: CATALOGUE, SYSTEM DESIGNS & MEDIA LIBRARY */}
        <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pl-1">
          {/* Catalogue Overview Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
                  Catalogue
                </span>
                <h3 className="font-serif text-base font-semibold text-stone-900">
                  {ownerDesigns.length} Custom · {SYSTEM_DESIGNS.length} System
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCreateNewTemplate}
                className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-aisle-terracotta transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Owner Designs List */}
          {ownerDesigns.length > 0 && (
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
                Owner Created Designs
              </span>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {ownerDesigns.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setCurrentDesign(d)}
                    className={`rounded-2xl border p-3 cursor-pointer transition-all ${
                      currentDesign.id === d.id
                        ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                        : 'border-stone-100 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xs font-semibold text-stone-900">{d.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          d.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="h-3.5 w-3.5 rounded-full border border-stone-200 shadow-xs" style={{ backgroundColor: d.bg_color }} />
                      <span className="h-3.5 w-3.5 rounded-full border border-stone-200 shadow-xs" style={{ backgroundColor: d.accent_color }} />
                      <span className="h-3.5 w-3.5 rounded-full border border-stone-200 shadow-xs" style={{ backgroundColor: d.text_color }} />
                      <span className="text-[10px] text-stone-400 ml-1">{d.taxonomy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Presets List */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
              Start from System Design
            </span>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {SYSTEM_DESIGNS.map((sys) => (
                <div
                  key={sys.id}
                  onClick={() => setCurrentDesign(sys)}
                  className={`rounded-2xl border p-3 cursor-pointer transition-all flex items-center justify-between ${
                    currentDesign.id === sys.id
                      ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                      : 'border-stone-100 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <span className="font-serif text-xs font-semibold text-stone-900 block">
                      {sys.name}
                    </span>
                    <span className="text-[10px] text-stone-400">{sys.taxonomy}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateSystemDesign(sys);
                      }}
                      title="Duplicate as new editable template"
                      className="rounded-lg p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Library Shortcut & Upload */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block">
                Media Asset Library
              </span>
              <button
                type="button"
                onClick={() => setMediaLibraryOpen(true)}
                className="text-xs font-semibold text-aisle-terracotta hover:underline cursor-pointer"
              >
                Browse All ({mediaAssets.length})
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={studioFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleSelectUploadFile}
              className="hidden"
            />

            <button
              type="button"
              disabled={isUploadingMedia}
              onClick={() => studioFileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-stone-300 hover:border-aisle-terracotta p-3 text-center bg-stone-50/70 hover:bg-stone-50 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-stone-700 hover:text-stone-900"
            >
              {isUploadingMedia ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-aisle-terracotta" />
                  <span>Uploading Image...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 text-aisle-terracotta" />
                  <span>Select & Upload Image</span>
                </>
              )}
            </button>

            <form onSubmit={handleUploadMedia} className="space-y-2 text-xs pt-1 border-t border-stone-100">
              <input
                type="text"
                placeholder="Asset Title (optional)"
                value={newMediaTitle}
                onChange={(e) => setNewMediaTitle(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Or paste image URL (https://...)"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-stone-100 hover:bg-stone-200 py-1.5 text-xs font-semibold text-stone-800 cursor-pointer"
              >
                + Add via URL
              </button>
            </form>
          </div>

          {/* Delete Option for Owner Templates */}
          {ownerDesigns.some((d) => d.id === currentDesign.id) && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleDeleteDesign(currentDesign.id)}
                className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Design Draft</span>
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* 4. SAVE DETAILS MODAL */}
      {saveDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Save Template Details
              </h3>
              <button
                type="button"
                onClick={() => setSaveDetailsOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {saveModalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-800">
                {saveModalError}
              </div>
            )}

            <form onSubmit={handleConfirmSaveDetails} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={saveModalForm.name}
                  onChange={(e) => setSaveModalForm({ ...saveModalForm, name: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={saveModalForm.slug}
                  onChange={(e) => setSaveModalForm({ ...saveModalForm, slug: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Category / Taxonomy
                </label>
                <input
                  type="text"
                  value={saveModalForm.taxonomy}
                  onChange={(e) => setSaveModalForm({ ...saveModalForm, taxonomy: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Publish Status
                </label>
                <select
                  value={saveModalForm.status}
                  onChange={(e) => setSaveModalForm({ ...saveModalForm, status: e.target.value as any })}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs bg-white"
                >
                  <option value="draft">Draft (Owner studio only)</option>
                  <option value="published">Published (Available in Builder)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={saveModalForm.description}
                  onChange={(e) => setSaveModalForm({ ...saveModalForm, description: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSaveDetailsOpen(false)}
                  className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-aisle-terracotta transition-colors cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MEDIA LIBRARY MODAL / PICKER */}
      {mediaLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 shrink-0">
              <div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">
                  Media Asset Library
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {imagePickTarget
                    ? 'Select an image to apply to your current property.'
                    : 'Browse and manage platform design images.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMediaLibraryOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-1 flex-1">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 flex flex-col"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <img
                      src={asset.image_url}
                      alt={asset.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                        {asset.category}
                      </span>
                      <h4 className="text-xs font-semibold text-stone-900 truncate">
                        {asset.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 pt-1">
                      {imagePickTarget && (
                        <button
                          type="button"
                          onClick={() => handlePickMediaUrl(asset.image_url)}
                          className="flex-1 rounded-xl bg-stone-900 hover:bg-aisle-terracotta py-1.5 text-[11px] font-semibold text-white transition-colors"
                        >
                          Use
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMediaAssets((prev) => prev.filter((a) => a.id !== asset.id));
                          showToast(`Removed "${asset.title}".`);
                        }}
                        className="rounded-xl border border-stone-200 p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. FULL IMMERSION PREVIEW MODAL */}
      {fullPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="font-serif text-lg font-semibold">
                {currentDesign.name} · Full Preview
              </span>
              <button
                type="button"
                onClick={() => setFullPreviewOpen(false)}
                className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/40 transition-colors"
              >
                ✕ Close Preview
              </button>
            </div>

            <div className="w-full max-h-[82vh] overflow-y-auto rounded-3xl shadow-2xl flex justify-center">
              <LiveGuestInvitePreview
                design={currentDesign}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                previewLayout={previewLayout}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// -------------------------------------------------------------------------
// SELECTED ELEMENT CONTROLS (INSPECTOR ENGINE)
// -------------------------------------------------------------------------

function SelectedElementControls({
  selectedElement,
  draft,
  setField,
  setSectionStyle,
  onPickImage,
}: {
  selectedElement: SelectedPreviewElement;
  draft: TemplateDesignRow;
  setField: (key: keyof TemplateDesignRow, value: any) => void;
  setSectionStyle: (target: GuestPortalSectionStyleTarget, key: keyof GuestPortalSectionStyle, value: any) => void;
  onPickImage: (target: ImagePickTarget) => void;
}) {
  const target = previewElementToSectionStyleTarget(selectedElement);

  if (selectedElement === 'identity') {
    return (
      <EditorPanel title="Template Details">
        <div className="space-y-4 text-xs">
          <TextField label="Template Name" value={draft.name || ''} onChange={(val) => setField('name', val)} />
          <TextField label="URL Slug" value={draft.slug || ''} onChange={(val) => setField('slug', val)} />
          <TextField label="Taxonomy Category" value={draft.taxonomy || ''} onChange={(val) => setField('taxonomy', val)} />
          <SelectField
            label="Publish Status"
            value={draft.status || 'draft'}
            onChange={(val) => setField('status', val)}
            options={['draft', 'published', 'archived']}
          />
          <TextareaField label="Description" value={draft.description || ''} onChange={(val) => setField('description', val)} />
          <TextareaField label="Best For" value={draft.best_for || ''} onChange={(val) => setField('best_for', val)} />
        </div>
      </EditorPanel>
    );
  }

  if (selectedElement === 'hero') {
    return (
      <EditorPanel title="Hero Section & Title Card">
        <div className="space-y-4 text-xs">
          <TextField label="Eyebrow Line" value={draft.eyebrow_text || 'Among the camellias & old oaks'} onChange={(val) => setField('eyebrow_text', val)} />
          <TextField label="Poetic Line" value={draft.poetic_line || 'A garden in bloom, a love in flower'} onChange={(val) => setField('poetic_line', val)} />
          <TextField label="Invitation Phrase" value={draft.invitation_phrase || 'request the honour of your presence at the celebration of their marriage'} onChange={(val) => setField('invitation_phrase', val)} />
          <SelectField
            label="Border & Frame Flair"
            value={draft.border_flair || 'botanical-crest'}
            onChange={(val) => setField('border_flair', val)}
            options={['botanical-crest', 'arch', 'clean', 'double-line', 'hairline-gold']}
          />
          <ImageUrlField
            label="Sample Cover Photo"
            value={draft.sample_image_url || ''}
            onChange={(val) => setField('sample_image_url', val)}
            onPick={() => onPickImage({ type: 'field', key: 'sample_image_url' })}
          />
          <label className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs font-semibold text-stone-700">
            <input
              type="checkbox"
              checked={Boolean(draft.needs_photo)}
              onChange={(e) => setField('needs_photo', e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 accent-stone-900"
            />
            <span>This layout expects photos</span>
          </label>
          <ColorField label="Accent Color" value={draft.accent_color || '#9E5A44'} onChange={(val) => setField('accent_color', val)} />
          <ComponentStyleControls
            draft={draft}
            target="hero"
            setSectionStyle={setSectionStyle}
            onPickImage={onPickImage}
          />
        </div>
      </EditorPanel>
    );
  }

  if (selectedElement === 'navigation') {
    return (
      <EditorPanel title="Menu Bar & Header Navigation">
        <div className="space-y-4 text-xs">
          <ColorField label="Surface Background" value={draft.surface_color || '#FFFFFF'} onChange={(val) => setField('surface_color', val)} />
          <ColorField label="Text Ink" value={draft.text_color || '#2C2523'} onChange={(val) => setField('text_color', val)} />
          <ColorField label="Border Color" value={draft.border_color || '#E8E0D7'} onChange={(val) => setField('border_color', val)} />
          <SelectField
            label="Typography"
            value={draft.font_family || 'classic-serif'}
            onChange={(val) => setField('font_family', val)}
            options={['classic-serif', 'modern-sans', 'vintage-editorial']}
          />
          <ComponentStyleControls
            draft={draft}
            target="navigation"
            setSectionStyle={setSectionStyle}
            onPickImage={onPickImage}
          />
        </div>
      </EditorPanel>
    );
  }

  if (selectedElement === 'opening') {
    return (
      <EditorPanel title="Opening Screen & Reveal">
        <div className="space-y-4 text-xs">
          <SelectField
            label="Opening Style"
            value={draft.opening_style || 'wax-seal'}
            onChange={(val) => setField('opening_style', val)}
            options={['wax-seal', 'envelope', 'curtain', 'minimal-fade', 'venue-reveal', 'photo-reveal', 'paper-cut']}
          />
          <SelectField
            label="Decorative Theme Motif"
            value={draft.motif || 'floral'}
            onChange={(val) => setField('motif', val)}
            options={['floral', 'minimal', 'gilded', 'botanical', 'blush', 'coastal', 'vineyard', 'marigold', 'black-tie', 'editorial']}
          />
          <ColorField label="Accent Color" value={draft.accent_color || '#9E5A44'} onChange={(val) => setField('accent_color', val)} />
          <ColorField label="Surface Color" value={draft.surface_color || '#FFFFFF'} onChange={(val) => setField('surface_color', val)} />
          <p className="text-stone-500 text-[11px] leading-relaxed pt-1">
            The opening reveal screen automatically utilizes your custom colors, motifs, and typography pairing.
          </p>
        </div>
      </EditorPanel>
    );
  }

  if (selectedElement === 'sections') {
    return (
      <EditorPanel title="Default Container Style (All Sections)">
        <div className="space-y-4 text-xs">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600 leading-relaxed">
            These default container settings apply to all bordered section cards across the guest portal unless individual component custom overrides are enabled.
          </div>
          <SelectField
            label="Container Layout"
            value={draft.container_layout || 'card'}
            onChange={(val) => setField('container_layout', val)}
            options={['card', 'borderless', 'full-width', 'inset']}
          />
          <SelectField
            label="Container Padding"
            value={draft.container_padding || 'balanced'}
            onChange={(val) => setField('container_padding', val)}
            options={['compact', 'balanced', 'spacious']}
          />
          <ColorField
            label="Container Background"
            value={draft.container_surface_color || draft.surface_color || '#FFFFFF'}
            onChange={(val) => setField('container_surface_color', val)}
          />
          <ColorField
            label="Container Border"
            value={draft.container_border_color || draft.border_color || '#E8E0D7'}
            onChange={(val) => setField('container_border_color', val)}
          />
          <RangeField
            label="Corner Radius"
            value={draft.container_radius ?? 28}
            min={0}
            max={56}
            step={1}
            suffix="px"
            onChange={(val) => setField('container_radius', val)}
          />
          <RangeField
            label="Border Width"
            value={draft.container_border_width ?? 1}
            min={0}
            max={6}
            step={1}
            suffix="px"
            onChange={(val) => setField('container_border_width', val)}
          />
          <ShadowColorField
            label="Container Shadow"
            value={draft.container_shadow_color || draft.shadow_color || 'rgba(44, 37, 35, 0.06)'}
            onChange={(val) => setField('container_shadow_color', val)}
          />
        </div>
      </EditorPanel>
    );
  }

  if (target) {
    return (
      <EditorPanel title={`${selectedElementLabel(selectedElement)} Style`}>
        <ComponentStyleControls
          draft={draft}
          target={target}
          setSectionStyle={setSectionStyle}
          onPickImage={onPickImage}
        />
      </EditorPanel>
    );
  }

  // DEFAULT: Global Page Settings
  return (
    <EditorPanel title="Global Page Settings">
      <div className="space-y-5 text-xs">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600 leading-relaxed">
          These settings define the invite canvas and the default look every component inherits unless that component has custom settings switched on.
        </div>

        {/* Page Canvas Width & Background */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Page Canvas
          </h4>
          <SelectField
            label="Invite Width"
            value={draft.canvas_width || 'medium'}
            onChange={(val) => setField('canvas_width', val)}
            options={['narrow', 'medium', 'wide', 'full']}
          />
          <ColorField
            label="Page Background Color"
            value={draft.bg_color || '#FAF7F2'}
            onChange={(val) => setField('bg_color', val)}
          />
          <SelectField
            label="Page Background Image Style"
            value={draft.page_background_mode || 'none'}
            onChange={(val) => setField('page_background_mode', val)}
            options={['none', 'soft-fill', 'full-bleed', 'pattern']}
          />
          <ImageUrlField
            label="Page Background Image"
            value={draft.page_background_image_url || ''}
            onChange={(val) => setField('page_background_image_url', val)}
            onPick={() => onPickImage({ type: 'field', key: 'page_background_image_url' })}
          />
        </div>

        {/* Global Colours */}
        <div className="space-y-4 border-t border-stone-100 pt-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Global Colours
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Text" value={draft.text_color || '#2C2523'} onChange={(val) => setField('text_color', val)} />
            <ColorField label="Muted Text" value={draft.muted_color || '#7D746D'} onChange={(val) => setField('muted_color', val)} />
            <ColorField label="Accent" value={draft.accent_color || '#9E5A44'} onChange={(val) => setField('accent_color', val)} />
            <ColorField label="Base Surface" value={draft.surface_color || '#FFFFFF'} onChange={(val) => setField('surface_color', val)} />
            <ColorField label="Base Border" value={draft.border_color || '#E8E0D7'} onChange={(val) => setField('border_color', val)} />
          </div>
          <ShadowColorField
            label="Page Shadow"
            value={draft.shadow_color || 'rgba(44, 37, 35, 0.06)'}
            onChange={(val) => setField('shadow_color', val)}
          />
          <SelectField
            label="Typography Pairing"
            value={draft.font_family || 'classic-serif'}
            onChange={(val) => setField('font_family', val)}
            options={['classic-serif', 'modern-sans', 'vintage-editorial']}
          />
        </div>

        {/* Default Component Containers */}
        <div className="space-y-4 border-t border-stone-100 pt-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Default Component Containers
          </h4>
          <SelectField
            label="Default Container Layout"
            value={draft.container_layout || 'card'}
            onChange={(val) => setField('container_layout', val)}
            options={['card', 'borderless', 'full-width', 'inset']}
          />
          <SelectField
            label="Default Container Padding"
            value={draft.container_padding || 'balanced'}
            onChange={(val) => setField('container_padding', val)}
            options={['compact', 'balanced', 'spacious']}
          />
          <ColorField
            label="Default Container Background"
            value={draft.container_surface_color || draft.surface_color || '#FFFFFF'}
            onChange={(val) => setField('container_surface_color', val)}
          />
          <ColorField
            label="Default Container Border"
            value={draft.container_border_color || draft.border_color || '#E8E0D7'}
            onChange={(val) => setField('container_border_color', val)}
          />
          <RangeField
            label="Default Corner Radius"
            value={draft.container_radius ?? 28}
            min={0}
            max={56}
            step={1}
            suffix="px"
            onChange={(val) => setField('container_radius', val)}
          />
          <RangeField
            label="Default Border Width"
            value={draft.container_border_width ?? 1}
            min={0}
            max={6}
            step={1}
            suffix="px"
            onChange={(val) => setField('container_border_width', val)}
          />
          <ShadowColorField
            label="Default Container Shadow"
            value={draft.container_shadow_color || draft.shadow_color || 'rgba(44, 37, 35, 0.06)'}
            onChange={(val) => setField('container_shadow_color', val)}
          />
        </div>
      </div>
    </EditorPanel>
  );
}

// -------------------------------------------------------------------------
// COMPONENT STYLE CONTROLS (CUSTOM OVERRIDES PER ELEMENT)
// -------------------------------------------------------------------------

function ComponentStyleControls({
  draft,
  target,
  setSectionStyle,
  onPickImage,
}: {
  draft: TemplateDesignRow;
  target: GuestPortalSectionStyleTarget;
  setSectionStyle: (target: GuestPortalSectionStyleTarget, key: keyof GuestPortalSectionStyle, value: any) => void;
  onPickImage: (target: ImagePickTarget) => void;
}) {
  const styles = draft.section_styles || {};
  const style = styles[target] || {};
  const enabled = Boolean(style.useCustomStyle);

  return (
    <div className="space-y-4 pt-1">
      {/* Target-specific extra fields (e.g. Our story photo) */}
      {(target === 'story' || target === 'our-story') && (
        <ImageUrlField
          label="Our Story Image"
          value={style.contentImageUrl || ''}
          onChange={(val) => setSectionStyle(target, 'contentImageUrl', val)}
          onPick={() => onPickImage({ type: 'section', target, key: 'contentImageUrl' })}
        />
      )}

      {/* Enable Custom Override Toggle */}
      <label className="flex items-start gap-2.5 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-xs font-semibold text-stone-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setSectionStyle(target, 'useCustomStyle', e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-stone-900"
        />
        <span>
          Use custom settings for this component
          <span className="mt-0.5 block font-normal text-[11px] text-stone-500 leading-normal">
            When off, this component inherits the global page container defaults.
          </span>
        </span>
      </label>

      {/* Expanded Custom Settings */}
      {enabled && (
        <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4">
          <SelectField
            label="Container Layout"
            value={style.containerLayout || draft.container_layout || 'card'}
            onChange={(val) => setSectionStyle(target, 'containerLayout', val)}
            options={['card', 'borderless', 'full-width', 'inset']}
          />
          <SelectField
            label="Container Padding"
            value={style.containerPadding || draft.container_padding || 'balanced'}
            onChange={(val) => setSectionStyle(target, 'containerPadding', val)}
            options={['compact', 'balanced', 'spacious']}
          />
          <ColorField
            label="Container Background"
            value={style.containerSurface || draft.container_surface_color || draft.surface_color || '#FFFFFF'}
            onChange={(val) => setSectionStyle(target, 'containerSurface', val)}
          />
          <ColorField
            label="Container Border"
            value={style.containerBorder || draft.container_border_color || draft.border_color || '#E8E0D7'}
            onChange={(val) => setSectionStyle(target, 'containerBorder', val)}
          />
          <RangeField
            label="Corner Radius"
            value={style.containerRadius ?? draft.container_radius ?? 28}
            min={0}
            max={56}
            step={1}
            suffix="px"
            onChange={(val) => setSectionStyle(target, 'containerRadius', val)}
          />
          <RangeField
            label="Border Width"
            value={style.containerBorderWidth ?? draft.container_border_width ?? 1}
            min={0}
            max={6}
            step={1}
            suffix="px"
            onChange={(val) => setSectionStyle(target, 'containerBorderWidth', val)}
          />
          <ShadowColorField
            label="Container Shadow"
            value={style.containerShadow || draft.container_shadow_color || draft.shadow_color || 'rgba(44, 37, 35, 0.06)'}
            onChange={(val) => setSectionStyle(target, 'containerShadow', val)}
          />
          <SelectField
            label="Component Background Mode"
            value={style.backgroundMode || 'none'}
            onChange={(val) => setSectionStyle(target, 'backgroundMode', val)}
            options={['none', 'soft-fill', 'full-bleed', 'pattern']}
          />
          <ImageUrlField
            label="Component Background Image"
            value={style.backgroundImageUrl || ''}
            onChange={(val) => setSectionStyle(target, 'backgroundImageUrl', val)}
            onPick={() => onPickImage({ type: 'section', target, key: 'backgroundImageUrl' })}
          />
          <SelectField
            label="Text Box Frame"
            value={style.textFrameStyle || draft.text_frame_style || 'glass'}
            onChange={(val) => setSectionStyle(target, 'textFrameStyle', val)}
            options={['none', 'outline', 'filled', 'glass']}
          />
          <RangeField
            label="Text Box Radius"
            value={style.textFrameRadius ?? draft.text_frame_radius ?? 20}
            min={0}
            max={48}
            step={1}
            suffix="px"
            onChange={(val) => setSectionStyle(target, 'textFrameRadius', val)}
          />
          <RangeField
            label="Text Box Border Width"
            value={style.textFrameBorderWidth ?? draft.text_frame_border_width ?? 1}
            min={0}
            max={6}
            step={1}
            suffix="px"
            onChange={(val) => setSectionStyle(target, 'textFrameBorderWidth', val)}
          />
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------
// SECTION ORDER & VISIBILITY CONTROLS
// -------------------------------------------------------------------------

function SectionOrderControls({
  order,
  hiddenSections,
  onMove,
  onToggle,
  onSelect,
}: {
  order: GuestPortalSectionId[];
  hiddenSections: GuestPortalSectionId[];
  onMove: (secId: GuestPortalSectionId, dir: -1 | 1) => void;
  onToggle: (secId: GuestPortalSectionId) => void;
  onSelect: (el: SelectedPreviewElement) => void;
}) {
  return (
    <EditorPanel title="Section Order & Visibility">
      <div className="space-y-2">
        {order.map((sectionId, index) => {
          const isHidden = hiddenSections.includes(sectionId);
          return (
            <div
              key={sectionId}
              className={`rounded-2xl border px-3 py-2.5 transition-colors flex items-center justify-between gap-2 ${
                isHidden ? 'border-stone-200 bg-stone-50 opacity-60' : 'border-stone-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(sectionIdToPreviewElement(sectionId))}
                className="min-w-0 flex-1 text-left text-xs font-semibold text-stone-800 hover:text-aisle-terracotta truncate cursor-pointer"
              >
                {index + 1}. {sectionLabel(sectionId)}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onMove(sectionId, -1)}
                  disabled={index === 0}
                  className="h-7 w-7 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(sectionId, 1)}
                  disabled={index === order.length - 1}
                  className="h-7 w-7 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <label className="flex h-7 items-center gap-1 rounded-lg border border-stone-200 px-2 text-[10px] font-semibold text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!isHidden}
                    onChange={() => onToggle(sectionId)}
                    className="h-3 w-3 accent-stone-900"
                  />
                  <span>Show</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </EditorPanel>
  );
}

// -------------------------------------------------------------------------
// LIVE GUEST INVITE PREVIEW (AUTHENTIC AISLEFLOW DESIGNS)
// -------------------------------------------------------------------------

function LiveGuestInvitePreview({
  design,
  selectedElement,
  onSelectElement,
  previewLayout = 'editorial-ceremony',
}: {
  design: TemplateDesignRow;
  selectedElement: SelectedPreviewElement;
  onSelectElement: (el: SelectedPreviewElement) => void;
  previewLayout?: PreviewLayoutId;
}) {
  const heroStyle = computeSectionStyle(design, 'hero');
  const welcomeStyle = computeSectionStyle(design, 'welcome');
  const countdownStyle = computeSectionStyle(design, 'countdown');

  const activeSections = (design.section_order || ALL_GUEST_SECTIONS).filter(
    (s) => !(design.hidden_sections || []).includes(s)
  );

  return (
    <div
      style={{
        backgroundColor: design.bg_color,
        color: design.text_color,
        maxWidth:
          design.canvas_width === 'narrow'
            ? '420px'
            : design.canvas_width === 'medium'
            ? '520px'
            : design.canvas_width === 'wide'
            ? '640px'
            : '100%',
      }}
      className={`w-full rounded-3xl border border-stone-200/80 shadow-wedding-lg overflow-y-auto max-h-[840px] p-6 sm:p-9 space-y-10 transition-all duration-300 ${fontClass(
        design.font_family
      )}`}
    >
      {/* 1. HERO INVITATION CARD (AISLEFLOW SIGNATURE) */}
      <PreviewClickable
        selected={selectedElement === 'hero'}
        onSelect={() => onSelectElement('hero')}
        className="relative text-center space-y-5 p-6 sm:p-8 rounded-3xl border transition"
        style={containerInlineStyle(heroStyle, design)}
      >
        {/* Botanical Motif Corners if Botanical / Floral */}
        {(design.motif === 'floral' || design.motif === 'botanical') && (
          <>
            <BotanicalCorner className="absolute top-2 left-2 pointer-events-none opacity-40" />
            <BotanicalCorner className="absolute top-2 right-2 rotate-90 pointer-events-none opacity-40" />
          </>
        )}

        {/* Monogram Crest or Floron */}
        <div className="flex justify-center items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-aisle-gold/60" />
          <span className="font-editorial text-sm italic" style={{ color: design.accent_color }}>
            {design.floron || '❦'}
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-aisle-gold/60" />
        </div>

        {/* Eyebrow line */}
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: design.accent_color }}>
          {design.eyebrow_text || 'Together with their families'}
        </p>

        {/* Couple Names */}
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Sarah & James
          </h1>
          <p className="text-xs sm:text-sm font-editorial italic pt-1 max-w-sm mx-auto leading-relaxed" style={{ color: design.muted_color }}>
            {design.invitation_phrase || 'request the honour of your presence at the celebration of their marriage'}
          </p>
        </div>

        {/* Wedding Date & Location */}
        <div className="space-y-1 pt-1">
          <p className="font-serif text-base sm:text-lg font-medium tracking-wide">
            Friday, February 26, 2027
          </p>
          <p className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: design.accent_color }}>
            Villa d'Este · Lake Como, Italy
          </p>
        </div>

        {/* Designed Cover Photo (Arched Top or Clean Plate) */}
        {design.sample_image_url && design.needs_photo && (
          <div className="relative pt-3">
            <div
              className={`relative mx-auto aspect-[4/5] sm:aspect-[16/11] w-full overflow-hidden shadow-wedding transition-all ${
                design.border_flair === 'arch'
                  ? 'rounded-t-[140px] rounded-b-2xl'
                  : design.border_flair === 'botanical-crest'
                  ? 'rounded-3xl border-2'
                  : 'rounded-2xl border'
              }`}
              style={{ borderColor: design.border_color }}
            >
              <img src={design.sample_image_url} alt="Cover" className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        {/* Minimal Inline Countdown */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement('countdown');
          }}
          className={`pt-5 border-t my-4 cursor-pointer transition ${
            selectedElement === 'countdown' ? 'ring-2 ring-blue-500 rounded-2xl p-2' : ''
          }`}
          style={{ borderColor: `${design.border_color}80` }}
        >
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-center">
            <div>
              <span className="font-editorial text-2xl sm:text-3xl font-semibold block leading-none">
                180
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-70 mt-1 block">
                Days
              </span>
            </div>
            <span className="opacity-30 text-base">·</span>
            <div>
              <span className="font-editorial text-2xl sm:text-3xl font-semibold block leading-none">
                21
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-70 mt-1 block">
                Hours
              </span>
            </div>
            <span className="opacity-30 text-base">·</span>
            <div>
              <span className="font-editorial text-2xl sm:text-3xl font-semibold block leading-none">
                44
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-70 mt-1 block">
                Minutes
              </span>
            </div>
          </div>
        </div>
      </PreviewClickable>

      <GoldHairlineDivider />

      {/* 2. DYNAMICALLY ORDERED CHAPTER SECTIONS */}
      {activeSections.map((secId, index) => {
        const secStyle = computeSectionStyle(design, secId);
        const isSelected = selectedElement === sectionIdToPreviewElement(secId);
        const chapterNumber = romanize(index + 1);

        if (secId === 'our-story') {
          const storyImg =
            secStyle.contentImageUrl ||
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80';
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('story')}
              className="p-6 rounded-3xl border transition space-y-5 text-center"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Our Story</h2>
              </div>

              <p className="font-editorial text-lg sm:text-xl italic max-w-md mx-auto leading-relaxed opacity-90">
                "{design.poetic_line || 'Two hearts, one horizon · Where the lake meets the sky'}"
              </p>

              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm border"
                style={{ borderColor: design.border_color }}
              >
                <img src={storyImg} alt="Our Story" className="h-full w-full object-cover" />
              </div>

              <p className="text-xs sm:text-sm leading-relaxed max-w-lg mx-auto text-left font-sans opacity-80" style={{ color: design.text_color }}>
                Meeting on the shores of Bellagio and discovering a lifetime of shared adventures under the northern Italian sun. We cannot wait to celebrate our vows with those dearest to us.
              </p>
            </PreviewClickable>
          );
        }

        if (secId === 'schedule') {
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('schedule')}
              className="p-6 rounded-3xl border transition space-y-6"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">The Itinerary</h2>
                <p className="text-xs font-editorial italic opacity-75">
                  Curated for Elena & Party
                </p>
              </div>

              {/* Seamless Vertical Timeline */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-transparent before:via-aisle-gold/50 before:to-transparent">
                {[
                  ['7:00 PM', 'VIP Rehearsal Brunch', 'Private Dining Suite', 'Smart Casual'],
                  ['4:00 PM', 'Ceremony & Vows', "Villa d'Este Gardens", 'Black Tie Formal'],
                  ['6:30 PM', 'Dinner Gala & Toasts', 'The Grand Ballroom', 'Black Tie Formal'],
                ].map(([time, title, place, attire]) => (
                  <div key={title} className="relative group">
                    <span
                      className="absolute -left-[21px] sm:-left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 transition-transform duration-300"
                      style={{
                        backgroundColor: design.accent_color,
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-serif text-base font-semibold tracking-tight">{title}</h3>
                        <span className="text-xs uppercase tracking-widest font-semibold font-sans" style={{ color: design.accent_color }}>
                          {time}
                        </span>
                      </div>
                      <p className="text-xs opacity-75 flex items-center gap-1 font-sans">
                        <MapPin className="h-3 w-3 inline" /> {place}
                      </p>
                      <div className="pt-1 font-sans">
                        <span
                          className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                          style={{
                            borderColor: design.border_color,
                            backgroundColor: design.surface_color,
                          }}
                        >
                          Attire: {attire}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PreviewClickable>
          );
        }

        if (secId === 'travel') {
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('travel')}
              className="p-6 rounded-3xl border transition space-y-4 text-center"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">The Venue & Travel</h2>
              </div>

              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-sm border"
                style={{ borderColor: design.border_color }}
              >
                <img
                  src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80"
                  alt="Venue"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-2 text-left font-sans pt-1">
                <h3 className="font-serif text-lg font-semibold text-center">Villa d'Este · Lake Como</h3>
                <p className="text-xs opacity-75 text-center">Via Regina, 40, 22012 Cernobbio CO, Italy</p>
                <div
                  className="mt-3 text-xs leading-relaxed p-4 rounded-2xl border"
                  style={{
                    backgroundColor: `${design.surface_color}90`,
                    borderColor: design.border_color,
                  }}
                >
                  <strong className="block mb-1 text-xs uppercase tracking-wider font-semibold">
                    Travel Guidance & Arrival
                  </strong>
                  Private water taxi shuttles will operate hourly from Cernobbio main dock starting at 3:00 PM on Friday.
                </div>
              </div>
            </PreviewClickable>
          );
        }

        if (secId === 'rsvp') {
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('rsvp')}
              className="p-6 rounded-3xl border transition space-y-5"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">RSVP Confirmation</h2>
                <p className="text-xs font-editorial italic opacity-75">
                  Kindly reply by January 15, 2027
                </p>
              </div>

              <div className="space-y-4 font-sans">
                {['Elena Vance (Honored Guest)', 'Guest Plus-One'].map((name) => (
                  <div
                    key={name}
                    className="rounded-2xl border p-4 space-y-3"
                    style={{
                      borderColor: design.border_color,
                      backgroundColor: `${design.surface_color}90`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: design.text_color }}>
                        {name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: design.accent_color }}>
                        Attending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className="rounded-xl py-2 px-3 text-center text-xs font-semibold text-white shadow-xs"
                        style={{ backgroundColor: design.accent_color }}
                      >
                        Joyfully Accept
                      </div>
                      <div
                        className="rounded-xl border py-2 px-3 text-center text-xs font-semibold"
                        style={{ borderColor: design.border_color, color: design.muted_color }}
                      >
                        Regretfully Decline
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PreviewClickable>
          );
        }

        if (secId === 'registry') {
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('registry')}
              className="p-6 rounded-3xl border transition space-y-4 text-center"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Gift Registry & Funds</h2>
              </div>

              <p className="text-xs font-editorial italic opacity-75 max-w-sm mx-auto">
                Your presence is our greatest present. If you wish to honour us with a gift, our registry is curated below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans pt-2">
                {[
                  ['Lake Como Honeymoon Fund', 'Cash Fund', 'Contribute'],
                  ['Ceramic Dinnerware Set', 'Physical Gift', 'View on Crate & Barrel'],
                ].map(([title, type, cta]) => (
                  <div
                    key={title}
                    className="rounded-2xl border p-4 text-left flex flex-col justify-between space-y-2"
                    style={{
                      borderColor: design.border_color,
                      backgroundColor: `${design.surface_color}90`,
                    }}
                  >
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 block">
                        {type}
                      </span>
                      <h4 className="text-xs font-semibold mt-0.5">{title}</h4>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold"
                      style={{ color: design.accent_color }}
                    >
                      {cta} <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                ))}
              </div>
            </PreviewClickable>
          );
        }

        if (secId === 'photos') {
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('photos')}
              className="p-6 rounded-3xl border transition space-y-4 text-center"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Shared Photo Stream</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl overflow-hidden border bg-stone-100 shadow-xs"
                    style={{ borderColor: design.border_color }}
                  >
                    <img
                      src={`https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </PreviewClickable>
          );
        }

        if (secId === 'wedding-party') {
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('wedding-party')}
              className="p-6 rounded-3xl border transition space-y-4 text-center"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Wedding Party</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans pt-1">
                {[
                  ['Maya Chen', 'Maid of Honor'],
                  ['Leo Fischer', 'Best Man'],
                ].map(([name, role]) => (
                  <div
                    key={name}
                    className="rounded-2xl border p-3.5 flex items-center gap-3 text-left"
                    style={{
                      borderColor: design.border_color,
                      backgroundColor: `${design.surface_color}90`,
                    }}
                  >
                    <span
                      className="h-9 w-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ borderColor: `${design.accent_color}50`, color: design.accent_color }}
                    >
                      {name.charAt(0)}
                    </span>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: design.text_color }}>
                        {name}
                      </div>
                      <div className="text-[10px] opacity-70" style={{ color: design.muted_color }}>
                        {role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PreviewClickable>
          );
        }

        if (secId === 'local-recs') {
          return (
            <PreviewClickable
              key={secId}
              selected={isSelected}
              onSelect={() => onSelectElement('local')}
              className="p-6 rounded-3xl border transition space-y-4 text-center"
              style={containerInlineStyle(secStyle, design)}
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                  Chapter {chapterNumber}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Around Lake Como</h2>
              </div>
              <p className="text-xs leading-relaxed font-sans opacity-80" style={{ color: design.muted_color }}>
                Enjoy lakeside espresso near the ferry dock, scenic boat tours to Bellagio, and our favorite rustic trattorias.
              </p>
            </PreviewClickable>
          );
        }

        // secId === 'faq'
        return (
          <PreviewClickable
            key={secId}
            selected={isSelected}
            onSelect={() => onSelectElement('faq')}
            className="p-6 rounded-3xl border transition space-y-4 text-center"
            style={containerInlineStyle(secStyle, design)}
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold block" style={{ color: design.accent_color }}>
                Chapter {chapterNumber}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold">Guest FAQs</h2>
            </div>
            <div className="space-y-2 font-sans text-left">
              {['What is the dress code for Saturday gala?', 'Are shuttle transfers provided?', 'Where can we park rental cars?'].map((q) => (
                <div
                  key={q}
                  className="rounded-2xl border p-3.5 text-xs font-semibold"
                  style={{
                    borderColor: design.border_color,
                    backgroundColor: `${design.surface_color}90`,
                    color: design.text_color,
                  }}
                >
                  {q}
                </div>
              ))}
            </div>
          </PreviewClickable>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------------
// STYLING COMPUTATION & HELPERS
// -------------------------------------------------------------------------

function computeSectionStyle(
  design: TemplateDesignRow,
  target: GuestPortalSectionStyleTarget
): GuestPortalSectionStyle {
  const styles = design.section_styles || {};
  const style = styles[target] || {};

  if (!style.useCustomStyle) {
    return {
      containerLayout: design.container_layout || 'card',
      containerPadding: design.container_padding || 'balanced',
      containerSurface: design.container_surface_color || design.surface_color || '#FFFFFF',
      containerBorder: design.container_border_color || design.border_color || '#E8E0D7',
      containerShadow: design.container_shadow_color || design.shadow_color || 'rgba(44, 37, 35, 0.06)',
      containerRadius: design.container_radius ?? 28,
      containerBorderWidth: design.container_border_width ?? 1,
      textFrameStyle: design.text_frame_style || 'glass',
      textFrameRadius: design.text_frame_radius ?? 20,
      textFrameBorderWidth: design.text_frame_border_width ?? 1,
      backgroundMode: 'none',
      backgroundImageUrl: '',
    };
  }

  return {
    useCustomStyle: true,
    containerLayout: style.containerLayout || design.container_layout || 'card',
    containerPadding: style.containerPadding || design.container_padding || 'balanced',
    containerSurface: style.containerSurface || design.container_surface_color || design.surface_color || '#FFFFFF',
    containerBorder: style.containerBorder || design.container_border_color || design.border_color || '#E8E0D7',
    containerShadow: style.containerShadow || design.container_shadow_color || design.shadow_color || 'rgba(44, 37, 35, 0.06)',
    containerRadius: style.containerRadius ?? design.container_radius ?? 28,
    containerBorderWidth: style.containerBorderWidth ?? design.container_border_width ?? 1,
    backgroundMode: style.backgroundMode || 'none',
    backgroundImageUrl: style.backgroundImageUrl || '',
    contentImageUrl: style.contentImageUrl,
    textFrameStyle: style.textFrameStyle || design.text_frame_style || 'glass',
    textFrameRadius: style.textFrameRadius ?? design.text_frame_radius ?? 20,
    textFrameBorderWidth: style.textFrameBorderWidth ?? design.text_frame_border_width ?? 1,
  };
}

function containerInlineStyle(style: GuestPortalSectionStyle, design: TemplateDesignRow): React.CSSProperties {
  const isBorderless = style.containerLayout === 'borderless';

  return {
    backgroundColor: isBorderless ? 'transparent' : style.containerSurface,
    borderColor: isBorderless ? 'transparent' : style.containerBorder,
    borderRadius: isBorderless ? 0 : `${style.containerRadius}px`,
    borderWidth: isBorderless ? 0 : `${style.containerBorderWidth}px`,
    boxShadow: isBorderless ? 'none' : `0 12px 36px ${style.containerShadow}`,
  };
}

function PreviewClickable({
  children,
  selected,
  onSelect,
  className = '',
  style,
}: {
  children: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      className={`cursor-pointer transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-stone-400'
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function EditorPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-serif text-base font-semibold text-stone-900 border-b border-stone-100 pb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

// -------------------------------------------------------------------------
// REUSABLE FORM INPUT COMPONENTS
// -------------------------------------------------------------------------

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs capitalize"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replaceAll('-', ' ')}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded-lg border border-stone-200 cursor-pointer p-0.5 shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-stone-200 px-2.5 py-1.5 font-mono text-[11px]"
        />
      </div>
    </div>
  );
}

function ShadowColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const parsed = parseShadowColor(value);

  const handleHexChange = (newHex: string) => {
    const rgb = hexToRgb(newHex) || parsed.rgb;
    onChange(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.alpha})`);
  };

  const handleAlphaChange = (newAlpha: number) => {
    onChange(`rgba(${parsed.rgb.r}, ${parsed.rgb.g}, ${parsed.rgb.b}, ${newAlpha.toFixed(2)})`);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
          {label}
        </label>
        <span className="text-[10px] font-mono text-stone-500">
          {Math.round(parsed.alpha * 100)}%
        </span>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={parsed.hex}
            onChange={(e) => handleHexChange(e.target.value)}
            className="h-7 w-7 rounded-lg border border-stone-200 cursor-pointer p-0.5 shrink-0"
          />
          <span className="font-mono text-[11px] text-stone-700">{parsed.hex}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={parsed.alpha}
          onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
          className="w-full accent-stone-900"
        />
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = 'px',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-medium mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</span>
        <span className="text-stone-900 font-semibold">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-stone-900"
      />
    </div>
  );
}

function ImageUrlField({
  label,
  value,
  onChange,
  onPick,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onPick: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
          {label}
        </label>
        <button
          type="button"
          onClick={onPick}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-aisle-terracotta hover:underline"
        >
          <ImageIcon className="h-3 w-3" />
          Pick Image
        </button>
      </div>
      <input
        type="text"
        placeholder="https://..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs"
      />
      {value && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-stone-200">
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------
// PARSING & LABEL HELPERS
// -------------------------------------------------------------------------

function selectedElementLabel(element: SelectedPreviewElement): string {
  const labels: Record<SelectedPreviewElement, string> = {
    identity: 'Template Details',
    page: 'Global Page Settings',
    welcome: 'Guest Welcome',
    hero: 'Hero & Title Card',
    navigation: 'Menu Bar & Header Navigation',
    sections: 'Default Containers',
    countdown: 'Countdown Clock',
    rsvp: 'RSVP Confirmation Card',
    schedule: 'The Itinerary',
    story: 'Our Story Narrative',
    travel: 'The Venue & Travel',
    registry: 'Gift Registry & Funds',
    faq: 'Guest FAQs',
    local: 'Around Lake Como',
    'wedding-party': 'Wedding Party / Entourage',
    photos: 'Shared Photo Stream',
    opening: 'Opening Screen & Reveal',
    library: 'Media Asset Library',
  };
  return labels[element] || 'Component Settings';
}

function sectionLabel(sectionId: GuestPortalSectionId): string {
  const labels: Record<GuestPortalSectionId, string> = {
    'our-story': 'Our Story',
    schedule: 'The Itinerary',
    travel: 'The Venue & Travel',
    rsvp: 'RSVP Confirmation',
    registry: 'Registry & Funds',
    photos: 'Photo Stream',
    'wedding-party': 'Wedding Party',
    'local-recs': 'Local Tips',
    faq: 'Guest FAQs',
  };
  return labels[sectionId] || sectionId;
}

function sectionIdToPreviewElement(sectionId: GuestPortalSectionId): SelectedPreviewElement {
  const map: Record<GuestPortalSectionId, SelectedPreviewElement> = {
    rsvp: 'rsvp',
    schedule: 'schedule',
    'our-story': 'story',
    travel: 'travel',
    registry: 'registry',
    faq: 'faq',
    'local-recs': 'local',
    'wedding-party': 'wedding-party',
    photos: 'photos',
  };
  return map[sectionId];
}

function previewElementToSectionStyleTarget(element: SelectedPreviewElement): GuestPortalSectionStyleTarget | null {
  const map: Partial<Record<SelectedPreviewElement, GuestPortalSectionStyleTarget>> = {
    navigation: 'navigation',
    welcome: 'welcome',
    hero: 'hero',
    countdown: 'countdown',
    rsvp: 'rsvp',
    schedule: 'schedule',
    story: 'our-story',
    travel: 'travel',
    registry: 'registry',
    faq: 'faq',
    local: 'local-recs',
    'wedding-party': 'wedding-party',
    photos: 'photos',
  };
  return map[element] || null;
}

function fontClass(fontFamily?: string): string {
  if (fontFamily === 'modern-sans') return 'font-sans';
  if (fontFamily === 'vintage-editorial') return 'font-editorial';
  return 'font-serif';
}

function romanize(num: number): string {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return roman[num - 1] || `${num}`;
}

function parseShadowColor(value: string) {
  const fallback = { r: 44, g: 37, b: 35 };
  const rgbaMatch = value?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);

  if (rgbaMatch) {
    const rgb = {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
    };
    const alpha = rgbaMatch[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(rgbaMatch[4])));
    return { rgb, alpha, hex: rgbToHex(rgb.r, rgb.g, rgb.b) };
  }

  const rgb = hexToRgb(value) || fallback;
  return { rgb, alpha: 0.06, hex: rgbToHex(rgb.r, rgb.g, rgb.b) };
}

function hexToRgb(hex: string) {
  if (!hex) return null;
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
    .join('')}`;
}
