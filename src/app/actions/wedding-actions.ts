'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAccess } from '@/lib/admin-auth';
import { createGuestAccessToken } from '@/lib/guest-access-token';
import { renderTemplateVariables, generateTrackingToken } from '@/lib/communications';
import { sendEmail } from '@/lib/email';
import { sendTwilioSms } from '@/lib/twilio';
import {
  EventRecord,
  GuestRecord,
  CommunicationCampaignRecord,
  CommunicationTemplateRecord,
  PlanningTaskRecord,
} from '@/lib/types';

const PHOTO_BUCKET = 'wedding-photos';
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function toFormData(input: FormData | Record<string, any>): FormData {
  if (input instanceof FormData) return input;
  const fd = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File || value instanceof Blob) {
      fd.append(key, value);
    } else if (typeof value === 'object') {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}

// ============================================================================
// 1. GUEST RSVP SUBMISSION (HOUSEHOLD PARTY, SUB-EVENTS & CUSTOM QUESTIONS)
// ============================================================================
export async function submitRsvpAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const token = formData.get('token') as string;
    const payloadJson = formData.get('payload') as string;

    if (!token || !payloadJson) {
      return { error: 'Missing RSVP submission payload.' };
    }

    const payload = JSON.parse(payloadJson);
    const {
      guests = [],
      subEvents = {},
      customAnswers = {},
    } = payload;

    // 1. Fetch Primary Guest & Event
    const { data: primaryGuest, error: guestErr } = await supabaseAdmin
      .from('guests')
      .select('*, events(*)')
      .eq('access_token', token)
      .single();

    if (guestErr || !primaryGuest) {
      return { error: 'Guest invitation not found or token expired.' };
    }

    const event = primaryGuest.events as EventRecord;
    const isPastDeadline = new Date() > new Date(event.rsvp_deadline);
    if (isPastDeadline && event.allow_late_rsvp === false) {
      return { error: 'The RSVP deadline for this event has passed. Please contact the couple directly.' };
    }

    // 2. Update Guests in Party
    for (const g of guests) {
      if (!g.id) continue;
      await supabaseAdmin
        .from('guests')
        .update({
          rsvp_status: g.rsvp_status || 'pending',
          meal_choice: g.meal_choice || null,
          dietary_notes: g.dietary_notes || null,
          dietary_tags: g.dietary_tags || [],
          plus_one_name: g.plus_one_name || null,
          plus_one_meal: g.plus_one_meal || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', g.id);
    }

    // 3. Upsert Sub-Event RSVPs
    for (const [guestId, eventMap] of Object.entries(subEvents as Record<string, Record<string, string>>)) {
      for (const [scheduleItemId, status] of Object.entries(eventMap)) {
        await supabaseAdmin
          .from('guest_schedule_rsvps')
          .upsert(
            {
              guest_id: guestId,
              schedule_item_id: scheduleItemId,
              status: status as any,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'guest_id,schedule_item_id' }
          );
      }
    }

    // 4. Upsert Custom Question Responses
    for (const [questionId, value] of Object.entries(customAnswers)) {
      await supabaseAdmin
        .from('custom_rsvp_responses')
        .upsert(
          {
            question_id: questionId,
            guest_id: primaryGuest.id,
            response_value: value,
            response_text: typeof value === 'string' ? value : JSON.stringify(value),
          },
          { onConflict: 'guest_id,question_id' }
        );
    }

    revalidatePath(`/g/${token}`);
    revalidatePath(`/admin/${event.admin_token}`);
    return { success: true };
  } catch (err: any) {
    console.error('submitRsvpAction error:', err);
    return { error: err.message || 'Failed to submit RSVP.' };
  }
}

