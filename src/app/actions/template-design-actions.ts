'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwnerAccess, verifyOwnerAccess } from '@/lib/owner-auth';
import { requireAdminAccess } from '@/lib/admin-auth';
import { featureError, hasFeature } from '@/lib/plans';
import { TemplateDesignRecord, TemplateMediaAssetRecord } from '@/lib/types';

const MEDIA_BUCKET = 'template-media';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEMPLATE_DESIGN_COLUMNS = [
  'name', 'taxonomy', 'description', 'best_for', 'opening_style', 'hero_treatment', 'motif',
  'font_family', 'canvas_width', 'bg_color', 'text_color', 'accent_color', 'muted_color',
  'surface_color', 'border_color', 'shadow_color', 'page_background_image_url', 'page_background_mode',
  'container_surface_color', 'container_border_color', 'container_shadow_color', 'container_radius',
  'container_border_width', 'container_layout', 'container_padding', 'text_frame_style',
  'text_frame_radius', 'text_frame_border_width', 'section_order', 'hidden_sections', 'section_styles',
  'per_section_styles', 'sample_image_url', 'eyebrow_text', 'poetic_line', 'invitation_phrase',
  'floron', 'border_flair', 'is_dark', 'status',
] as const;

/** The owner sees every design; everyone else sees published designs only. */
export async function fetchTemplateDesignRows(ownerToken?: string): Promise<TemplateDesignRecord[]> {
  try {
    let query = supabaseAdmin
      .from('template_designs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!ownerToken || !verifyOwnerAccess(ownerToken)) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as TemplateDesignRecord[];
  } catch (err) {
    console.error('fetchTemplateDesignRows error:', err);
    return [];
  }
}

export async function fetchTemplateMediaAssets(category?: string): Promise<TemplateMediaAssetRecord[]> {
  try {
    let query = supabaseAdmin.from('template_media_assets').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data as TemplateMediaAssetRecord[];
  } catch (err) {
    console.error('fetchTemplateMediaAssets error:', err);
    return [];
  }
}

export async function uploadTemplateMediaAssetAction(formData: FormData) {
  try {
    const ownerToken = formData.get('ownerToken') as string;
    const title = (formData.get('title') as string) || 'Design Asset';
    const category = (formData.get('category') as any) || 'other';
    const file = formData.get('file') as File | null;

    requireOwnerAccess(ownerToken);

    if (!file) {
      return { error: 'No media file provided.' };
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `${category}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    let imageUrl = '';
    if (uploadErr) {
      // Fallback data url
      imageUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else {
      const { data: publicUrlData } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
      imageUrl = publicUrlData.publicUrl;
    }

    const { data: asset, error: dbErr } = await supabaseAdmin
      .from('template_media_assets')
      .insert({
        title,
        category,
        image_url: imageUrl,
        storage_path: storagePath,
        content_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    revalidatePath('/owner/templates');
    return { success: true, asset };
  } catch (err: any) {
    console.error('uploadTemplateMediaAssetAction error:', err);
    return { error: err.message || 'Failed to upload asset.' };
  }
}

export async function deleteTemplateMediaAssetAction(formData: FormData) {
  try {
    const ownerToken = formData.get('ownerToken') as string;
    const assetId = formData.get('assetId') as string;

    requireOwnerAccess(ownerToken);

    const { data: asset } = await supabaseAdmin
      .from('template_media_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (asset?.storage_path) {
      await supabaseAdmin.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
    }

    await supabaseAdmin.from('template_media_assets').delete().eq('id', assetId);

    revalidatePath('/owner/templates');
    return { success: true };
  } catch (err: any) {
    console.error('deleteTemplateMediaAssetAction error:', err);
    return { error: err.message };
  }
}

export async function saveTemplateDesignAction(formData: FormData) {
  try {
    const ownerToken = formData.get('ownerToken') as string;
    const designJson = formData.get('design') as string;

    requireOwnerAccess(ownerToken);
    const design = JSON.parse(designJson);

    const slug = design.slug || design.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    // Only known columns are written. Saved designs are updated by id. Unsaved Studio ids
    // (owner_...) are not uuids, so those are inserted, or matched by slug.
    const dbPayload: Record<string, unknown> = { slug, updated_at: new Date().toISOString() };
    for (const column of TEMPLATE_DESIGN_COLUMNS) {
      if (design[column] !== undefined) dbPayload[column] = design[column];
    }
    const isSaved = typeof design.id === 'string' && UUID_PATTERN.test(design.id);

    const table = supabaseAdmin.from('template_designs');
    const { data: saved, error } = await (isSaved
      ? table.update(dbPayload).eq('id', design.id)
      : table.upsert(dbPayload, { onConflict: 'slug' })
    )
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/owner/templates');
    return { success: true, design: saved };
  } catch (err: any) {
    console.error('saveTemplateDesignAction error:', err);
    return { error: err.message || 'Failed to save template design.' };
  }
}

export async function deleteTemplateDesignAction(formData: FormData) {
  try {
    const ownerToken = formData.get('ownerToken') as string;
    const designId = formData.get('designId') as string;

    requireOwnerAccess(ownerToken);

    await supabaseAdmin.from('template_designs').delete().eq('id', designId);

    revalidatePath('/owner/templates');
    return { success: true };
  } catch (err: any) {
    console.error('deleteTemplateDesignAction error:', err);
    return { error: err.message };
  }
}

/** Lets the owner unlock page confirm a passkey against the server secret. */
export async function verifyOwnerPasskeyAction(passkey: string) {
  return verifyOwnerAccess(passkey);
}

/** Saves a Premium couple's Studio design into their own event (not the shared catalogue). */
export async function saveEventStudioDesignAction(input: {
  eventId: string;
  adminToken: string;
  design: string;
}): Promise<{ success: true } | { error: string }> {
  try {
    await requireAdminAccess(input.eventId, input.adminToken);

    const { data: event } = await supabaseAdmin.from('events').select('id, plan').eq('id', input.eventId).single();
    if (!event) return { error: 'Event not found.' };
    if (!hasFeature(event, 'design_studio')) return { error: featureError('design_studio') };

    const design = JSON.parse(input.design);
    const snapshot: Record<string, unknown> = {};
    for (const column of TEMPLATE_DESIGN_COLUMNS) {
      if (column !== 'status' && design[column] !== undefined) snapshot[column] = design[column];
    }
    // container_layout marks a Studio design, so the portal applies its layout controls.
    snapshot.container_layout ||= 'card';
    snapshot.id = `event-studio-${input.eventId}`;

    const { error } = await supabaseAdmin
      .from('events')
      .update({ theme_config: snapshot, updated_at: new Date().toISOString() })
      .eq('id', input.eventId);
    if (error) throw error;

    revalidatePath(`/admin/${input.adminToken}`);
    revalidatePath('/g/[token]', 'page');
    return { success: true };
  } catch (err: any) {
    console.error('saveEventStudioDesignAction error:', err);
    return { error: err.message || 'Failed to save your design.' };
  }
}
