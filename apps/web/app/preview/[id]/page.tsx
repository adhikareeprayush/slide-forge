import { notFound } from 'next/navigation';
import { getDeck } from '../../../lib/api-client';
import { DeckPreview } from './DeckPreview';

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const deck = await getDeck(id);

  if (!deck) notFound();

  return <DeckPreview deck={deck} />;
}