// ============================================================================
// 2. PHOTO UPLOAD & MODERATION (SUPABASE STORAGE BUCKET PIPELINE)
// ============================================================================
export async function uploadPhotoAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const token = formData.get('token') as string;
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || '';

    if (!token || !file) {
      return { error: 'No photo provided or missing token.' };
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type.toLowerCase())) {
      return { error: 'Please upload a JPG, PNG, or WebP image.' };
    }

    if (file.size > MAX_PHOTO_UPLOAD_SIZE_BYTES) {
      return { error: 'Photo exceeds the 10MB limit.' };
    }

    // Lookup Guest & Event
    const { data: guest } = await supabaseAdmin
      .from('guests')
      .select('id, event_id, first_name, last_name')
      .eq('access_token', token)
      .single();

    if (!guest) {
      return { error: 'Invalid guest token.' };
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `${guest.event_id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload binary buffer to Supabase Storage
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      // Fallback: If bucket policy or local env restricts, generate base64 data URL
      const base64Url = `data:${file.type};base64,${buffer.toString('base64')}`;
      const { data: fallbackPhoto, error: fallbackErr } = await supabaseAdmin
        .from('photos')
        .insert({
          event_id: guest.event_id,
          guest_id: guest.id,
          image_url: base64Url,
          caption: caption || `Shared by ${guest.first_name}`,
          is_approved: true,
        })
        .select()
        .single();

      if (fallbackErr) throw fallbackErr;
      revalidatePath(`/g/${token}`);
      return { success: true, photo: fallbackPhoto };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(storagePath);

    const { data: photoRecord, error: photoDbErr } = await supabaseAdmin
      .from('photos')
      .insert({
        event_id: guest.event_id,
        guest_id: guest.id,
        image_url: publicUrlData.publicUrl,
        storage_path: storagePath,
        caption: caption || `Shared by ${guest.first_name}`,
        is_approved: true,
      })
      .select()
      .single();

    if (photoDbErr) throw photoDbErr;

    revalidatePath(`/g/${token}`);
    return { success: true, photo: photoRecord };
  } catch (err: any) {
    console.error('uploadPhotoAction error:', err);
    return { error: err.message || 'Failed to upload photo.' };
  }
}

export async function deletePhotoAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const photoId = formData.get('photoId') as string;
    const adminToken = formData.get('adminToken') as string;
    const eventId = formData.get('eventId') as string;

    requireAdminAccess(eventId, adminToken);

    const { data: photo } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photo?.storage_path) {
      await supabaseAdmin.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
    }

    await supabaseAdmin.from('photos').delete().eq('id', photoId);

    revalidatePath(`/admin/${adminToken}`);
    return { success: true };
  } catch (err: any) {
    console.error('deletePhotoAction error:', err);
    return { error: err.message || 'Failed to delete photo.' };
  }
}

// ============================================================================
// 3. COMMUNICATIONS ENGINE (SMS, EMAIL, OPEN/CLICK TRACKING & CAMPAIGNS)
// ============================================================================
export async function sendCommunicationAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const templateId = formData.get('templateId') as string;
    const audience = (formData.get('audience') as string) || 'all';
    const channel = (formData.get('channel') as 'sms' | 'email' | 'both') || 'both';
    const scheduledFor = (formData.get('scheduledFor') as string) || null;
    const customSubject = formData.get('subject') as string;
    const customEmailBody = formData.get('emailBody') as string;
    const customSmsBody = formData.get('smsBody') as string;

    requireAdminAccess(eventId, adminToken);

    const { data: event } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) return { error: 'Event not found.' };

    let template: CommunicationTemplateRecord | null = null;
    if (templateId) {
      const { data: tpl } = await supabaseAdmin
        .from('communication_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      template = tpl as CommunicationTemplateRecord;
    }

    const customName = formData.get('name') as string;
    const campaignName = customName || (template ? template.name : `${audience.toUpperCase()} Broadcast`);
    const lifecycleType = (formData.get('lifecycleType') as string) || (template ? template.lifecycle_type : 'invitation');

    const dispatchMode = (formData.get('dispatchMode') as 'send_now' | 'schedule' | 'draft') || (scheduledFor ? 'schedule' : 'send_now');

    // 1. Fetch Target Guests
    let guestQuery = supabaseAdmin.from('guests').select('*').eq('event_id', eventId);
    if (audience === 'pending') guestQuery = guestQuery.eq('rsvp_status', 'pending');
    else if (audience === 'attending') guestQuery = guestQuery.eq('rsvp_status', 'attending');
    else if (audience === 'declined') guestQuery = guestQuery.eq('rsvp_status', 'declined');
    else if (audience === 'vip') guestQuery = guestQuery.eq('is_vip', true);

    const { data: targetGuests, error: guestErr } = await guestQuery;
    if (guestErr || !targetGuests) return { error: 'Failed to query guests.' };

    // 2. Create Campaign Record
    const initialStatus = dispatchMode === 'draft' ? 'draft' : dispatchMode === 'schedule' ? 'scheduled' : 'sending';
    const finalScheduledFor = dispatchMode === 'schedule' && scheduledFor ? scheduledFor : null;

    const { data: campaign, error: campErr } = await supabaseAdmin
      .from('communication_campaigns')
      .insert({
        event_id: eventId,
        template_id: template?.id || null,
        name: campaignName,
        lifecycle_type: lifecycleType,
        target_audience: audience as any,
        channel: channel,
        subject: customSubject || template?.subject || `Wedding Update: ${event.couple_names}`,
        body: customEmailBody || template?.email_body || '',
        sms_body: customSmsBody || template?.sms_body || '',
        scheduled_for: finalScheduledFor,
        status: initialStatus,
        total_recipients: targetGuests.length,
      })
      .select()
      .single();

    if (campErr || !campaign) throw campErr;

    if (dispatchMode === 'draft') {
      revalidatePath(`/admin/${adminToken}`);
      return { success: true, isDraft: true, campaign, totalRecipients: targetGuests.length };
    }

    if (dispatchMode === 'schedule') {
      revalidatePath(`/admin/${adminToken}`);
      return { success: true, scheduled: true, campaign, totalRecipients: targetGuests.length };
    }

    // 3. Deliver Immediately
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aisleflow.local';
    let sentCount = 0;
    let failedCount = 0;

    for (const guest of targetGuests as GuestRecord[]) {
      const trackingToken = generateTrackingToken();
      const subject = renderTemplateVariables(campaign.subject || '', event, guest, baseUrl, trackingToken);
      const emailBody = renderTemplateVariables(campaign.body || '', event, guest, baseUrl, trackingToken);
      const smsBody = renderTemplateVariables(campaign.sms_body || '', event, guest, baseUrl, trackingToken);

      // Deliver via Email if applicable
      if ((channel === 'email' || channel === 'both') && guest.email) {
        const trackingPixel = `<img src="${baseUrl}/api/track/${trackingToken}/open.gif" width="1" height="1" style="display:none" alt="" />`;
        const emailHtml = emailBody.replace(/\n/g, '<br />') + trackingPixel;
        const emailResult = await sendEmail({
          to: guest.email,
          subject,
          text: emailBody,
          html: emailHtml,
        });

        await supabaseAdmin.from('communication_messages').insert({
          campaign_id: campaign.id,
          event_id: eventId,
          guest_id: guest.id,
          channel: 'email',
          recipient_address: guest.email,
          rendered_subject: subject,
          rendered_body: emailBody,
          tracking_token: trackingToken,
          provider_message_id: emailResult.providerMessageId,
          status: emailResult.status === 'sent' ? 'sent' : 'dry_run',
        });

        if (emailResult.status === 'sent' || emailResult.status === 'dry_run') sentCount++;
        else failedCount++;
      }

      // Deliver via SMS if applicable
      if ((channel === 'sms' || channel === 'both') && guest.phone) {
        const smsResult = await sendTwilioSms(guest.phone, smsBody);
        await supabaseAdmin.from('communication_messages').insert({
          campaign_id: campaign.id,
          event_id: eventId,
          guest_id: guest.id,
          channel: 'sms',
          recipient_address: guest.phone,
          rendered_body: smsBody,
          tracking_token: trackingToken,
          provider_message_id: smsResult.sid,
          status: smsResult.status === 'sent' ? 'sent' : 'dry_run',
        });

        if (smsResult.status === 'sent' || smsResult.status === 'dry_run') sentCount++;
        else failedCount++;
      }
    }

    await supabaseAdmin
      .from('communication_campaigns')
      .update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaign.id);

    revalidatePath(`/admin/${adminToken}`);
    return { success: true, sentCount, failedCount, campaign };
  } catch (err: any) {
    console.error('sendCommunicationAction error:', err);
    return { error: err.message || 'Failed to send communications.' };
  }
}

// Dispatch an existing Draft or Scheduled Campaign immediately
export async function dispatchExistingCampaignAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const campaignId = formData.get('campaignId') as string;

    await requireAdminAccess(eventId, adminToken);

    const { data: campaign, error: cErr } = await supabaseAdmin
      .from('communication_campaigns')
      .select('*, events(*)')
      .eq('id', campaignId)
      .eq('event_id', eventId)
      .single();

    if (cErr || !campaign) return { error: 'Campaign not found.' };

    const event = campaign.events as EventRecord;
    const audience = campaign.target_audience;
    const channel = campaign.channel;

    let guestQuery = supabaseAdmin.from('guests').select('*').eq('event_id', eventId);
    if (audience === 'pending') guestQuery = guestQuery.eq('rsvp_status', 'pending');
    else if (audience === 'attending') guestQuery = guestQuery.eq('rsvp_status', 'attending');
    else if (audience === 'declined') guestQuery = guestQuery.eq('rsvp_status', 'declined');
    else if (audience === 'vip') guestQuery = guestQuery.eq('is_vip', true);

    const { data: targetGuests, error: gErr } = await guestQuery;
    if (gErr || !targetGuests) return { error: 'Failed to query recipients.' };

    await supabaseAdmin
      .from('communication_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aisleflow.local';
    let sentCount = 0;
    let failedCount = 0;

    for (const guest of targetGuests as GuestRecord[]) {
      const trackingToken = generateTrackingToken();
      const subject = renderTemplateVariables(campaign.subject || '', event, guest, baseUrl, trackingToken);
      const emailBody = renderTemplateVariables(campaign.body || '', event, guest, baseUrl, trackingToken);
      const smsBody = renderTemplateVariables(campaign.sms_body || '', event, guest, baseUrl, trackingToken);

      if ((channel === 'email' || channel === 'both') && guest.email) {
        const trackingPixel = `<img src="${baseUrl}/api/track/${trackingToken}/open.gif" width="1" height="1" style="display:none" alt="" />`;
        const emailHtml = emailBody.replace(/\n/g, '<br />') + trackingPixel;
        const emailResult = await sendEmail({
          to: guest.email,
          subject,
          text: emailBody,
          html: emailHtml,
        });

        await supabaseAdmin.from('communication_messages').insert({
          campaign_id: campaign.id,
          event_id: eventId,
          guest_id: guest.id,
          channel: 'email',
          recipient_address: guest.email,
          rendered_subject: subject,
          rendered_body: emailBody,
          tracking_token: trackingToken,
          provider_message_id: emailResult.providerMessageId,
          status: emailResult.status === 'sent' ? 'sent' : 'dry_run',
        });

        if (emailResult.status === 'sent' || emailResult.status === 'dry_run') sentCount++;
        else failedCount++;
      }

      if ((channel === 'sms' || channel === 'both') && guest.phone) {
        const smsResult = await sendTwilioSms(guest.phone, smsBody);
        await supabaseAdmin.from('communication_messages').insert({
          campaign_id: campaign.id,
          event_id: eventId,
          guest_id: guest.id,
          channel: 'sms',
          recipient_address: guest.phone,
          rendered_body: smsBody,
          tracking_token: trackingToken,
          provider_message_id: smsResult.sid,
          status: smsResult.status === 'sent' ? 'sent' : 'dry_run',
        });

        if (smsResult.status === 'sent' || smsResult.status === 'dry_run') sentCount++;
        else failedCount++;
      }
    }

    const { data: updatedCampaign } = await supabaseAdmin
      .from('communication_campaigns')
      .update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .select()
      .single();

    revalidatePath(`/admin/${adminToken}`);
    return { success: true, sentCount, failedCount, campaign: updatedCampaign };
  } catch (err: any) {
    console.error('dispatchExistingCampaignAction error:', err);
    return { error: err.message || 'Failed to dispatch campaign.' };
  }
}

// Delete Campaign Action
export async function deleteCampaignAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const campaignId = formData.get('campaignId') as string;

    await requireAdminAccess(eventId, adminToken);

    await supabaseAdmin.from('communication_campaigns').delete().eq('id', campaignId).eq('event_id', eventId);
    revalidatePath(`/admin/${adminToken}`);
    return { success: true };
  } catch (err: any) {
    console.error('deleteCampaignAction error:', err);
    return { error: err.message || 'Failed to delete campaign.' };
  }
}

// 1-Click Broadcast Reminder to Pending Guests
export async function broadcastSmsAction(input: FormData | Record<string, any>) {
  const formData = toFormData(input);
  const eventId = formData.get('eventId') as string;
  const adminToken = formData.get('adminToken') as string;
  const messageText = formData.get('message') as string;

  requireAdminAccess(eventId, adminToken);

  const fd = new FormData();
  fd.append('eventId', eventId);
  fd.append('adminToken', adminToken);
  fd.append('audience', 'pending');
  fd.append('channel', 'sms');
  fd.append('smsBody', messageText || 'Friendly reminder to RSVP for our wedding! {link}');
  return sendCommunicationAction(fd);
}

// Process Scheduled Campaigns (Called by cron route /api/communications/campaigns/due)
export async function processDueCommunicationCampaigns() {
  try {
    const now = new Date().toISOString();
    const { data: dueCampaigns } = await supabaseAdmin
      .from('communication_campaigns')
      .select('*, events(*)')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (!dueCampaigns || dueCampaigns.length === 0) {
      return { processed: 0 };
    }

    for (const camp of dueCampaigns) {
      const fd = new FormData();
      fd.append('eventId', camp.event_id);
      fd.append('adminToken', (camp.events as EventRecord).admin_token);
      fd.append('templateId', camp.template_id || '');
      fd.append('audience', camp.target_audience);
      fd.append('channel', camp.channel);
      fd.append('subject', camp.subject || '');
      fd.append('emailBody', camp.body || '');
      fd.append('smsBody', camp.sms_body || '');
      await sendCommunicationAction(fd);
    }

    return { processed: dueCampaigns.length };
  } catch (err: any) {
    console.error('processDueCommunicationCampaigns error:', err);
    return { error: err.message };
  }
}

// ============================================================================
// 4. GUEST REGISTRY & CSV IMPORT / EXPORT OPERATIONS
// ============================================================================
export async function importGuestsCsvAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const csvContent = formData.get('csvContent') as string;

    requireAdminAccess(eventId, adminToken);

    if (!csvContent || !csvContent.trim()) {
      return { error: 'CSV data is empty.' };
    }

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { error: 'CSV must contain a header row and at least one guest row.' };
    }

    // Parse Header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const rowsToInsert: any[] = [];
    const partyMap: Record<string, string> = {};

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });

      const firstName = rowObj['first_name'] || rowObj['firstname'] || rowObj['name']?.split(' ')[0] || 'Guest';
      const lastName = rowObj['last_name'] || rowObj['lastname'] || rowObj['name']?.split(' ').slice(1).join(' ') || '';
      const email = rowObj['email'] || null;
      const phone = rowObj['phone'] || rowObj['mobile'] || null;
      const isVip = ['yes', 'true', '1', 'vip'].includes((rowObj['vip'] || rowObj['is_vip'] || '').toLowerCase());
      const partyName = rowObj['party'] || rowObj['party_name'] || rowObj['household'] || null;
      const address = rowObj['address'] || rowObj['mailing_address'] || null;
      const connection = rowObj['connection'] || rowObj['relationship'] || null;
      const tagsStr = rowObj['tags'] || '';
      const tags = tagsStr.split(';').map((t) => t.trim()).filter(Boolean);

      let partyId: string | null = null;
      if (partyName) {
        if (!partyMap[partyName]) {
          partyMap[partyName] = 'p_' + Math.random().toString(36).substring(2, 10);
        }
        partyId = partyMap[partyName];
      }

      rowsToInsert.push({
        event_id: eventId,
        access_token: createGuestAccessToken(),
        first_name: firstName,
        last_name: lastName || null,
        email,
        phone,
        is_vip: isVip,
        party_name: partyName,
        party_id: partyId,
        mailing_address: address,
        connection_to_couple: connection,
        tags,
        rsvp_status: 'pending',
      });
    }

    if (rowsToInsert.length === 0) {
      return { error: 'No valid guest rows detected.' };
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('guests')
      .insert(rowsToInsert)
      .select();

    if (insertErr) throw insertErr;

    revalidatePath(`/admin/${adminToken}`);
    return { success: true, count: inserted?.length || 0, insertedCount: inserted?.length || 0 };
  } catch (err: any) {
    console.error('importGuestsCsvAction error:', err);
    return { error: err.message || 'Failed to import CSV.' };
  }
}

export async function addGuestAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const firstName = formData.get('first_name') as string;
    const lastName = (formData.get('last_name') as string) || null;
    const email = (formData.get('email') as string) || null;
    const phone = (formData.get('phone') as string) || null;
    const isVip = formData.get('is_vip') === 'true';
    const plusOneAllowed = formData.get('plus_one_allowed') === 'true';
    const partyName = (formData.get('party_name') as string) || null;
    const hasPartner = formData.get('has_partner') === 'true';
    const partnerName = (formData.get('partner_name') as string) || '';

    requireAdminAccess(eventId, adminToken);

    const partyId = partyName || hasPartner ? 'p_' + Math.random().toString(36).substring(2, 10) : null;
    const resolvedPartyName = partyName || (hasPartner ? `${firstName} & ${partnerName} Household` : null);

    const primaryToken = createGuestAccessToken();
    const { data: primaryGuest, error: primErr } = await supabaseAdmin
      .from('guests')
      .insert({
        event_id: eventId,
        access_token: primaryToken,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        is_vip: isVip,
        plus_one_allowed: plusOneAllowed,
        party_name: resolvedPartyName,
        party_id: partyId,
        rsvp_status: 'pending',
      })
      .select()
      .single();

    if (primErr) throw primErr;

    // Create Partner Guest if requested
    if (hasPartner && partnerName.trim()) {
      const [partnerFirst, ...partnerLast] = partnerName.trim().split(' ');
      await supabaseAdmin.from('guests').insert({
        event_id: eventId,
        access_token: createGuestAccessToken(),
        first_name: partnerFirst,
        last_name: partnerLast.join(' ') || lastName,
        is_vip: isVip,
        party_name: resolvedPartyName,
        party_id: partyId,
        rsvp_status: 'pending',
      });
    }

    revalidatePath(`/admin/${adminToken}`);
    return { success: true, guest: primaryGuest, data: primaryGuest };
  } catch (err: any) {
    console.error('addGuestAction error:', err);
    return { error: err.message || 'Failed to add guest.' };
  }
}

export async function updateGuestAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const guestId = formData.get('guestId') as string;
    const adminToken = formData.get('adminToken') as string;
    const eventId = formData.get('eventId') as string;

    requireAdminAccess(eventId, adminToken);

    const updates: Record<string, any> = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name') || null,
      email: formData.get('email') || null,
      phone: formData.get('phone') || null,
      is_vip: formData.get('is_vip') === 'true',
      plus_one_allowed: formData.get('plus_one_allowed') === 'true',
      rsvp_status: formData.get('rsvp_status') || 'pending',
      party_name: formData.get('party_name') || null,
      meal_choice: formData.get('meal_choice') || null,
      dietary_notes: formData.get('dietary_notes') || null,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabaseAdmin
      .from('guests')
      .update(updates)
      .eq('id', guestId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath(`/admin/${adminToken}`);
    return { success: true, guest: updated, data: updated };
  } catch (err: any) {
    console.error('updateGuestAction error:', err);
    return { error: err.message || 'Failed to update guest.' };
  }
}

export async function deleteGuestAction(
  input: FormData | Record<string, any> | string,
  eventIdParam?: string,
  adminTokenParam?: string
) {
  try {
    let guestId: string;
    let adminToken: string;
    let eventId: string;

    if (typeof input === 'string') {
      guestId = input;
      eventId = eventIdParam || '';
      adminToken = adminTokenParam || '';
    } else {
      const formData = toFormData(input);
      guestId = formData.get('guestId') as string;
      adminToken = formData.get('adminToken') as string;
      eventId = formData.get('eventId') as string;
    }

    if (eventId && adminToken) {
      requireAdminAccess(eventId, adminToken);
    }

    await supabaseAdmin.from('guests').delete().eq('id', guestId);

    if (adminToken) {
      revalidatePath(`/admin/${adminToken}`);
    }
    return { success: true };
  } catch (err: any) {
    console.error('deleteGuestAction error:', err);
    return { error: err.message || 'Failed to delete guest.' };
  }
}

export async function rotateGuestAccessTokenAction(
  input: FormData | Record<string, any> | string,
  eventIdParam?: string,
  adminTokenParam?: string
) {
  try {
    let guestId: string;
    let adminToken: string;
    let eventId: string;

    if (typeof input === 'string') {
      guestId = input;
      eventId = eventIdParam || '';
      adminToken = adminTokenParam || '';
    } else {
      const formData = toFormData(input);
      guestId = formData.get('guestId') as string;
      adminToken = formData.get('adminToken') as string;
      eventId = formData.get('eventId') as string;
    }

    if (eventId && adminToken) {
      requireAdminAccess(eventId, adminToken);
    }

    const newToken = createGuestAccessToken();
    const { data: updated, error } = await supabaseAdmin
      .from('guests')
      .update({ access_token: newToken, updated_at: new Date().toISOString() })
      .eq('id', guestId)
      .select()
      .single();

    if (error) throw error;

    if (adminToken) {
      revalidatePath(`/admin/${adminToken}`);
    }
    return { success: true, newToken: updated.access_token, data: updated.access_token };
  } catch (err: any) {
    console.error('rotateGuestAccessTokenAction error:', err);
    return { error: err.message || 'Failed to rotate token.' };
  }
}

export async function managePartyAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const guestIdsJson = formData.get('guestIds') as string;
    const action = (formData.get('partyAction') as string) || 'group';
    const partyName = (formData.get('partyName') as string) || 'Party Group';
    const existingPartyId = formData.get('partyId') as string | null;

    requireAdminAccess(eventId, adminToken);
    const guestIds: string[] = typeof guestIdsJson === 'string' ? JSON.parse(guestIdsJson || '[]') : (guestIdsJson || []);

    if (action === 'group') {
      if (!guestIds || guestIds.length === 0) return { error: 'No guests selected.' };
      const partyId = existingPartyId || ('p_' + Math.random().toString(36).substring(2, 10));
      await supabaseAdmin
        .from('guests')
        .update({ party_id: partyId, party_name: partyName, household_id: partyId })
        .in('id', guestIds);
    } else if (action === 'add_members') {
      if (!existingPartyId) return { error: 'Party ID is required.' };
      if (!guestIds || guestIds.length === 0) return { error: 'No guests selected to add.' };
      await supabaseAdmin
        .from('guests')
        .update({ party_id: existingPartyId, party_name: partyName, household_id: existingPartyId })
        .in('id', guestIds);
    } else if (action === 'rename') {
      if (!existingPartyId) return { error: 'Party ID is required.' };
      await supabaseAdmin
        .from('guests')
        .update({ party_name: partyName })
        .or(`party_id.eq.${existingPartyId},household_id.eq.${existingPartyId}`);
    } else if (action === 'unlink') {
      if (!guestIds || guestIds.length === 0) return { error: 'No guests specified to unlink.' };
      await supabaseAdmin
        .from('guests')
        .update({ party_id: null, party_name: null, household_id: null })
        .in('id', guestIds);
    } else if (action === 'dissolve') {
      if (!existingPartyId) return { error: 'Party ID is required to dissolve.' };
      await supabaseAdmin
        .from('guests')
        .update({ party_id: null, party_name: null, household_id: null })
        .or(`party_id.eq.${existingPartyId},household_id.eq.${existingPartyId}`);
    }

    revalidatePath(`/admin/${adminToken}`);
    revalidatePath('/g/[token]', 'page');
    return { success: true };
  } catch (err: any) {
    console.error('managePartyAction error:', err);
    return { error: err.message || 'Failed to manage party.' };
  }
}

// ============================================================================
// 5. REGISTRY, CASH FUNDS & CONTRIBUTIONS
// ============================================================================
export async function manageRegistryItemAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const itemId = formData.get('itemId') as string;
    const action = formData.get('action') as 'save' | 'delete';

    requireAdminAccess(eventId, adminToken);

    if (action === 'delete') {
      await supabaseAdmin.from('registry_items').delete().eq('id', itemId);
      revalidatePath(`/admin/${adminToken}`);
      return { success: true };
    }

    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const externalUrl = (formData.get('external_url') as string) || null;
    const isCashFund = formData.get('is_cash_fund') === 'true';
    const targetAmount = parseFloat(formData.get('target_amount') as string) || null;

    if (itemId) {
      await supabaseAdmin
        .from('registry_items')
        .update({ title, description, external_url: externalUrl, is_cash_fund: isCashFund, target_amount: targetAmount })
        .eq('id', itemId);
    } else {
      await supabaseAdmin
        .from('registry_items')
        .insert({ event_id: eventId, title, description, external_url: externalUrl, is_cash_fund: isCashFund, target_amount: targetAmount, current_amount: 0 });
    }

    revalidatePath(`/admin/${adminToken}`);
    return { success: true };
  } catch (err: any) {
    console.error('manageRegistryItemAction error:', err);
    return { error: err.message || 'Failed to manage registry item.' };
  }
}

export async function manageScheduleItemAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const action = formData.get('action') as string;
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const itemId = formData.get('itemId') as string;

    await requireAdminAccess(eventId, adminToken);

    if (action === 'delete') {
      if (!itemId) return { error: 'Item ID is required for deletion.' };
      await supabaseAdmin.from('schedule_items').delete().eq('id', itemId).eq('event_id', eventId);
      revalidatePath(`/admin/${adminToken}`);
      return { success: true };
    }

    const title = (formData.get('title') as string) || '';
    const locationName = (formData.get('location_name') as string) || '';
    const startTime = (formData.get('start_time') as string) || '';
    const endTime = (formData.get('end_time') as string) || null;
    const description = (formData.get('description') as string) || '';
    const dressCode = (formData.get('dress_code') as string) || '';
    const isVipOnly = formData.get('is_vip_only') === 'true' || formData.get('is_vip_only') === '1' || formData.get('is_vip_only') === 'on';
    const requiresRsvp = formData.get('requires_rsvp') === 'true' || formData.get('requires_rsvp') === '1' || formData.get('requires_rsvp') === 'on';
    const displayOrder = parseInt(formData.get('display_order') as string, 10) || 0;

    if (!title || !startTime) {
      return { error: 'Title and start time are required.' };
    }

    let itemData: any = null;

    if (itemId) {
      const { data, error } = await supabaseAdmin
        .from('schedule_items')
        .update({
          title,
          location_name: locationName,
          start_time: startTime,
          end_time: endTime || null,
          description,
          dress_code: dressCode,
          is_vip_only: isVipOnly,
          requires_rsvp: requiresRsvp,
          display_order: displayOrder,
        })
        .eq('id', itemId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) throw error;
      itemData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('schedule_items')
        .insert({
          event_id: eventId,
          title,
          location_name: locationName,
          start_time: startTime,
          end_time: endTime || null,
          description,
          dress_code: dressCode,
          is_vip_only: isVipOnly,
          requires_rsvp: requiresRsvp,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;
      itemData = data;
    }

    revalidatePath(`/admin/${adminToken}`);
    return { success: true, item: itemData };
  } catch (err: any) {
    console.error('manageScheduleItemAction error:', err);
    return { error: err.message || 'Failed to manage schedule item.' };
  }
}

export async function contributeToRegistryAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const token = formData.get('token') as string;
    const registryItemId = formData.get('registryItemId') as string;
    const contributorName = formData.get('contributorName') as string;
    const amount = parseFloat(formData.get('amount') as string) || 0;
    const message = (formData.get('message') as string) || '';

    if (!registryItemId || amount <= 0) {
      return { error: 'Please specify a valid contribution amount.' };
    }

    // Lookup guest if token available
    let guestId: string | null = null;
    if (token) {
      const { data: guest } = await supabaseAdmin.from('guests').select('id').eq('access_token', token).single();
      if (guest) guestId = guest.id;
    }

    // Insert Contribution
    await supabaseAdmin.from('registry_contributions').insert({
      registry_item_id: registryItemId,
      guest_id: guestId,
      contributor_name: contributorName || 'Anonymous Friend',
      amount,
      message,
    });

    // Increment Item Current Amount
    const { data: item } = await supabaseAdmin
      .from('registry_items')
      .select('current_amount')
      .eq('id', registryItemId)
      .single();

    const newAmount = (Number(item?.current_amount) || 0) + amount;
    await supabaseAdmin
      .from('registry_items')
      .update({ current_amount: newAmount })
      .eq('id', registryItemId);

    if (token) revalidatePath(`/g/${token}`);
    return { success: true, newAmount };
  } catch (err: any) {
    console.error('contributeToRegistryAction error:', err);
    return { error: err.message || 'Failed to record contribution.' };
  }
}

// ============================================================================
// 6. CUSTOM QUESTIONS CRUD
// ============================================================================
export async function manageCustomQuestionAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const questionId = formData.get('questionId') as string;
    const action = formData.get('action') as 'save' | 'delete';

    requireAdminAccess(eventId, adminToken);

    if (action === 'delete') {
      await supabaseAdmin.from('custom_rsvp_questions').delete().eq('id', questionId);
      revalidatePath(`/admin/${adminToken}`);
      return { success: true };
    }

    const prompt = formData.get('prompt') as string;
    const questionType = formData.get('question_type') as 'text' | 'single_choice' | 'multiple_choice';
    const optionsStr = (formData.get('options') as string) || '';
    const options = optionsStr.split(',').map((o) => o.trim()).filter(Boolean);
    const isRequired = formData.get('is_required') === 'true';

    if (questionId) {
      await supabaseAdmin
        .from('custom_rsvp_questions')
        .update({ prompt, question_type: questionType, options, is_required: isRequired })
        .eq('id', questionId);
    } else {
      await supabaseAdmin
        .from('custom_rsvp_questions')
        .insert({ event_id: eventId, prompt, question_type: questionType, options, is_required: isRequired });
    }

    revalidatePath(`/admin/${adminToken}`);
    return { success: true };
  } catch (err: any) {
    console.error('manageCustomQuestionAction error:', err);
    return { error: err.message || 'Failed to manage question.' };
  }
}

export async function managePlanningTaskAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const action = formData.get('action') as string;
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const taskId = formData.get('taskId') as string;

    await requireAdminAccess(eventId, adminToken);

    if (action === 'delete') {
      if (!taskId) return { error: 'Task ID is required for deletion.' };
      await supabaseAdmin.from('planning_tasks').delete().eq('id', taskId).eq('event_id', eventId);
      revalidatePath(`/admin/${adminToken}`);
      return { success: true };
    }

    if (action === 'toggle_status') {
      const newStatus = formData.get('status') as string;
      const { data, error } = await supabaseAdmin
        .from('planning_tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) throw error;
      revalidatePath(`/admin/${adminToken}`);
      return { success: true, task: data };
    }

    const title = (formData.get('title') as string) || '';
    const category = (formData.get('category') as string) || 'General';
    const owner = (formData.get('owner') as string) || 'Couple';
    const dueDate = (formData.get('due_date') as string) || null;
    const status = (formData.get('status') as string) || 'todo';
    const priority = (formData.get('priority') as string) || 'medium';
    const displayOrder = parseInt(formData.get('display_order') as string, 10) || 0;

    if (!title) {
      return { error: 'Task title is required.' };
    }

    let taskData: any = null;

    if (taskId) {
      const { data, error } = await supabaseAdmin
        .from('planning_tasks')
        .update({
          title,
          category,
          owner,
          due_date: dueDate || null,
          status,
          priority,
          display_order: displayOrder,
        })
        .eq('id', taskId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) throw error;
      taskData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('planning_tasks')
        .insert({
          event_id: eventId,
          title,
          category,
          owner,
          due_date: dueDate || null,
          status,
          priority,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;
      taskData = data;
    }

    revalidatePath(`/admin/${adminToken}`);
    return { success: true, task: taskData };
  } catch (err: any) {
    console.error('managePlanningTaskAction error:', err);
    return { error: err.message || 'Failed to manage planning task.' };
  }
}

// ============================================================================
// 7. EVENT SETUP & STRUCTURED CUSTOM SECTIONS (CMS)
// ============================================================================
export async function updateEventSetupAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;

    requireAdminAccess(eventId, adminToken);

    const updates = {
      couple_names: formData.get('couple_names') as string,
      wedding_date: formData.get('wedding_date') as string,
      rsvp_deadline: formData.get('rsvp_deadline') as string,
      allow_late_rsvp: formData.get('allow_late_rsvp') === 'true',
      venue_name: formData.get('venue_name') as string,
      venue_address: formData.get('venue_address') as string,
      admin_email: formData.get('admin_email') as string,
      is_ready_for_testing: formData.get('is_ready_for_testing') === 'true',
      launch_notes: (formData.get('launch_notes') as string) || null,
      updated_at: new Date().toISOString(),
    };

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/admin/${adminToken}`);
    revalidatePath('/g/[token]', 'page');
    revalidatePath('/');
    return { success: true, event, data: event };
  } catch (err: any) {
    console.error('updateEventSetupAction error:', err);
    return { error: err.message || 'Failed to update setup.' };
  }
}

