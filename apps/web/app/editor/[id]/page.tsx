import { notFound } from 'next/navigation';
import { getDeck } from '../../../lib/api-client';
import { Editor } from './Editor';

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  const deck = await getDeck(id);
  if (!deck) notFound();
  return <Editor initialDeck={deck} />;
}
