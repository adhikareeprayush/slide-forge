import Link from 'next/link';
import styles from './shell.module.css';

interface ShellProps {
  children: React.ReactNode;
  badge?: string;
}

export function Shell({ children, badge }: ShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.beam} aria-hidden />
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          SlideForge
        </Link>
        <nav className={styles.nav}>
          <Link href="/">Overview</Link>
          <Link href="/layouts">Layouts</Link>
          <Link href="/generate" className={styles.navCta}>
            Create
          </Link>
        </nav>
        {badge && <span className={styles.badge}>{badge}</span>}
      </header>
      {children}
    </div>
  );
}