export async function updateEventCustomSectionsAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;

    requireAdminAccess(eventId, adminToken);

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.has('custom_sections')) {
      const sectionsJson = formData.get('custom_sections') as string;
      updatePayload.custom_sections = typeof sectionsJson === 'string' ? JSON.parse(sectionsJson) : sectionsJson;
    }
    if (formData.has('welcome_message')) {
      updatePayload.welcome_message = formData.get('welcome_message') as string;
    }
    if (formData.has('our_story')) {
      updatePayload.our_story = formData.get('our_story') as string;
    }
    if (formData.has('dress_code')) {
      updatePayload.dress_code = formData.get('dress_code') as string;
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/admin/${adminToken}`);
    revalidatePath('/g/[token]', 'page');
    revalidatePath('/');
    return { success: true, event, data: event };
  } catch (err: any) {
    console.error('updateEventCustomSectionsAction error:', err);
    return { error: err.message || 'Failed to update custom sections.' };
  }
}

export async function updateEventThemeAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const themeId = formData.get('theme_id') as string;
    const themeConfigJson = formData.get('theme_config') as string;

    requireAdminAccess(eventId, adminToken);
    const themeConfig = themeConfigJson ? (typeof themeConfigJson === 'string' ? JSON.parse(themeConfigJson) : themeConfigJson) : {};

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update({ theme_id: themeId, theme_config: themeConfig, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/admin/${adminToken}`);
    revalidatePath('/g/[token]', 'page');
    revalidatePath('/');
    return { success: true, event, data: event };
  } catch (err: any) {
    console.error('updateEventThemeAction error:', err);
    return { error: err.message || 'Failed to update theme.' };
  }
}

