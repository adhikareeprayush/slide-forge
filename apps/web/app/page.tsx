import Link from 'next/link';
import { Shell } from '../components/Shell';
import styles from './home.module.css';

const DEMO_DECK_ID = '00000000-0000-4000-a000-000000000001';

export default function Home() {
  return (
    <Shell>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Open-source · NVIDIA NIM · extensible layouts</p>
          <h1 className={styles.title}>
            Presentations built on a <em>light table</em>, not a template.
          </h1>
          <p className={styles.lead}>
            SlideForge turns a brief into a deck — outline, copy, and images stream in while you
            watch. Then refine every slot in an editor that treats slides like craft, not widgets.
          </p>
          <div className={styles.ctas}>
            <Link href="/generate" className={styles.primary}>
              Create a presentation
            </Link>
            <Link href={`/preview/${DEMO_DECK_ID}`} className={styles.secondary}>
              View demo deck
            </Link>
          </div>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>Generate</h2>
            <p>Describe your topic. AI picks from seven layouts and fills slots progressively.</p>
            <Link href="/generate">Open generator →</Link>
          </article>
          <article className={styles.card}>
            <h2>Edit</h2>
            <p>Filmstrip, slot inspector, layout swap, undo — a full editor for every slide.</p>
            <Link href={`/editor/${DEMO_DECK_ID}`}>Open editor →</Link>
          </article>
          <article className={styles.card}>
            <h2>Extend</h2>
            <p>Developers define layouts with a typed SDK. Community contributes via pull request.</p>
            <Link href="/layouts">Browse layouts →</Link>
          </article>
        </section>
      </main>
    </Shell>
  );
}
