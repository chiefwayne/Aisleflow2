import { NextResponse } from 'next/server';
// Server-only: row-level security blocks the public key, so read with the service role.
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    // Find message with this tracking token
    const { data: message } = await supabase
      .from('communication_messages')
      .select('*, guests(access_token)')
      .eq('tracking_token', token)
      .single();

    if (message) {
      // Record click event
      await supabase
        .from('communication_messages')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString(),
        })
        .eq('id', message.id);

      // Increment campaign clicked count
      if (message.campaign_id) {
        const { data: campaign } = await supabase
          .from('communication_campaigns')
          .select('clicked_count')
          .eq('id', message.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from('communication_campaigns')
            .update({ clicked_count: (campaign.clicked_count || 0) + 1 })
            .eq('id', message.campaign_id);
        }
      }

      const guestToken = (message as any).guests?.access_token;
      if (guestToken) {
        const baseUrl = new URL(request.url).origin;
        return NextResponse.redirect(`${baseUrl}/g/${guestToken}`);
      }
    }

    // Fallback redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  } catch (err) {
    console.error('Tracking redirect error:', err);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
