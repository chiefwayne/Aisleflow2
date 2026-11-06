import { notFound } from 'next/navigation';
import AlbumView from '@/components/album/AlbumView';
import { listAlbumAction } from '@/app/actions/album-actions';

interface PageProps {
  params: Promise<{ albumToken: string }>;
}

export default async function AlbumPage({ params }: PageProps) {
  const { albumToken } = await params;
  const album = await listAlbumAction(albumToken);
  if ('error' in album) notFound();
  return <AlbumView albumToken={albumToken} initial={album} />;
}
