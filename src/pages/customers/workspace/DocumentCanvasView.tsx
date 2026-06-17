/**
 * DocumentCanvasView
 *
 * Displays a single rendered document page received from the Web Worker.
 *
 * Render flow:
 *   1. Checks the bitmapCache for a pre-rendered bitmap on mount and whenever
 *      pageNum / content / fileName change.
 *   2. If not cached, calls onRenderPage — the parent enqueues a RENDER_PAGE
 *      message to the worker.
 *   3. When the bitmap lands in the cache, paints it onto the <canvas> via
 *      drawImage (GPU-accelerated, zero serialisation overhead).
 *
 * Sizing strategy:
 *   The worker renders at 1.5× resolution (e.g. 1191×1685 px for an A4 page).
 *   We display it at a smaller CSS size so text is crisp on high-DPI screens.
 *
 *   Using `aspect-ratio` CSS directly on a <canvas> that also has explicit
 *   width/height attributes is unreliable across browsers — the browser may
 *   treat the attributes as the authoritative intrinsic size and ignore the
 *   CSS ratio.  Instead we use a wrapper <div> that owns the aspect ratio and
 *   let the canvas fill it absolutely, which is universally supported.
 */

import { useEffect, useRef, memo } from 'react';
import { Loader2 } from 'lucide-react';

interface DocumentCanvasViewProps {
  pageNum:     number;
  content:     string;
  fileName:    string;
  bitmapCache: Map<number, ImageBitmap>;
  onRenderPage:(pageNum: number, content: string, fileName: string) => void;
}

const DocumentCanvasView = memo(function DocumentCanvasView({
  pageNum,
  content,
  fileName,
  bitmapCache,
  onRenderPage,
}: DocumentCanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmap    = bitmapCache.get(pageNum);

  // Trigger a worker render when no cached bitmap exists for this page
  useEffect(() => {
    if (!bitmap) {
      onRenderPage(pageNum, content, fileName);
    }
  }, [pageNum, content, fileName, bitmap, onRenderPage]);

  // Paint the bitmap onto the canvas whenever it becomes available.
  // Setting canvas.width resets all context state, so always set dimensions
  // before any draw calls.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    canvas.width  = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  }, [bitmap]);

  if (!bitmap) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-gray-400">
        <Loader2 className="size-4 animate-spin" />
        Rendering page {pageNum}…
      </div>
    );
  }

  // Aspect ratio is owned by the wrapper div so the browser always has a
  // single source of truth for the dimensions.  The canvas fills the wrapper
  // via absolute positioning and its pixel resolution is set via attributes.
  const aspectRatio = `${bitmap.width} / ${bitmap.height}`;

  return (
    <div className="flex-1 overflow-auto bg-gray-200 flex justify-center py-6 px-4">
      <div
        className="shadow-2xl rounded-sm"
        style={{
          position:    'relative',
          width:       '100%',
          maxWidth:    '700px',
          aspectRatio,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset:    0,
            width:    '100%',
            height:   '100%',
          }}
        />
      </div>
    </div>
  );
});

export default DocumentCanvasView;
