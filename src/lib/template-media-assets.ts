import { supabaseAdmin } from './supabase';
import { TemplateMediaAssetRecord } from './types';

const BUCKET_NAME = 'template-media';

export async function fetchTemplateMediaAssets(category?: string): Promise<TemplateMediaAssetRecord[]> {
  try {
    let query = supabaseAdmin.from('template_media_assets').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error || !data) {
      return [];
    }
    return data as TemplateMediaAssetRecord[];
  } catch (err) {
    console.error('fetchTemplateMediaAssets error:', err);
    return [];
  }
}

export async function deleteTemplateMediaAsset(id: string) {
  try {
    const { data: asset } = await supabaseAdmin
      .from('template_media_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (asset?.storage_path) {
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([asset.storage_path]);
    }
    await supabaseAdmin.from('template_media_assets').delete().eq('id', id);
    return { success: true };
  } catch (err: any) {
    console.error('deleteTemplateMediaAsset error:', err);
    return { error: err.message };
  }
}
