# CRM Dashboard

A React 19 single-page application that lets authenticated users browse a customer list, view customer documents in a collaborative workspace, and manage them (edit, comment, split, delete) according to their role-based permissions.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Available Scripts](#available-scripts)
4. [Architecture Overview](#architecture-overview)
5. [Project Structure](#project-structure)
6. [Authentication & RBAC](#authentication--rbac)
7. [Document Workspace](#document-workspace)
8. [Key Design Decisions](#key-design-decisions)

---

## Prerequisites

| Tool    | Version                         |
| ------- | ------------------------------- |
| Node.js | 18 or later                     |
| npm     | 9 or later (ships with Node 18) |

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd crm-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

You will land on the **Login** page. Pick any demo account from the list — no password required. Each account has a different role and permission set (see [Authentication & RBAC](#authentication--rbac)).

---

## Available Scripts

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start Vite dev server with hot module replacement |
| `npm run build`   | Type-check with `tsc` then bundle for production  |
| `npm run preview` | Serve the production build locally                |
| `npm run lint`    | Run ESLint across all source files                |

---

## Architecture Overview

```text
Browser
  └── React 19 (SPA, client-side only)
        ├── React Router v7       — client-side routing
        ├── AuthContext           — session & RBAC state (sessionStorage)
        ├── Mock API layer        — simulates server responses with artificial latency
        └── Pages & components    — feature UI
```

**There is no backend.** All data (users, customers, documents, comments) lives in memory and is reset on page reload. The mock API layer (`src/lib/mockApi.ts`) is the single seam where real `fetch()` calls would be added in production; no other file talks to a server.

---

## Project Structure

```text
src/
├── main.tsx                        Entry point; mounts <App />
├── App.tsx                         Router setup; wraps everything in <AuthProvider>
│
├── assets/                         Static images
│
├── components/
│   ├── Layout.tsx                  App shell: sidebar nav, header, <Outlet />
│   ├── ProtectedRoute.tsx          Auth + permission guard for any route
│   └── ui/
│       ├── avatar.tsx              Radix UI avatar with image + fallback
│       ├── badge.tsx               Coloured pill label (CVA variants)
│       ├── button.tsx              Polymorphic button (CVA variants + Radix Slot)
│       ├── input.tsx               Styled HTML input
│       └── ConfirmModal.tsx        Reusable confirmation dialog (title, description,
│                                   danger variant, optional children for extra content)
│
├── contexts/
│   └── AuthContext.tsx             Provides user, permissions, login(), logout(),
│                                   hasPermission(). Persists session to sessionStorage.
│
├── data/
│   ├── mockUsers.ts                Four demo users (one per role)
│   ├── mockCustomers.ts            Customer records with embedded document metadata
│   └── customersData.ts            Raw customer seed data
│
├── lib/
│   ├── mockApi.ts                  All "API" functions: fetchCustomers,
│   │                               fetchDocument, fetchDocumentMetadata,
│   │                               fetchDocumentComments, addDocumentComment.
│   │                               Simulates latency and progressive loading.
│   └── utils.ts                    cn() — Tailwind class merging helper
│
├── pages/
│   ├── Login.tsx                   Role-picker login screen
│   └── customers/
│       ├── Customers.tsx           Page root: wires table ↔ workspace
│       ├── CustomerSummary.tsx     KPI cards at top of customers page
│       ├── CustomersTable.tsx      Paginated, searchable, sortable customer table
│       ├── DocumentWorkspace.tsx   Slide-in panel orchestrating the full document UX
│       │
│       ├── hooks/                  Feature hooks (each owns one slice of behaviour)
│       │   ├── useCustomers.ts         Fetch + debounced search + sort/filter/page state
│       │   ├── useDocumentLoader.ts    Progressive chunked loading (metadata → stream → ready)
│       │   ├── useDocumentEdit.ts      Edit mode + Gmail-style 1.5 s auto-save
│       │   ├── useDocumentComments.ts  Fetch & post page-level comments
│       │   ├── useDocumentPresence.ts  Simulated real-time presence (who's on which page)
│       │   ├── useDocumentResume.ts    Persist & restore last-read page via localStorage
│       │   └── useTextSelection.ts     Mouse-up selection → floating comment bubble
│       │
│       └── workspace/              Focused sub-components of DocumentWorkspace
│           ├── DocumentToolbar.tsx         RBAC-aware action bar (Edit/Split/Merge/Delete/Comment)
│           ├── PageNavigator.tsx           Left sidebar with clickable page thumbnails + presence dots
│           ├── CommentsSidebar.tsx         Right sidebar for page-level comments
│           ├── EditStatusBar.tsx           Auto-save indicator + "Done editing" button
│           ├── ResumePrompt.tsx            "Pick up where you left off" banner
│           ├── SplitNotificationBanner.tsx Post-split confirmation banner
│           └── FloatingCommentBubble.tsx   Fixed-position bubble for selection-based comments
│
└── types/
    ├── auth.ts       Role, Permission, ROLE_PERMISSIONS, ROLE_LABEL
    ├── document.ts   LoadPhase, PresenceUser, DocumentComment, ResumePoint
    └── workspace.ts  Shared workspace types
```

---

## Authentication & RBAC

Session state is stored in `sessionStorage` under the key `crm_uid`. On mount, `AuthContext` reads this key and restores the session without a network call.

### Demo accounts

| Name          | Role        | Plan       | Permissions                                    |
| ------------- | ----------- | ---------- | ---------------------------------------------- |
| Alice Reader  | `user`      | Free       | View customers and documents (read-only)       |
| Bob Creator   | `proUser`   | Pro        | + Edit documents, add comments                 |
| Carol Manager | `superUser` | Business   | + Split, merge, and delete documents           |
| Dave Admin    | `admin`     | Enterprise | Full access including customer delete          |

### How permissions work

`ROLE_PERMISSIONS` in `src/types/auth.ts` maps each role to a flat list of `Permission` strings (e.g. `"document:edit"`, `"document:split"`). Components call `hasPermission(permission)` from `useAuth()` — no role strings leak into UI logic.

`ProtectedRoute` enforces both authentication and optional permission checks at the route level. Unauthorized access redirects to `/` and shows a dismissible banner.

---

## Document Workspace

Clicking any customer row in the table opens a slide-in `DocumentWorkspace` panel. The workspace is built from composable hooks and focused sub-components.

### Loading pipeline (`useDocumentLoader`)

1. **Metadata** — instant fetch: filename, page count, file size. The progress bar and header appear immediately.
2. **Chunking** — the full document content is fetched; a simulated progress bar advances.
3. **Progressive reveal** — pages are made available in 5 batches so users can start reading before the full document is ready.
4. **Error + retry** — network failures surface an error state with a Retry button; automatic back-off retries occur if the browser is offline.

### Collaborative features

| Feature | Hook | Behavior |
| --- | --- | --- |
| Real-time presence | `useDocumentPresence` | Simulated page movements every 8 s; shows who is on which page. |
| Resume position | `useDocumentResume` | Persists last-read page to localStorage; prompts to resume on re-open. |
| Inline comments | `useDocumentComments` + `useTextSelection` | Select text, type in the bubble, post to the comments sidebar. |
| Edit mode | `useDocumentEdit` | contentEditable pre element; auto-saves 1.5 s after last keystroke. |

### Toolbar actions (RBAC-gated)

| Action  | Required permission  |
| ------- | -------------------- |
| Edit    | `document:edit`      |
| Split   | `document:split`     |
| Merge   | `document:merge`     |
| Delete  | `document:delete`    |
| Comment | `document:comment`   |

Split and Delete both open a `ConfirmModal` before proceeding. The Split dialog additionally warns if any present users are on the pages that will be affected.

---

## Key Design Decisions

**Mock API as the only data boundary** — Every simulated API call goes through `src/lib/mockApi.ts`. Swapping to a real backend only requires changing that file.

**Hook-per-feature** — Each slice of the workspace (loading, editing, presence, comments, resume, text selection) lives in its own hook. `DocumentWorkspace` orchestrates them but owns no logic itself.

**Permission checks are behaviour-based, not role-based** — Components call `hasPermission("document:edit")`, not `role === "admin"`. This means permission changes in `ROLE_PERMISSIONS` propagate everywhere without touching components.

**`ConfirmModal` is the single confirmation primitive** — Both the Split and Delete flows share one component (`src/components/ui/ConfirmModal.tsx`) that accepts a title, description, variant (`default` | `danger`), and optional `children` for extra content such as input fields or warning banners.

**Progressive enhancement for large documents** — `useDocumentLoader` reveals pages incrementally so users aren't blocked waiting for a full document (simulating PDF streaming). Phase 2 of the loader (noted in comments) would replace the mock with HTTP Range requests and a Web Worker canvas renderer.
