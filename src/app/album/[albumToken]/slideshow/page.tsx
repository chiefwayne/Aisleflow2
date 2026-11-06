import { notFound } from 'next/navigation';
import AlbumSlideshow from '@/components/album/AlbumSlideshow';
import { listAlbumAction } from '@/app/actions/album-actions';

interface PageProps {
  params: Promise<{ albumToken: string }>;
}

export default async function AlbumSlideshowPage({ params }: PageProps) {
  const { albumToken } = await params;
  const album = await listAlbumAction(albumToken);
  if ('error' in album) notFound();
  return <AlbumSlideshow albumToken={albumToken} initial={album} />;
}
