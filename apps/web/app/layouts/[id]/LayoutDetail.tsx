'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Shell } from '../../../components/Shell';
import { fetchLayoutDetail, useLayout } from '../../../lib/export-api';
import type { LayoutMeta } from '../../../lib/editor-api';
import type { ValidatedSlide } from '@slideforge/schema';
import styles from './detail.module.css';

export function LayoutDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [layout, setLayout] = useState<(ValidatedSlide & { meta?: LayoutMeta }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLayoutDetail(id)
      .then(setLayout)
      .catch(() => setError('Layout not found'));
  }, [id]);

  async function handleUse() {
    await useLayout(id);
  }

  if (error) {
    return (
      <Shell>
        <main className={styles.page}>
          <p>{error}</p>
          <Link href="/layouts">← Back to layouts</Link>
        </main>
      </Shell>
    );
  }

  if (!layout) {
    return (
      <Shell>
        <main className={styles.page}>
          <p className={styles.loading}>Loading…</p>
        </main>
      </Shell>
    );
  }

  const meta = layout.meta;

  return (
    <Shell badge="Layout">
      <main className={styles.page}>
        <Link href="/layouts" className={styles.back}>← All layouts</Link>

        <div className={styles.layout}>
          <div
            className={styles.preview}
            dangerouslySetInnerHTML={{ __html: layout.thumbnail }}
          />
          <div className={styles.info}>
            <h1 className={styles.title}>{layout.name}</h1>
            <p className={styles.meta}>
              by {layout.author} · {layout.category} · v{layout.version}
            </p>
            {meta && !meta.isBuiltin && (
              <p className={styles.uses}>{meta.downloads ?? 0} uses</p>
            )}

            <div className={styles.tags}>
              {layout.tags?.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>

            <h2 className={styles.sectionTitle}>Slots</h2>
            <ul className={styles.slotList}>
              {layout.slots.map((slot) => (
                <li key={slot.id}>
                  <code>{slot.id}</code> — {slot.type}
                  {slot.required ? ' (required)' : ''}
                </li>
              ))}
            </ul>

            <h2 className={styles.sectionTitle}>Use in editor</h2>
            <p className={styles.instructions}>
              Open any deck in the editor, select a slide, and choose &ldquo;Change layout&rdquo; to pick{' '}
              <strong>{layout.name}</strong>.
            </p>

            <div className={styles.actions}>
              <button type="button" className={styles.useBtn} onClick={handleUse}>
                Record use
              </button>
              <Link href="/generate" className={styles.createBtn}>
                Create presentation
              </Link>
            </div>

            <h2 className={styles.sectionTitle}>Contribute</h2>
            <p className={styles.instructions}>
              Build your own layout with{' '}
              <code>slideforge new my-layout -o community/my-layout</code>. See{' '}
              <a
                href="https://github.com/slideforge/slideforge/blob/main/community/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                community/README.md
              </a>{' '}
              for the full guide.
            </p>
          </div>
        </div>
      </main>
    </Shell>
  );
}
