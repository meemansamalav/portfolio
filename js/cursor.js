/**
 * cursor.js — Custom dual-cursor with lerp, state changes, click pulse, 8-dot trail.
 * Exports: initCursor()
 */

export function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  /* Skip on touch/mobile */
  if (window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(hover: none)').matches) {
    if (dot) dot.style.display = 'none';
    if (ring) ring.style.display = 'none';
    return;
  }

  if (!dot || !ring) return;

  /* ── State ─────────────────────────────────────────────────── */
  let mouse  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let dotPos = { x: mouse.x, y: mouse.y };
  let ringPos = { x: mouse.x, y: mouse.y };
  const LERP_DOT  = 0.88;
  const LERP_RING = 0.1;

  /* ── Trail dots ────────────────────────────────────────────── */
  const TRAIL_LEN = 8;
  const trail = [];
  for (let i = 0; i < TRAIL_LEN; i++) {
    const el = document.createElement('div');
    el.className = 'cursor-trail';
    document.body.appendChild(el);
    trail.push({ el, x: mouse.x, y: mouse.y });
  }

  /* ── Mouse move ────────────────────────────────────────────── */
  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  /* ── Click pulse ───────────────────────────────────────────── */
  document.addEventListener('mousedown', () => {
    gsap.to([dot, ring], {
      scale: 0.7,
      duration: 0.1,
      ease: 'power2.in',
      onComplete() {
        gsap.to([dot, ring], { scale: 1, duration: 0.35, ease: 'elastic.out(1,0.4)' });
      }
    });
  });

  /* ── Interactive element detection ────────────────────────── */
  const interactiveSelectors =
    'a, button, [data-magnetic], .btn, .faq-q, .project-card, .nav-logo, .nav-link, .contact-email';
  const textSelectors = 'p, h1, h2, h3, h4, li, span, blockquote';

  document.querySelectorAll(interactiveSelectors).forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.classList.add('hovered');
      ring.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      dot.classList.remove('hovered');
      ring.classList.remove('hovered');
    });
  });

  document.querySelectorAll(textSelectors).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('text-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('text-hover'));
  });

  /* ── Lerp animation loop ───────────────────────────────────── */
  let frameId;

  function tick() {
    dotPos.x  += (mouse.x - dotPos.x)  * LERP_DOT;
    dotPos.y  += (mouse.y - dotPos.y)  * LERP_DOT;
    ringPos.x += (mouse.x - ringPos.x) * LERP_RING;
    ringPos.y += (mouse.y - ringPos.y) * LERP_RING;

    dot.style.transform  = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;

    /* Trail: shift history back, newest = current dot pos */
    for (let i = TRAIL_LEN - 1; i > 0; i--) {
      trail[i].x = trail[i - 1].x;
      trail[i].y = trail[i - 1].y;
    }
    trail[0].x = dotPos.x;
    trail[0].y = dotPos.y;

    trail.forEach((t, i) => {
      const alpha = (1 - i / TRAIL_LEN) * 0.35;
      const scale = 1 - i / TRAIL_LEN * 0.7;
      t.el.style.transform = `translate(${t.x}px,${t.y}px) translate(-50%,-50%) scale(${scale})`;
      t.el.style.opacity   = alpha;
    });

    frameId = requestAnimationFrame(tick);
  }

  frameId = requestAnimationFrame(tick);

  /* ── Cleanup on destroy ────────────────────────────────────── */
  window._cursorDestroy = () => {
    cancelAnimationFrame(frameId);
    trail.forEach(t => t.el.remove());
  };
}
