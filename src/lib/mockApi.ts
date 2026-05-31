/**
 * Mock API layer — simulates server-side pagination, filtering, sorting, and
 * document retrieval. In production, replace these with real fetch() calls.
 *
 * Architecture note:
 *  - All filtering/sorting happens "server-side" (here) so swapping to a real
 *    backend requires only changing this file.
 *  - fetchDocument returns pre-built page content. Phase 2 will replace this
 *    with a streaming binary (PDF/TIFF) and a web-worker canvas renderer.
 */

import { _customers, type Customer, type CustomerDocument } from '@/data/mockCustomers';
import { MOCK_PRESENCE_SEED, type DocumentComment, type WorkspaceUser } from '@/types/document';
import type { Permission } from '@/types/auth';

// ── Re-export types used by components ─────────────────────────────────────
export type { Customer, CustomerDocument };

export type SortField   = 'name' | 'company' | 'country' | 'status' | 'joinedAt';
export type SortOrder   = 'asc' | 'desc';
export type StatusFilter = 'all' | 'Active' | 'Inactive';

export interface FetchCustomersParams {
  page:      number;
  pageSize:  number;
  search:    string;
  status:    StatusFilter;
  sortBy:    SortField;
  sortOrder: SortOrder;
}

export interface CustomersPage {
  records:    Customer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface MockDocumentPage {
  pageNumber: number;
  content:    string;
}

export interface MockDocumentResult {
  id:         string;
  fileName:   string;
  sizeBytes:  number;
  totalPages: number;
  uploadedAt: string;
  pages:      MockDocumentPage[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const NETWORK_LATENCY = 350; // ms — simulate realistic round-trip

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ── fetchCustomers ───────────────────────────────────────────────────────────
export async function fetchCustomers(
  params: FetchCustomersParams,
): Promise<CustomersPage> {
  await delay(NETWORK_LATENCY);

  const { page, pageSize, search, status, sortBy, sortOrder } = params;
  const q = search.trim().toLowerCase();

  let rows = _customers as Customer[];

  if (q) {
    rows = rows.filter(c =>
      c.name.toLowerCase().includes(q)    ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)   ||
      c.country.toLowerCase().includes(q)
    );
  }

  if (status !== 'all') {
    rows = rows.filter(c => c.status === status);
  }

  rows = [...rows].sort((a, b) => {
    const av = String(a[sortBy] ?? '');
    const bv = String(b[sortBy] ?? '');
    const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const total      = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const start      = (safePage - 1) * pageSize;

  return {
    records: rows.slice(start, start + pageSize),
    total,
    page:       safePage,
    pageSize,
    totalPages,
  };
}

// ── fetchDocument ────────────────────────────────────────────────────────────
const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
  'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure ' +
  'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

const SECTION_TITLES = [
  'Terms and Conditions',        'Obligations of the Parties',
  'Payment Schedule',            'Intellectual Property Rights',
  'Confidentiality',             'Limitation of Liability',
  'Dispute Resolution',          'Governing Law and Jurisdiction',
  'Force Majeure',               'Termination and Suspension',
  'Representations & Warranties','Indemnification',
  'Assignment and Delegation',   'Entire Agreement',
];

function buildPage(doc: CustomerDocument, pageNum: number): string {
  const section = SECTION_TITLES[(pageNum - 1) % SECTION_TITLES.length];
  return [
    `DOCUMENT : ${doc.fileName}`,
    `${'═'.repeat(60)}`,
    `Page ${pageNum} of ${doc.pages}   |   Uploaded: ${doc.uploadedAt}`,
    ``,
    `${pageNum}. ${section.toUpperCase()}`,
    `${'─'.repeat(50)}`,
    ``,
    `${pageNum}.1  ${LOREM}`,
    ``,
    `${pageNum}.2  ${LOREM} Excepteur sint occaecat cupidatat non proident, sunt in ` +
    `culpa qui officia deserunt mollit anim id est laborum.`,
    ``,
    `${pageNum}.3  The parties acknowledge that this section constitutes a binding ` +
    `obligation enforceable under applicable law. Any amendments must be made in ` +
    `writing and signed by authorized representatives of both parties.`,
    ``,
    `         Signature: ____________________     Date: __________`,
    ``,
    `─ End of page ${pageNum} ─`,
  ].join('\n');
}

export async function fetchDocument(documentId: string): Promise<MockDocumentResult> {
  await delay(600 + Math.random() * 400);

  const customer = _customers.find(c => c.document.id === documentId);
  if (!customer) throw new Error(`Document not found: ${documentId}`);

  const { document: doc } = customer;

  return {
    id:         doc.id,
    fileName:   doc.fileName,
    sizeBytes:  doc.sizeBytes,
    totalPages: doc.pages,
    uploadedAt: doc.uploadedAt,
    pages: Array.from({ length: doc.pages }, (_, i) => ({
      pageNumber: i + 1,
      content:    buildPage(doc, i + 1),
    })),
  };
}

// ── fetchDocumentMetadata ─────────────────────────────────────────────────────
// Fast call — returns only metadata (no page content). Used by the loader hook
// to show file info and start the progress bar before the full payload arrives.
export async function fetchDocumentMetadata(documentId: string): Promise<CustomerDocument> {
  await delay(180);
  const customer = _customers.find(c => c.document.id === documentId);
  if (!customer) throw new Error(`Document not found: ${documentId}`);
  return customer.document;
}

// ── fetchCurrentUserPermissions ───────────────────────────────────────────────
// Called once at app-shell level (AuthProvider). Returns the flat permission
// list for the authenticated user. In production: decode a signed JWT or call
// GET /api/auth/me/permissions. The frontend never receives raw role strings.
export async function fetchCurrentUserPermissions(_userId: string): Promise<Permission[]> {
  await delay(120);
  // Mock: import the active set that AuthContext uses.
  // In production this would be a real network call.
  const { EDITOR_PERMISSIONS } = await import('@/contexts/AuthContext');
  return EDITOR_PERMISSIONS;
}

// ── Comments ──────────────────────────────────────────────────────────────────
// In-memory store; survives the session but resets on page reload (mock only).
const _commentStore = new Map<string, DocumentComment[]>();
let   _nextCommentId = 1;

function ensureComments(documentId: string): DocumentComment[] {
  if (!_commentStore.has(documentId)) {
    _commentStore.set(documentId, [
      {
        id:         `c${_nextCommentId++}`,
        pageNumber: 1,
        author:     MOCK_PRESENCE_SEED[0],
        content:    'Please review section 1.2 — payment terms may conflict with the master agreement.',
        createdAt:  new Date(Date.now() - 172_800_000).toISOString(),
        resolved:   false,
      },
      {
        id:         `c${_nextCommentId++}`,
        pageNumber: 3,
        author:     MOCK_PRESENCE_SEED[1],
        content:    'Liability clause needs legal sign-off before we can proceed.',
        createdAt:  new Date(Date.now() - 86_400_000).toISOString(),
        resolved:   false,
      },
      {
        id:         `c${_nextCommentId++}`,
        pageNumber: 3,
        author:     MOCK_PRESENCE_SEED[0],
        content:    'Agreed — flagged for legal review.',
        createdAt:  new Date(Date.now() - 43_200_000).toISOString(),
        resolved:   true,
      },
    ]);
  }
  return _commentStore.get(documentId)!;
}

export async function fetchDocumentComments(documentId: string): Promise<DocumentComment[]> {
  await delay(200);
  return [...ensureComments(documentId)];
}

export async function addDocumentComment(
  documentId:    string,
  pageNumber:    number,
  content:       string,
  author:        WorkspaceUser,
  selectedText?: string,
): Promise<DocumentComment> {
  await delay(250);
  const comment: DocumentComment = {
    id:         `c${_nextCommentId++}`,
    pageNumber,
    content,
    author,
    selectedText,
    createdAt:  new Date().toISOString(),
    resolved:   false,
  };
  ensureComments(documentId).push(comment);
  return comment;
}
