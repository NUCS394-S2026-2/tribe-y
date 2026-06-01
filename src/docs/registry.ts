import introMd from './content/00-introduction.md?raw';
import quickstartMd from './content/01-quickstart.md?raw';
import agentCardMd from './content/10-agent-card.md?raw';
import jsonRpcMd from './content/11-json-rpc.md?raw';
import reportTypesMd from './content/12-report-types.md?raw';
import responseShapeMd from './content/13-response-shape.md?raw';
import x402OverviewMd from './content/20-x402-overview.md?raw';
import paymentHandshakeMd from './content/21-payment-handshake.md?raw';
import walletSetupMd from './content/22-wallet-setup.md?raw';
import errorCodesMd from './content/30-error-codes.md?raw';
import changelogMd from './content/31-changelog.md?raw';

export type DocCategory = 'Getting started' | 'Protocol' | 'Payment' | 'Reference';

export interface DocPage {
  slug: string;
  title: string;
  category: DocCategory;
  source: string;
}

/**
 * Slug-addressed registry of every page in the docs site. The order here
 * defines (a) the order in the sidebar within each category and (b) the
 * Prev/Next navigation order.
 */
export const DOC_PAGES: readonly DocPage[] = [
  {
    slug: 'introduction',
    title: 'Introduction',
    category: 'Getting started',
    source: introMd,
  },
  {
    slug: 'quickstart',
    title: 'Quickstart',
    category: 'Getting started',
    source: quickstartMd,
  },
  {
    slug: 'agent-card',
    title: 'Agent card',
    category: 'Protocol',
    source: agentCardMd,
  },
  {
    slug: 'json-rpc',
    title: 'JSON-RPC',
    category: 'Protocol',
    source: jsonRpcMd,
  },
  {
    slug: 'report-types',
    title: 'Report types',
    category: 'Protocol',
    source: reportTypesMd,
  },
  {
    slug: 'response-shape',
    title: 'Response shape',
    category: 'Protocol',
    source: responseShapeMd,
  },
  {
    slug: 'x402-overview',
    title: 'x402 overview',
    category: 'Payment',
    source: x402OverviewMd,
  },
  {
    slug: 'payment-handshake',
    title: 'Payment handshake',
    category: 'Payment',
    source: paymentHandshakeMd,
  },
  {
    slug: 'wallet-setup',
    title: 'Wallet setup',
    category: 'Payment',
    source: walletSetupMd,
  },
  {
    slug: 'error-codes',
    title: 'Error codes',
    category: 'Reference',
    source: errorCodesMd,
  },
  {
    slug: 'changelog',
    title: 'Changelog',
    category: 'Reference',
    source: changelogMd,
  },
];

export const DOC_CATEGORY_ORDER: readonly DocCategory[] = [
  'Getting started',
  'Protocol',
  'Payment',
  'Reference',
];

export const DEFAULT_DOC_SLUG = 'introduction';

export function findDocPage(slug: string | undefined): DocPage | undefined {
  if (!slug) return DOC_PAGES.find((p) => p.slug === DEFAULT_DOC_SLUG);
  return DOC_PAGES.find((p) => p.slug === slug);
}

export function adjacentPages(slug: string): { prev?: DocPage; next?: DocPage } {
  const idx = DOC_PAGES.findIndex((p) => p.slug === slug);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? DOC_PAGES[idx - 1] : undefined,
    next: idx < DOC_PAGES.length - 1 ? DOC_PAGES[idx + 1] : undefined,
  };
}
