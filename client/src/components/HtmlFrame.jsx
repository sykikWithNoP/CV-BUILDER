import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const A4_WIDTH_PX = 800;

/**
 * Renders template HTML inside a sandboxed iframe.
 *
 * Injecting template markup straight into the page (dangerouslySetInnerHTML)
 * used to leak each template's <style> block into the app's own document and
 * fight with the site theme. An iframe keeps the CV's CSS to itself, and with no
 * allow-scripts the markup cannot run anything either.
 *
 * The wrapper is sized to the *scaled* content height, so a scaled-down page no
 * longer leaves a slab of empty space underneath it.
 */
export default function HtmlFrame({
  html,
  pageWidth = A4_WIDTH_PX,
  zoom = 1,
  fitWidth = true,
  minHeight = 0,
  background = '#fff',
  title = 'Preview',
  style,
}) {
  const wrapRef = useRef(null);
  const frameRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(minHeight || 400);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    const body = doc?.body;
    if (!body) return;
    const height = Math.max(body.scrollHeight, doc.documentElement?.scrollHeight || 0);
    if (height > 0) setContentHeight(height);
  }, []);

  // Images and web fonts settle after the load event, so measure again shortly after.
  useEffect(() => {
    const timers = [setTimeout(measure, 80), setTimeout(measure, 500)];
    return () => timers.forEach(clearTimeout);
  }, [html, measure]);

  const scale = fitWidth && containerWidth ? (containerWidth / pageWidth) * zoom : zoom;
  const height = Math.max(minHeight, Math.round(contentHeight * scale));
  const width = Math.max(1, Math.round(pageWidth * scale));

  const srcDoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><base target="_blank">` +
    `<style>html,body{margin:0;padding:0;background:${background};}</style></head>` +
    `<body>${html || ''}</body></html>`;

  // The outer element always fills its parent so measuring it can't feed back
  // into the scale; the inner element carries the scaled size and may overflow,
  // which lets a scrolling parent pan around a zoomed-in page.
  return (
    <div ref={wrapRef} style={{ width: '100%', ...style }}>
      <div style={{ position: 'relative', width, height, overflow: 'hidden', background }}>
        <iframe
          ref={frameRef}
          title={title}
          sandbox="allow-same-origin"
          srcDoc={srcDoc}
          onLoad={measure}
          scrolling="no"
          style={{
            width: pageWidth,
            height: Math.max(contentHeight, 10),
            border: 'none',
            display: 'block',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  );
}
