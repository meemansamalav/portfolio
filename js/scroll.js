/**
 * scroll.js — Lenis smooth scroll + all GSAP ScrollTrigger animations.
 * - Lenis ↔ ScrollTrigger sync
 * - Hero char entrance + velocity skew
 * - Section entrance (lines, scales, slides)
 * - Horizontal skills scroll (pinned)
 * - Timeline SVG draw
 * - Stat counters
 * - Scramble text on viewport entry
 * Exports: initScroll(options?)
 */

import { splitChars, scrambleText, animateCount } from './interactions.js';

export function initScroll(options = {}) {
  /* ── Lenis ─────────────────────────────────────────────────── */
  const hasLenis = typeof Lenis !== 'undefined';
  let lenis = null;

  if (hasLenis) {
    lenis = new Lenis({
      duration:     1.4,
      easing:       t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth:       true,
      smoothTouch:  false,
    });

    /* Feed into GSAP ticker so ScrollTrigger stays in sync */
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', ScrollTrigger.update);
  }

  /* ── Register ScrollTrigger ─────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  /* ── Nav shrink on scroll ───────────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    ScrollTrigger.create({
      start: 'top -80px',
      onEnter:     () => nav.classList.add('scrolled'),
      onLeaveBack: () => nav.classList.remove('scrolled'),
    });
  }

  /* ── Hero char animation (runs right after preloader) ──────── */
  _animateHero();

  /* ── Hero velocity skew via Lenis ───────────────────────────── */
  if (lenis) {
    const heroContent = document.querySelector('.hero .container');
    if (heroContent) {
      lenis.on('scroll', ({ velocity }) => {
        gsap.to(heroContent, {
          skewY:    velocity * 0.35,
          duration: 0.5,
          ease:     'power3.out',
        });
      });
    }
  }

  if (typeof options.onScrollProgress === 'function') {
    ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => options.onScrollProgress(self.progress),
    });
  }

  /* ── Manifesto text ─────────────────────────────────────────── */
  _animateLines('.manifesto-body', 0);
  _animateLines('.manifesto-coda', 0.15);

  /* ── Section eyebrow scramble ───────────────────────────────── */
  document.querySelectorAll('.scramble-text').forEach(el => {
    const original = el.textContent;
    ScrollTrigger.create({
      trigger: el,
      start:   'top 90%',
      once:    true,
      onEnter: () => scrambleText(el, original, 800),
    });
  });

  /* ── Project cards entrance ─────────────────────────────────── */
  document.querySelectorAll('.project-card').forEach((card, i) => {
    const fromLeft = i % 2 === 0;
    gsap.fromTo(card,
      { opacity: 0, x: fromLeft ? -60 : 60, rotation: fromLeft ? -3 : 3 },
      {
        opacity: 1, x: 0, rotation: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 82%', once: true },
      }
    );
  });

  /* ── Skills horizontal scroll (pinned) ──────────────────────── */
  _initHorizontalScroll();

  /* ── Timeline SVG + entries ─────────────────────────────────── */
  _initTimeline();

  /* ── Moments gallery ────────────────────────────────────────── */
  gsap.utils.toArray('.moment-item').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, scale: 0.94 },
      {
        opacity: 1,
        scale:   1,
        duration: 0.7,
        ease:    'power3.out',
        delay:   (i % 3) * 0.1,
        clearProps: 'transform',
        scrollTrigger: { trigger: item, start: 'top 88%', once: true },
      });
  });

  /* ── Recommendations ────────────────────────────────────────── */
  gsap.utils.toArray('.rec-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      duration: 0.7,
      ease:    'power3.out',
      delay:   (i % 3) * 0.1,
      scrollTrigger: { trigger: card, start: 'top 88%', once: true },
    });
  });

  /* ── Stats count-up ─────────────────────────────────────────── */
  document.querySelectorAll('[data-count]').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start:   'top 85%',
      once:    true,
      onEnter: () => animateCount(el, el.dataset.count),
    });
  });

  /* ── Section titles fade-up ─────────────────────────────────── */
  document.querySelectorAll('.section-title, .t-display').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }
    );
  });

  /* ── Scroll indicator fade-in ───────────────────────────────── */
  const scrollInd = document.querySelector('.scroll-indicator');
  if (scrollInd) {
    gsap.to(scrollInd, { opacity: 1, duration: 1, delay: 3.5, ease: 'power2.out' });
  }
}

/* ── Hero entrance ─────────────────────────────────────────────── */
function _animateHero() {
  const headline = document.querySelector('.hero-headline');
  if (!headline) return;

  /* Split headline children spans into chars */
  const spans = headline.querySelectorAll('.hl-word');
  let allChars = [];
  spans.forEach(span => {
    allChars = allChars.concat(splitChars(span));
  });

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  /* Chars: up from below with rotation */
  tl.fromTo(allChars,
    { yPercent: 120, rotation: 8, opacity: 0 },
    { yPercent: 0, rotation: 0, opacity: 1, duration: 1, stagger: 0.025 },
    0
  );

  /* Sub, desc, CTAs, badge cascade after chars */
  tl.fromTo('.hero-sub',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6 },
    0.6
  );
  tl.fromTo('.hero-desc',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6 },
    0.75
  );
  tl.fromTo('.hero-ctas',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6 },
    0.9
  );
  tl.fromTo('.availability-badge',
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.5 },
    1.05
  );
}

/* ── Line-by-line wipe animation helper ────────────────────────── */
function _animateLines(selector, delayOffset = 0) {
  const el = document.querySelector(selector);
  if (!el) return;

  gsap.to(el, {
    opacity: 1,
    y:       0,
    duration: 0.8,
    ease:    'power3.out',
    delay:   delayOffset,
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  });
}

/* ── Horizontal skills scroll ──────────────────────────────────── */
function _initHorizontalScroll() {
  const section = document.querySelector('.skills-section');
  const track   = document.querySelector('.skills-track');
  if (!section || !track) return;

  /* Delay until layout is calculated */
  ScrollTrigger.create({
    trigger: section,
    pin:     true,
    start:   'top top',
    end:     () => `+=${track.scrollWidth - window.innerWidth + 200}`,
    scrub:   1,
    invalidateOnRefresh: true,
    animation: gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth + 100),
      ease: 'none',
    }),
  });
}

/* ── Timeline ──────────────────────────────────────────────────── */
function _initTimeline() {
  const line    = document.querySelector('.timeline-path');
  const entries = document.querySelectorAll('.timeline-entry');

  if (line) {
    const len = line.getTotalLength?.() ?? 1000;
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });

    gsap.to(line, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline',
        start:   'top 70%',
        end:     'bottom 30%',
        scrub:   2,
      },
    });
  }

  entries.forEach((entry, i) => {
    gsap.to(entry, {
      opacity: 1,
      x:       0,
      duration: 0.7,
      ease:    'power3.out',
      delay:   i * 0.05,
      scrollTrigger: { trigger: entry, start: 'top 85%', once: true },
    });
  });
}
