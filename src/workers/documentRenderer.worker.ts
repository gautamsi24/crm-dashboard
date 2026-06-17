/**
 * documentRenderer.worker.ts
 *
 * Runs entirely off the main thread.
 *
 * Protocol
 *   IN  → { type: 'RENDER_PAGE', pageNum, content, fileName, scale }
 *   OUT ← { type: 'PAGE_READY',  pageNum, bitmap }   (bitmap is transferred)
 *       ← { type: 'ERROR',       pageNum, error }
 *
 * Font note:
 *   CSS shorthand keywords such as -apple-system are resolved by the browser's
 *   style engine, which is not available inside a Worker. OffscreenCanvas only
 *   accepts fully-qualified font strings. We use "Arial" (universally available
 *   on every major OS) for UI chrome and "Courier New" for document body text.
 *
 * Phase 2 production upgrade:
 *   Replace the text-parsing render with PDF.js:
 *     const page = await pdfDoc.getPage(pageNum);
 *     await page.render({ canvasContext: ctx, viewport }).promise;
 */

// A4 at 96 DPI
const BASE_W = 794;
const BASE_H = 1123;

// Safe font stacks that resolve correctly inside an OffscreenCanvas Worker.
// -apple-system / "Segoe UI" are CSS shorthands, not valid canvas font names.
const SANS = '"Arial","Helvetica",sans-serif';
const MONO = '"Courier New",Courier,monospace';

