'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { GuestbookEntryRecord, PhotoRecord } from '@/lib/types';
import { listAlbumAction } from '@/app/actions/album-actions';

interface AlbumSlideshowProps {
  albumToken: string;
  initial: { coupleNames: string; photos: PhotoRecord[]; entries: GuestbookEntryRecord[] };
}

const SLIDE_MS = 7000;
const REFRESH_MS = 20000;

/** Full-screen loop of photos and written messages, for a screen at the venue. New uploads appear on their own. */
export default function AlbumSlideshow({ albumToken, initial }: AlbumSlideshowProps) {
  const [album, setAlbum] = useState(initial);
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => {
    const photos = album.photos.map((p) => ({ kind: 'photo' as const, id: p.id, photo: p }));
    const notes = album.entries.filter((e) => e.message).map((e) => ({ kind: 'note' as const, id: e.id, entry: e }));
    // Interleave so messages appear between photos.
    const out: Array<(typeof photos)[number] | (typeof notes)[number]> = [];
    for (let i = 0; i < Math.max(photos.length, notes.length); i++) {
      if (photos[i]) out.push(photos[i]);
      if (notes[i]) out.push(notes[i]);
    }
    return out;
  }, [album]);

  useEffect(() => {
    const tick = setInterval(() => setIndex((i) => i + 1), SLIDE_MS);
    const poll = setInterval(async () => {
      const next = await listAlbumAction(albumToken);
      if (!('error' in next)) setAlbum(next);
    }, REFRESH_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [albumToken]);

  const slide = slides.length ? slides[index % slides.length] : null;

  return (
    <main className="fixed inset-0 bg-black text-white flex items-center justify-center overflow-hidden">
      {!slide && (
        <div className="text-center space-y-3 px-6">
          <h1 className="font-serif text-4xl">{album.coupleNames}</h1>
          <p className="text-lg opacity-70">Photos and messages will appear here as guests share them.</p>
        </div>
      )}
      {slide?.kind === 'photo' && (
        <figure key={slide.id} className="h-full w-full flex flex-col items-center justify-center motion-safe:animate-[fadeIn_1s_ease]">
          <img src={slide.photo.image_url} alt="" className="max-h-[90vh] max-w-[95vw] object-contain" />
          {slide.photo.uploader_name && <figcaption className="mt-3 text-lg opacity-80">Shared by {slide.photo.uploader_name}</figcaption>}
        </figure>
      )}
      {slide?.kind === 'note' && (
        <blockquote key={slide.id} className="max-w-3xl px-8 text-center space-y-6 motion-safe:animate-[fadeIn_1s_ease]">
          <p className="font-serif text-3xl sm:text-5xl leading-snug">“{slide.entry.message}”</p>
          <footer className="text-xl opacity-80">— {slide.entry.author_name}</footer>
        </blockquote>
      )}
      <p className="absolute bottom-4 right-6 text-sm opacity-50">{album.coupleNames}</p>
    </main>
  );
}
