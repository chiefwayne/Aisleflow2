'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAccess } from '@/lib/admin-auth';
import { featureError, hasFeature } from '@/lib/plans';
import type { GuestbookEntryRecord, PhotoRecord } from '@/lib/types';

const PHOTO_BUCKET = 'wedding-photos';
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VOICE_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/x-m4a', 'audio/aac'];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_VOICE_BYTES = 5 * 1024 * 1024;

/** The album link is a separate random secret, so sharing it never exposes guest or admin links. */
async function eventForAlbum(albumToken: string) {
  if (!albumToken) return null;
  const { data } = await supabaseAdmin
    .from('events')
    .select('id, couple_names, plan, theme_config')
    .eq('album_token', albumToken)
    .maybeSingle();
  return data && hasFeature(data, 'memories') ? data : null;
}

const cleanName = (name: unknown) => (typeof name === 'string' ? name.trim().slice(0, 80) : '');

export async function getOrCreateAlbumTokenAction(
  eventId: string,
  adminToken: string
): Promise<{ albumToken: string } | { error: string }> {
  try {
    await requireAdminAccess(eventId, adminToken);
    const { data: event } = await supabaseAdmin.from('events').select('plan, album_token').eq('id', eventId).single();
    if (!event) return { error: 'Event not found.' };
    if (!hasFeature(event, 'memories')) return { error: featureError('memories') };
    if (event.album_token) return { albumToken: event.album_token };

    const albumToken = `al_${randomBytes(18).toString('base64url')}`;
    const { error } = await supabaseAdmin.from('events').update({ album_token: albumToken }).eq('id', eventId);
    if (error) throw error;
    return { albumToken };
  } catch (err: any) {
    console.error('getOrCreateAlbumTokenAction error:', err);
    return { error: 'Could not create the album link.' };
  }
}

export async function listAlbumAction(albumToken: string): Promise<
  { coupleNames: string; photos: PhotoRecord[]; entries: GuestbookEntryRecord[] } | { error: string }
> {
  const event = await eventForAlbum(albumToken);
  if (!event) return { error: 'This album is not available.' };
  const [{ data: photos }, { data: entries }] = await Promise.all([
    supabaseAdmin
      .from('photos')
      .select('id, image_url, caption, uploader_name, created_at, is_approved, event_id')
      .eq('event_id', event.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(200),
    supabaseAdmin
      .from('guestbook_entries')
      .select('id, event_id, author_name, message, voice_url, is_approved, created_at')
      .eq('event_id', event.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);
  return {
    coupleNames: event.couple_names,
    photos: (photos || []) as PhotoRecord[],
    entries: (entries || []) as GuestbookEntryRecord[],
  };
}

export async function uploadAlbumPhotoAction(formData: FormData): Promise<{ success: true } | { error: string }> {
  try {
    const event = await eventForAlbum(formData.get('albumToken') as string);
    if (!event) return { error: 'This album is not available.' };
    const file = formData.get('file') as File | null;
    if (!file) return { error: 'Please choose a photo.' };
    if (!PHOTO_TYPES.includes(file.type.toLowerCase())) return { error: 'Please upload a JPG, PNG or WebP photo.' };
    if (file.size > MAX_PHOTO_BYTES) return { error: 'Photo exceeds the 10MB limit.' };

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `${event.id}/album/${Date.now()}_${randomBytes(4).toString('hex')}.${ext}`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (uploadErr) throw uploadErr;
    const { data } = supabaseAdmin.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);

    const name = cleanName(formData.get('name'));
    const { error } = await supabaseAdmin.from('photos').insert({
      event_id: event.id,
      image_url: data.publicUrl,
      storage_path: storagePath,
      uploader_name: name || null,
      caption: name ? `Shared by ${name}` : null,
      is_approved: true,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('uploadAlbumPhotoAction error:', err);
    return { error: 'Your photo could not be uploaded. Please try again.' };
  }
}

export async function addGuestbookEntryAction(formData: FormData): Promise<{ success: true } | { error: string }> {
  try {
    const event = await eventForAlbum(formData.get('albumToken') as string);
    if (!event) return { error: 'This album is not available.' };

    const name = cleanName(formData.get('name'));
    const message = ((formData.get('message') as string) || '').trim().slice(0, 1000);
    const voice = formData.get('voice') as File | null;
    if (!name) return { error: 'Please add your name.' };
    if (!message && !voice) return { error: 'Please write a message or record a voice note.' };

    let voiceUrl: string | null = null;
    let voicePath: string | null = null;
    if (voice) {
      const type = voice.type.split(';')[0].toLowerCase();
      if (!VOICE_TYPES.includes(type)) return { error: 'That voice note format is not supported.' };
      if (voice.size > MAX_VOICE_BYTES) return { error: 'Voice notes can be up to about a minute long.' };
      const ext = type.includes('webm') ? 'webm' : type.includes('ogg') ? 'ogg' : type.includes('mpeg') ? 'mp3' : 'm4a';
      voicePath = `${event.id}/voice/${Date.now()}_${randomBytes(4).toString('hex')}.${ext}`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .upload(voicePath, Buffer.from(await voice.arrayBuffer()), { contentType: type, upsert: false });
      if (uploadErr) throw uploadErr;
      voiceUrl = supabaseAdmin.storage.from(PHOTO_BUCKET).getPublicUrl(voicePath).data.publicUrl;
    }

    const { error } = await supabaseAdmin.from('guestbook_entries').insert({
      event_id: event.id,
      author_name: name,
      message: message || null,
      voice_url: voiceUrl,
      voice_storage_path: voicePath,
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('addGuestbookEntryAction error:', err);
    return { error: 'Your message could not be saved. Please try again.' };
  }
}

// ---- Couple moderation (admin link required, scoped to the event) ----

export async function listGuestbookAction(eventId: string, adminToken: string): Promise<{ entries: GuestbookEntryRecord[] }> {
  try {
    await requireAdminAccess(eventId, adminToken);
    const { data } = await supabaseAdmin
      .from('guestbook_entries')
      .select('id, event_id, author_name, message, voice_url, is_approved, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    return { entries: (data || []) as GuestbookEntryRecord[] };
  } catch {
    return { entries: [] };
  }
}

export async function setMemoryVisibilityAction(input: {
  eventId: string;
  adminToken: string;
  kind: 'photo' | 'message';
  id: string;
  approved: boolean;
}): Promise<{ success: boolean }> {
  try {
    await requireAdminAccess(input.eventId, input.adminToken);
    const table = input.kind === 'photo' ? 'photos' : 'guestbook_entries';
    const { error } = await supabaseAdmin
      .from(table)
      .update({ is_approved: input.approved })
      .eq('id', input.id)
      .eq('event_id', input.eventId);
    revalidatePath(`/admin/${input.adminToken}`);
    return { success: !error };
  } catch {
    return { success: false };
  }
}

export async function deleteGuestbookEntryAction(eventId: string, adminToken: string, id: string): Promise<{ success: boolean }> {
  try {
    await requireAdminAccess(eventId, adminToken);
    const { data: entry } = await supabaseAdmin
      .from('guestbook_entries')
      .select('voice_storage_path')
      .eq('id', id)
      .eq('event_id', eventId)
      .maybeSingle();
    if (!entry) return { success: false };
    if (entry.voice_storage_path) await supabaseAdmin.storage.from(PHOTO_BUCKET).remove([entry.voice_storage_path]);
    const { error } = await supabaseAdmin.from('guestbook_entries').delete().eq('id', id).eq('event_id', eventId);
    return { success: !error };
  } catch {
    return { success: false };
  }
}