export async function updateEventDesignAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;

    requireAdminAccess(eventId, adminToken);

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.has('theme_id')) {
      updatePayload.theme_id = formData.get('theme_id') as string;
    }
    if (formData.has('theme_config')) {
      const themeConfigInput = formData.get('theme_config') as string;
      const parsedConfig = typeof themeConfigInput === 'string' ? JSON.parse(themeConfigInput) : themeConfigInput;

      // Fetch existing theme_config to merge gracefully
      const { data: existingEvent } = await supabaseAdmin
        .from('events')
        .select('theme_config')
        .eq('id', eventId)
        .maybeSingle();

      const existingConfig = (existingEvent?.theme_config && typeof existingEvent.theme_config === 'object') ? existingEvent.theme_config : {};
      updatePayload.theme_config = { ...existingConfig, ...parsedConfig };
    }
    if (formData.has('cover_image_url')) {
      updatePayload.cover_image_url = formData.get('cover_image_url') as string;
    }
    if (formData.has('story_image_url')) {
      updatePayload.story_image_url = formData.get('story_image_url') as string;
    }
    if (formData.has('venue_image_url')) {
      updatePayload.venue_image_url = formData.get('venue_image_url') as string;
    }
    if (formData.has('gallery_image_urls')) {
      const galleryJson = formData.get('gallery_image_urls') as string;
      updatePayload.gallery_image_urls = typeof galleryJson === 'string' ? JSON.parse(galleryJson) : galleryJson;
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/admin/${adminToken}`);
    revalidatePath('/g/[token]', 'page');
    revalidatePath('/');
    return { success: true, event, data: event };
  } catch (err: any) {
    console.error('updateEventDesignAction error:', err);
    return { error: err.message || 'Failed to update design.' };
  }
}

// Upload Website/Template Image (Cover, Story, Venue, Avatar, Template Asset)
export async function uploadWebsiteImageAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const category = (formData.get('category') as string) || 'website';
    const file = formData.get('file') as File | null;

    await requireAdminAccess(eventId, adminToken);

    if (!file) {
      return { error: 'No image file provided.' };
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type.toLowerCase())) {
      return { error: 'Please select a JPG, PNG, WebP, or SVG image.' };
    }

    if (file.size > MAX_PHOTO_UPLOAD_SIZE_BYTES) {
      return { error: 'Image file exceeds the 10MB limit.' };
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `website/${eventId}/${category}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try uploading to 'template-media' or fallback to 'wedding-photos'
    let bucket = 'template-media';
    let { error: uploadErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      bucket = 'wedding-photos';
      const retry = await supabaseAdmin.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });
      uploadErr = retry.error;
    }

    let publicUrl = '';
    if (uploadErr) {
      console.warn('Storage upload fallback to base64 data URL:', uploadErr.message);
      publicUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else {
      const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);
      publicUrl = publicUrlData.publicUrl;
    }

    // Save record to template_media_assets for future reuse
    try {
      await supabaseAdmin.from('template_media_assets').insert({
        title: `${category.toUpperCase()} - ${file.name}`,
        category: category.toLowerCase(),
        image_url: publicUrl,
        storage_path: storagePath,
        content_type: file.type,
        file_size: file.size,
      });
    } catch (ignoreErr) {
      // Ignore DB logging error if table not present
    }

    revalidatePath(`/admin/${adminToken}`);
    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error('uploadWebsiteImageAction error:', err);
    return { error: err.message || 'Failed to upload image.' };
  }
}

