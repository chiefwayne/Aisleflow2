'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwnerAccess } from '@/lib/owner-auth';
import { TemplateDesignRecord, TemplateMediaAssetRecord } from '@/lib/types';

const MEDIA_BUCKET = 'template-media';

export async function fetchTemplateDesignRows(): Promise<TemplateDesignRecord[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('template_designs')
      .select('*')
      .order('created_at', { ascending: false });

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

    revalidatePath('/owner/studio');
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

    revalidatePath('/owner/studio');
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
    const dbPayload = {
      ...design,
      slug,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error } = await supabaseAdmin
      .from('template_designs')
      .upsert(dbPayload, { onConflict: 'slug' })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/owner/studio');
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

    revalidatePath('/owner/studio');
    return { success: true };
  } catch (err: any) {
    console.error('deleteTemplateDesignAction error:', err);
    return { error: err.message };
  }
}
