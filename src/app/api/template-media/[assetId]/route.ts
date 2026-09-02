import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MEDIA_BUCKET = 'template-media';

export async function GET(
  request: Request,
  context: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await context.params;

    const { data: asset } = await supabaseAdmin
      .from('template_media_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.storage_path) {
      const { data, error } = await supabaseAdmin.storage
        .from(MEDIA_BUCKET)
        .download(asset.storage_path);

      if (!error && data) {
        return new NextResponse(data, {
          headers: {
            'Content-Type': asset.content_type || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    if (asset.image_url) {
      return NextResponse.redirect(asset.image_url);
    }

    return NextResponse.json({ error: 'Media stream unavailable' }, { status: 404 });
  } catch (err: any) {
    console.error('Template media streaming error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
