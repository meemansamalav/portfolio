/**
 * main.js — Orchestrates the full init sequence.
 * Load order: preloader → scroll → cursor → interactions
 *
 * Note: GSAP SplitText (Club) is not on cdnjs; we use our own splitChars()
 * in interactions.js instead. ScrollTrigger IS free and loaded via CDN.
 */

import { initLoader }       from './loader.js';
import { initGalaxyBackground } from './galaxy-bg.js';
import { initScroll }       from './scroll.js';
import { initCursor }       from './cursor.js';
import { initInteractions } from './interactions.js';

async function init() {
  /* 1 ── Preloader (returns when animation + assets done) */
  await initLoader();

  /* 2 ── Ambient galaxy background */
  const galaxyBg = initGalaxyBackground();

  /* 3 ── Scroll + all GSAP animations */
  initScroll({
    onScrollProgress: progress => galaxyBg?.setScrollProgress(progress),
  });

  /* 4 ── Custom cursor (desktop only, guarded internally) */
  initCursor();

  /* 5 ── Interactions: magnetic, scramble, FAQ, project expand, lazy video */
  initInteractions();
}

init().catch(err => console.error('[portfolio] init error', err));
