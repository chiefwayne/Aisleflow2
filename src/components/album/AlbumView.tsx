'use client';

import React, { useRef, useState } from 'react';
import { Camera, Mic, Square, Trash2 } from 'lucide-react';
import type { GuestbookEntryRecord, PhotoRecord } from '@/lib/types';
import { addGuestbookEntryAction, listAlbumAction, uploadAlbumPhotoAction } from '@/app/actions/album-actions';

interface AlbumViewProps {
  albumToken: string;
  initial: { coupleNames: string; photos: PhotoRecord[]; entries: GuestbookEntryRecord[] };
}

const MAX_RECORDING_MS = 60_000;

export default function AlbumView({ albumToken, initial }: AlbumViewProps) {
  const [album, setAlbum] = useState(initial);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [voice, setVoice] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<'photo' | 'message' | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const next = await listAlbumAction(albumToken);
    if (!('error' in next)) setAlbum(next);
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy('photo');
    setNotice(null);
    let failed = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('albumToken', albumToken);
      formData.append('name', name);
      formData.append('file', file);
      const result = await uploadAlbumPhotoAction(formData);
      if ('error' in result) failed++;
    }
    setBusy(null);
    setNotice(
      failed
        ? { text: `${failed} photo${failed === 1 ? '' : 's'} could not be uploaded (JPG, PNG or WebP up to 10MB).`, ok: false }
        : { text: 'Thank you! Your photos are in the album.', ok: true }
    );
    refresh();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoice(new Blob(chunks, { type: recorder.mimeType }));
        setRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setTimeout(() => recorder.state === 'recording' && recorder.stop(), MAX_RECORDING_MS);
    } catch {
      setNotice({ text: 'Microphone access was blocked. You can still write a message.', ok: false });
    }
  };

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('message');
    setNotice(null);
    const formData = new FormData();
    formData.append('albumToken', albumToken);
    formData.append('name', name);
    formData.append('message', message);
    if (voice) formData.append('voice', voice, 'voice-note');
    const result = await addGuestbookEntryAction(formData);
    setBusy(null);
    if ('error' in result) {
      setNotice({ text: result.error, ok: false });
      return;
    }
    setMessage('');
    setVoice(null);
    setNotice({ text: 'Thank you! Your message is in the guestbook.', ok: true });
    refresh();
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-aisle-charcoal">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
        <header className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-aisle-terracotta font-semibold">Memories</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{album.coupleNames}</h1>
          <p className="text-sm text-aisle-muted">Share your photos and leave the couple a message. No app or account needed.</p>
        </header>

        <div className="rounded-3xl border border-aisle-border bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <label className="block text-sm font-medium">
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="So the couple knows who it's from"
              className="mt-1 w-full rounded-xl border border-aisle-border px-3.5 py-3 text-base focus:outline-none focus:border-aisle-terracotta"
            />
          </label>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-aisle-charcoal px-5 text-sm font-semibold text-white hover:bg-aisle-terracotta disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            {busy === 'photo' ? 'Uploading…' : 'Add photos'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              uploadPhotos(e.target.files);
              e.target.value = '';
            }}
          />

          <form onSubmit={submitMessage} className="space-y-3 border-t border-aisle-border pt-4">
            <label className="block text-sm font-medium">
              Message for the couple
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Wishing you a lifetime of happiness…"
                className="mt-1 w-full rounded-xl border border-aisle-border px-3.5 py-3 text-base focus:outline-none focus:border-aisle-terracotta"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {recording ? (
                <button
                  type="button"
                  onClick={() => recorderRef.current?.stop()}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-semibold text-white"
                >
                  <Square className="h-4 w-4" /> Stop recording
                </button>
              ) : voice ? (
                <div className="flex items-center gap-2">
                  <audio controls src={URL.createObjectURL(voice)} className="h-10" />
                  <button type="button" onClick={() => setVoice(null)} aria-label="Remove voice note" className="rounded-full border border-aisle-border p-2.5">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-full border border-aisle-border px-4 text-sm font-semibold hover:bg-aisle-sand"
                >
                  <Mic className="h-4 w-4" /> Record a voice note
                </button>
              )}
              <button
                type="submit"
                disabled={busy !== null || recording}
                className="ml-auto min-h-[44px] rounded-full bg-aisle-terracotta px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy === 'message' ? 'Sending…' : 'Sign the guestbook'}
              </button>
            </div>
          </form>

          {notice && (
            <p role="status" className={`rounded-xl px-4 py-3 text-sm ${notice.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {notice.text}
            </p>
          )}
        </div>

        {album.entries.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Guestbook</h2>
            {album.entries.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-aisle-border bg-white p-4 space-y-2">
                {entry.message && <p className="text-base leading-relaxed">“{entry.message}”</p>}
                {entry.voice_url && <audio controls src={entry.voice_url} className="w-full" preload="none" />}
                <p className="text-sm text-aisle-muted">— {entry.author_name}</p>
              </article>
            ))}
          </section>
        )}

        {album.photos.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-semibold">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {album.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.image_url}
                  alt={photo.uploader_name ? `Photo from ${photo.uploader_name}` : 'Guest photo'}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
