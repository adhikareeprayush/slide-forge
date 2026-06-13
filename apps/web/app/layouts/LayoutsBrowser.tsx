'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Shell } from '../../components/Shell';
import { fetchLayoutsFiltered } from '../../lib/export-api';
import type { LayoutMeta } from '../../lib/editor-api';
import styles from './layouts.module.css';

const CATEGORIES = ['all', 'title', 'content', 'media', 'data', 'closing'] as const;

export function LayoutsBrowser() {
  const [layouts, setLayouts] = useState<LayoutMeta[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<'name' | 'popular'>('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLayoutsFiltered({
      category: category === 'all' ? undefined : category,
      sort,
    })
      .then(setLayouts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, sort]);

  const builtin = useMemo(() => layouts.filter((l) => l.isBuiltin), [layouts]);
  const community = useMemo(() => layouts.filter((l) => !l.isBuiltin), [layouts]);

  return (
    <Shell badge="Layouts">
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Layout library</h1>
          <p className={styles.subtitle}>
            Built-in and community slide layouts. Use any layout in the editor, or{' '}
            <a
              href="https://github.com/slideforge/slideforge/tree/main/community"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              contribute your own
            </a>
            .
          </p>
        </header>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.filterBtn} ${category === c ? styles.filterActive : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value as 'name' | 'popular')}
            aria-label="Sort layouts"
          >
            <option value="name">A–Z</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading layouts…</p>
        ) : (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Built-in ({builtin.length})</h2>
              <div className={styles.grid}>
                {builtin.map((layout) => (
                  <LayoutCard key={layout.id} layout={layout} />
                ))}
              </div>
            </section>

            {community.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Community ({community.length})</h2>
                <div className={styles.grid}>
                  {community.map((layout) => (
                    <LayoutCard key={layout.id} layout={layout} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </Shell>
  );
}

function LayoutCard({ layout }: { layout: LayoutMeta }) {
  return (
    <Link href={`/layouts/${layout.id}`} className={styles.card}>
      <div
        className={styles.thumb}
        dangerouslySetInnerHTML={{ __html: layout.thumbnail }}
      />
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{layout.name}</h3>
        <p className={styles.cardMeta}>
          {layout.category} · v{layout.version}
          {!layout.isBuiltin && ` · ${layout.downloads ?? 0} uses`}
        </p>
        <span className={layout.isBuiltin ? styles.badgeBuiltin : styles.badgeCommunity}>
          {layout.isBuiltin ? 'Built-in' : 'Community'}
        </span>
      </div>
    </Link>
  );
}
