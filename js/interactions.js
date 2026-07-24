/**
 * interactions.js — Magnetic buttons, text scramble, project expand/collapse,
 *                   stat counters, lazy video loading, FAQ accordion.
 * Exports: initInteractions()
 */

/* ── Text scramble ─────────────────────────────────────────────── */
const GLYPHS = '!@#$%^&*()_-=+[]{}|;:,.<>?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234';

export function scrambleText(el, finalText, duration = 800) {
  const frames  = Math.ceil(duration / 32);
  let   frame   = 0;
  el.setAttribute('data-original', finalText);

  function step() {
    frame++;
    const prog = frame / frames;
    el.textContent = [...finalText].map((ch, i) => {
      if (ch === ' ' || ch === '·' || ch === '—') return ch;
      if (i < Math.floor(prog * finalText.length)) return ch;
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }).join('');
    if (frame < frames) requestAnimationFrame(step);
    else el.textContent = finalText;
  }

  requestAnimationFrame(step);
}

/* ── Char splitter for headline animations ─────────────────────── */
export function splitChars(el) {
  const text = el.textContent;
  el.innerHTML = '';
  return [...text].map(ch => {
    const wrap = document.createElement('span');
    wrap.className = 'split-char-wrap';
    const inner = document.createElement('span');
    inner.className = 'split-char';
    inner.textContent = ch === ' ' ? ' ' : ch;
    wrap.appendChild(inner);
    el.appendChild(wrap);
    return inner;
  });
}

/* ── Magnetic effect ───────────────────────────────────────────── */
function initMagnetic() {
  const STRENGTH = 0.35;
  const RADIUS   = 100;

  document.querySelectorAll('[data-magnetic], .btn, .nav-logo').forEach(el => {
    let active = false;

    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = e.clientX - cx;
      const dy   = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < RADIUS) {
        active = true;
        gsap.to(el, {
          x: dx * STRENGTH,
          y: dy * STRENGTH,
          duration: 0.35,
          ease: 'power2.out',
        });
      }
    });

    el.addEventListener('mouseleave', () => {
      if (active) {
        active = false;
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.4)',
        });
      }
    });
  });
}

/* ── Project card expand / collapse ────────────────────────────── */
function initProjectCards() {
  const cards = [...document.querySelectorAll('.project-card')];

  cards.forEach(card => {
    const btn   = card.querySelector('.btn-read-more');
    const story = card.querySelector('.project-story');
    if (!btn || !story) return;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = card.classList.contains('expanded');

      /* Close all others */
      cards.forEach(c => {
        if (c !== card) collapse(c);
      });

      if (isOpen) {
        collapse(card);
      } else {
        expand(card);
      }
    });
  });

  function expand(card) {
    const story = card.querySelector('.project-story');
    const btn   = card.querySelector('.btn-read-more');
    const others = cards.filter(c => c !== card);

    story.classList.add('open');
    card.classList.add('expanded');
    if (btn) btn.querySelector('.arrow').textContent = '↑';

    gsap.to(others, { opacity: 0.4, scale: 0.99, duration: 0.4, ease: 'power2.out' });
    gsap.to(card,   { scale: 1.01, duration: 0.5, ease: 'power3.inOut' });
  }

  function collapse(card) {
    const story = card.querySelector('.project-story');
    const btn   = card.querySelector('.btn-read-more');

    story.classList.remove('open');
    card.classList.remove('expanded');
    if (btn) btn.querySelector('.arrow').textContent = '→';

    gsap.to(card, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.to(cards, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
  }
}

/* ── Stat counter ───────────────────────────────────────────────── */
export function animateCount(el, end, duration = 1.4) {
  const hasPlus = String(end).includes('+');
  const num = parseFloat(String(end).replace(/[^0-9.]/g, ''));
  const suffix = hasPlus ? '+' : '';

  gsap.fromTo({ val: 0 }, { val: 0 }, {
    val: num,
    duration,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = Math.round(this.targets()[0].val) + suffix;
    },
    onComplete() {
      el.textContent = num + suffix;
    }
  });
}

/* ── Lazy video via IntersectionObserver ────────────────────────── */
function initLazyVideos() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      video.querySelectorAll('source[data-src]').forEach(s => {
        s.src = s.dataset.src;
        delete s.dataset.src;
      });
      if (!video.src && video.dataset.src) {
        video.src = video.dataset.src;
        delete video.dataset.src;
      }
      video.load();
      if (video.hasAttribute('autoplay')) {
        video.play().catch(() => {});
      }
      observer.unobserve(video);
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('video.lazy').forEach(v => observer.observe(v));
}

/* ── FAQ accordion ──────────────────────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      /* Close all */
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

      if (!isOpen) item.classList.add('open');
    });
  });

  /* Open first by default */
  const first = document.querySelector('.faq-item');
  if (first) first.classList.add('open');
}

/* ── Mobile nav toggle ──────────────────────────────────────────── */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('nav-overlay');
  if (!hamburger || !overlay) return;

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    overlay.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    hamburger.setAttribute('aria-expanded', String(open));
  });

  overlay.querySelectorAll('.nav-overlay-link').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    });
  });
}

/* ── Recommendation Lightbox Modal ───────────────────────── */
export function initRecModal() {
  let modal = document.getElementById('rec-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rec-modal';
    modal.className = 'rec-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="rec-modal-content">
        <button class="rec-modal-close" aria-label="Close modal">&times;</button>
        <div class="rec-modal-img-wrap">
          <img src="" alt="Recommendation Letter" class="rec-modal-img" id="rec-modal-img">
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.rec-modal-close');
    closeBtn.addEventListener('click', closeRecModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeRecModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeRecModal();
      }
    });
  }
}

export function openRecModal(imgSrc, name, title) {
  const modal = document.getElementById('rec-modal');
  const img = document.getElementById('rec-modal-img');
  if (modal && img) {
    img.src = imgSrc;
    img.alt = `Recommendation letter from ${name} (${title})`;
    modal.classList.add('open');
  }
}

export function closeRecModal() {
  const modal = document.getElementById('rec-modal');
  if (modal) modal.classList.remove('open');
}

window.openRecModal = openRecModal;
window.closeRecModal = closeRecModal;

/* ── Master init ────────────────────────────────────────────────── */
export function initInteractions() {
  initMagnetic();
  initProjectCards();
  initLazyVideos();
  initFAQ();
  initMobileNav();
  initRecModal();
}
