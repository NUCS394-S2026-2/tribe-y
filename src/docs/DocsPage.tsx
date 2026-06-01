import React from 'react';
import { Link, useParams } from 'react-router-dom';

import styles from './DocsLayout.module.css';
import { MarkdownView } from './MarkdownView';
import {
  adjacentPages,
  DOC_CATEGORY_ORDER,
  DOC_PAGES,
  type DocCategory,
  type DocPage,
  findDocPage,
} from './registry';

function groupByCategory(): Record<DocCategory, DocPage[]> {
  const out: Record<DocCategory, DocPage[]> = {
    'Getting started': [],
    Protocol: [],
    Payment: [],
    Reference: [],
  };
  for (const p of DOC_PAGES) {
    out[p.category].push(p);
  }
  return out;
}

export function DocsPage(): React.ReactElement {
  const { slug } = useParams<{ slug?: string }>();
  const page = findDocPage(slug);
  const grouped = groupByCategory();
  const activeSlug = page?.slug ?? '';
  const { prev, next } = page
    ? adjacentPages(page.slug)
    : { prev: undefined, next: undefined };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>compass.tne.ai</div>
        <div className={styles.sidebarSub}>Integration Docs</div>

        <nav className={styles.nav} aria-label="Documentation navigation">
          {DOC_CATEGORY_ORDER.map((category) => (
            <div key={category} className={styles.navSection}>
              <div className={styles.navCategory}>{category}</div>
              <ul className={styles.navList}>
                {grouped[category].map((p) => {
                  const isActive = p.slug === activeSlug;
                  return (
                    <li key={p.slug}>
                      <Link
                        to={`/docs/${p.slug}`}
                        className={
                          isActive
                            ? `${styles.navLink} ${styles.navLinkActive}`
                            : styles.navLink
                        }
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {p.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/chat" className={styles.footerLink}>
            ← Back to chat
          </Link>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.contentWrap}>
          {page ? (
            <>
              <article className={styles.article}>
                <MarkdownView source={page.source} />
              </article>
              <footer className={styles.prevNext}>
                {prev ? (
                  <Link to={`/docs/${prev.slug}`} className={styles.prevNextLink}>
                    <span className={styles.prevNextDir}>← Prev</span>
                    <span className={styles.prevNextTitle}>{prev.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    to={`/docs/${next.slug}`}
                    className={`${styles.prevNextLink} ${styles.prevNextRight}`}
                  >
                    <span className={styles.prevNextDir}>Next →</span>
                    <span className={styles.prevNextTitle}>{next.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
              </footer>
            </>
          ) : (
            <div className={styles.notFound}>
              <h1>Page not found</h1>
              <p>
                There is no docs page at <code>/docs/{slug}</code>.
              </p>
              <p>
                <Link to="/docs" className={styles.footerLink}>
                  Return to the introduction →
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DocsPage;