// ============================================================================
// 14. COMMUNICATION TEMPLATES MANAGEMENT
// ============================================================================
export async function updateCommunicationTemplateAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const templateId = formData.get('templateId') as string;
    const name = formData.get('name') as string;
    const subject = formData.get('subject') as string;
    const emailBody = formData.get('emailBody') as string;
    const smsBody = formData.get('smsBody') as string;
    const channel = (formData.get('channel') as string) || 'both';
    const lifecycleType = (formData.get('lifecycleType') as string) || 'invitation';

    requireAdminAccess(eventId, adminToken);

    if (templateId && templateId !== 'new') {
      const { data: updated, error } = await supabaseAdmin
        .from('communication_templates')
        .update({
          name,
          subject,
          email_body: emailBody,
          sms_body: smsBody,
          channel,
          lifecycle_type: lifecycleType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      revalidatePath(`/admin/${adminToken}`);
      return { success: true, template: updated };
    } else {
      const templateKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Math.random().toString(36).substring(2, 6);
      const { data: created, error } = await supabaseAdmin
        .from('communication_templates')
        .insert({
          event_id: eventId,
          template_key: templateKey,
          name,
          lifecycle_type: lifecycleType,
          channel,
          subject,
          email_body: emailBody,
          sms_body: smsBody,
        })
        .select()
        .single();

      if (error) throw error;
      revalidatePath(`/admin/${adminToken}`);
      return { success: true, template: created };
    }
  } catch (err: any) {
    console.error('updateCommunicationTemplateAction error:', err);
    return { error: err.message || 'Failed to update template.' };
  }
}

export async function deleteCommunicationTemplateAction(input: FormData | Record<string, any>) {
  try {
    const formData = toFormData(input);
    const eventId = formData.get('eventId') as string;
    const adminToken = formData.get('adminToken') as string;
    const templateId = formData.get('templateId') as string;

    requireAdminAccess(eventId, adminToken);

    const { error } = await supabaseAdmin
      .from('communication_templates')
      .delete()
      .eq('id', templateId)
      .eq('event_id', eventId);

    if (error) throw error;
    revalidatePath(`/admin/${adminToken}`);
    return { success: true };
  } catch (err: any) {
    console.error('deleteCommunicationTemplateAction error:', err);
    return { error: err.message || 'Failed to delete template.' };
  }
}