interface RenderPageMessage {
  type:     'RENDER_PAGE';
  pageNum:  number;
  content:  string;
  fileName: string;
  scale:    number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clip(ctx: OffscreenCanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 0 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
  return `${s}…`;
}

function hRule(
  ctx: OffscreenCanvasRenderingContext2D,
  y: number, x0: number, x1: number,
  color: string, lineWidth: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineWidth;
  ctx.stroke();
}

/**
 * Word-wraps `text` into the column of width `maxW`, printing each line at
 * (x, y) and advancing y by `lineH` per line.
 *
 * Splitting on /\s+/ and filtering empty tokens handles double-spaced content
 * like "1.1  Lorem…" correctly — split(' ') would produce an empty token that
 * accumulates into the measured string and skews the word-wrap boundary.
 *
 * Falls back to character-level breaking for any single token that is itself
 * wider than the column (e.g. a very long URL or file path).
 */
function wrapText(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxW: number,
  lineH: number,
  yBottom: number,
): number {
  const tokens = text.split(/\s+/).filter(s => s.length > 0);
  let y   = startY;
  let cur = '';

  for (const token of tokens) {
    if (y >= yBottom) break;

    // If a single token is wider than the column, break it character by character
    if (ctx.measureText(token).width > maxW) {
      if (cur) {
        ctx.fillText(cur, x, y);
        y += lineH;
        cur = '';
      }
      let chars = '';
      for (const ch of token) {
        const attempt = chars + ch;
        if (ctx.measureText(attempt).width > maxW && chars) {
          ctx.fillText(chars, x, y);
          y += lineH;
          chars = ch;
        } else {
          chars = attempt;
        }
      }
      if (chars) { cur = chars; }
      continue;
    }

    const attempt = cur ? `${cur} ${token}` : token;
    if (ctx.measureText(attempt).width > maxW && cur) {
      ctx.fillText(cur, x, y);
      y += lineH;
      cur = token;
    } else {
      cur = attempt;
    }
  }

  if (cur && y < yBottom) {
    ctx.fillText(cur, x, y);
    y += lineH;
  }

  return y;
}

// ── Page renderer ─────────────────────────────────────────────────────────────

function renderPage(
  ctx:      OffscreenCanvasRenderingContext2D,
  content:  string,
  fileName: string,
  pageNum:  number,
  w:        number,
  h:        number,
): void {
  const mg  = Math.round(w * 0.09);   // left/right margin
  const tw  = w - mg * 2;             // usable text width
  const fs  = Math.round(w * 0.019);  // base font size (px)
  const lh  = Math.round(fs * 1.65);  // line height (px)

  // ── Background ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // ── Header stripe ────────────────────────────────────────────────────────
  const strH = Math.round(h * 0.052);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, w, strH);

  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.font         = `${Math.round(fs * 0.88)}px ${SANS}`;
  ctx.fillStyle    = '#e2e8f0';
  ctx.fillText(clip(ctx, fileName, tw * 0.65), mg, strH / 2);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Page ${pageNum}`, w - mg, strH / 2);

  // ── Body ─────────────────────────────────────────────────────────────────
  let y         = strH + Math.round(mg * 0.75);
  const yBottom = h - Math.round(mg * 0.9);

  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';

  for (const raw of content.split('\n')) {
    if (y >= yBottom) break;

    const line = raw.trimEnd();

    // ── Empty line ────────────────────────────────────────────────────────
    if (!line.trim()) {
      y += Math.round(lh * 0.45);
      continue;
    }

    // ── "DOCUMENT : filename" ─────────────────────────────────────────────
    if (line.startsWith('DOCUMENT :')) {
      ctx.font      = `bold ${Math.round(fs * 1.1)}px ${MONO}`;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(clip(ctx, line, tw), mg, y);
      y += Math.round(lh * 1.3);
      continue;
    }

    // ── Heavy rule  ════════════ ──────────────────────────────────────────
    if (/^[═]+$/.test(line.trim())) {
      hRule(ctx, y + lh * 0.45, mg, w - mg, '#334155', Math.max(1, Math.round(w * 0.0022)));
      y += Math.round(lh * 0.75);
      continue;
    }

    // ── Light rule  ──────────── ──────────────────────────────────────────
    if (/^[─]+$/.test(line.trim())) {
      hRule(ctx, y + lh * 0.45, mg, w - mg, '#cbd5e1', Math.max(1, Math.round(w * 0.001)));
      y += Math.round(lh * 0.65);
      continue;
    }

    // ── End-of-page marker  "─ End of page N ─" ──────────────────────────
    if (line.trimStart().startsWith('─ End of page')) {
      ctx.font      = `${Math.round(fs * 0.8)}px ${MONO}`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(line.trim(), w / 2, y);
      ctx.textAlign = 'left';
      y += lh;
      continue;
    }

    // ── Page metadata  "Page N of M   |   Uploaded: …" ───────────────────
    if (/^Page \d+/.test(line)) {
      ctx.font      = `${Math.round(fs * 0.85)}px ${MONO}`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(clip(ctx, line, tw), mg, y);
      y += Math.round(lh * 1.05);
      continue;
    }

    // ── Section heading  "N. SECTION TITLE" ──────────────────────────────
    // The title portion is all-uppercase letters, spaces, and punctuation.
    if (/^\d+\.\s+[A-Z0-9 &():,'".\-]{4,}$/.test(line.trim())) {
      ctx.font      = `bold ${Math.round(fs * 1.07)}px ${MONO}`;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(clip(ctx, line, tw), mg, y);
      y += Math.round(lh * 1.45);
      continue;
    }

    // ── Signature line ────────────────────────────────────────────────────
    if (line.includes('____')) {
      ctx.font      = `${fs}px ${MONO}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(clip(ctx, line.trim(), tw), mg, y);
      y += Math.round(lh * 1.2);
      continue;
    }

    // ── Body text (word-wrapped) ──────────────────────────────────────────
    // "1.1  Lorem ipsum…" — isNumbered controls slightly darker colour and
    // extra spacing after the paragraph.
    const isNumbered = /^\d+\.\d+\s/.test(line.trimStart());
    ctx.font      = `${fs}px ${MONO}`;
    ctx.fillStyle = isNumbered ? '#1e293b' : '#334155';

    y = wrapText(ctx, line, mg, y, tw, lh, yBottom);
    if (isNumbered) y += Math.round(lh * 0.25);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const ftY = h - Math.round(h * 0.042);
  hRule(ctx, ftY, mg, w - mg, '#e2e8f0', Math.max(1, Math.round(w * 0.001)));

  ctx.font         = `${Math.round(fs * 0.78)}px ${SANS}`;
  ctx.fillStyle    = '#94a3b8';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CONFIDENTIAL — ${fileName}`, w / 2, ftY + Math.round(h * 0.021));
}

// ── Message handler ───────────────────────────────────────────────────────────

// postMessage in a Worker takes (data, transfer[]) but the DOM lib types it as
// window.postMessage with a different signature — narrow the type to avoid the
// TypeScript error without affecting runtime behaviour.
const workerPost = (self as unknown as {
  postMessage(d: unknown, t?: Transferable[]): void;
}).postMessage.bind(self);

addEventListener('message', (e: MessageEvent) => {
  const msg = e.data as RenderPageMessage;
  if (msg.type !== 'RENDER_PAGE') return;

  const { pageNum, content, fileName, scale = 1 } = msg;
  const w = Math.round(BASE_W * scale);
  const h = Math.round(BASE_H * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx    = canvas.getContext('2d');

  if (!ctx) {
    workerPost({ type: 'ERROR', pageNum, error: 'OffscreenCanvas 2d context unavailable' });
    return;
  }

  try {
    renderPage(ctx, content, fileName, pageNum, w, h);
    const bitmap = canvas.transferToImageBitmap();
    workerPost({ type: 'PAGE_READY', pageNum, bitmap }, [bitmap]);
  } catch (err) {
    workerPost({ type: 'ERROR', pageNum, error: String(err) });
  }
});
