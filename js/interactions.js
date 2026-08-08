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

/* ── Project card modal pop-up with tabbed reader ─────────────── */
function initProjectCards() {
  const cards = document.querySelectorAll('.project-card');
  const modal = document.getElementById('projectModal');
  const modalContainer = modal?.querySelector('.project-modal-container');
  const modalBackdrop = document.getElementById('projectModalBackdrop');
  const modalClose = document.getElementById('projectModalClose');
  const modalCompany = document.getElementById('modalCompany');
  const modalTitle = document.getElementById('modalTitle');
  const modalRole = document.getElementById('modalRole');
  const modalTabs = document.getElementById('modalTabs');
  const modalContentArea = document.getElementById('modalContentArea');
  const modalBody = document.getElementById('modalBody');

  if (!cards.length) return;

  // Trackpad / Touchpad gesture isolation
  if (modalContainer) {
    modalContainer.addEventListener('wheel', e => e.stopPropagation());
    modalContainer.addEventListener('touchmove', e => e.stopPropagation());
  }

  cards.forEach(card => {
    const btn = card.querySelector('.btn-read-more');
    if (!btn) return;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(card);
    });
  });

  function openModal(card) {
    if (!modal || !modalTabs || !modalContentArea) return;

    const company = card.querySelector('.project-company')?.textContent || '';
    const title = card.querySelector('.project-title')?.textContent || '';
    const role = card.querySelector('.project-role')?.innerHTML || '';
    const storyBlocks = card.querySelectorAll('.story-block');

    if (modalCompany) modalCompany.textContent = company;
    if (modalTitle) modalTitle.textContent = title;
    if (modalRole) modalRole.innerHTML = role;

    // Reset tabs and content
    modalTabs.innerHTML = '';
    modalContentArea.innerHTML = '';
    if (modalBody) modalBody.scrollTop = 0;

    const sections = [];
    storyBlocks.forEach(block => {
      const heading = block.querySelector('h4')?.textContent || 'Section';
      const textHtml = block.querySelector('p')?.innerHTML || '';
      sections.push({ heading, textHtml });
    });

    // Create Navigation Pills for each section
    sections.forEach((sec, idx) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `modal-tab-pill ${idx === 0 ? 'active' : ''}`;
      pill.textContent = sec.heading;
      pill.setAttribute('role', 'tab');
      pill.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');

      pill.addEventListener('click', () => {
        activateTab(idx);
      });

      modalTabs.appendChild(pill);
    });

    // Add "Full Story" pill tab
    const fullPill = document.createElement('button');
    fullPill.type = 'button';
    fullPill.className = 'modal-tab-pill';
    fullPill.textContent = 'Full Story';
    fullPill.setAttribute('role', 'tab');
    fullPill.addEventListener('click', () => {
      activateFullStory();
    });
    modalTabs.appendChild(fullPill);

    function activateTab(index) {
      const pills = modalTabs.querySelectorAll('.modal-tab-pill');
      pills.forEach((p, i) => {
        const isActive = i === index;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      const targetSec = sections[index];
      if (!targetSec) return;

      modalContentArea.innerHTML = `
        <div class="modal-story-section">
          <div class="modal-section-title">${targetSec.heading}</div>
          <div class="modal-section-text">${targetSec.textHtml}</div>
        </div>
      `;

      if (modalBody) modalBody.scrollTop = 0;
    }

    function activateFullStory() {
      const pills = modalTabs.querySelectorAll('.modal-tab-pill');
      pills.forEach((p, i) => {
        const isActive = i === sections.length;
        p.classList.toggle('active', isActive);
        p.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      let fullHtml = '';
      sections.forEach(sec => {
        fullHtml += `
          <div class="modal-story-block">
            <div class="modal-section-title">${sec.heading}</div>
            <div class="modal-section-text">${sec.textHtml}</div>
          </div>
        `;
      });

      modalContentArea.innerHTML = `
        <div class="modal-story-section">
          ${fullHtml}
        </div>
      `;

      if (modalBody) modalBody.scrollTop = 0;
    }

    // Default to first tab (The Problem)
    activateTab(0);

    // Pause Lenis smooth scroll & Lock background
    if (window.lenis) window.lenis.stop();
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // Show modal popup
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');

    // Resume Lenis smooth scroll & Unlock background
    if (window.lenis) window.lenis.start();
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
      closeModal();
    }
  });
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
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = item.classList.contains('open');

      /* Close all items */
      items.forEach(other => {
        other.classList.remove('open');
        const otherBtn = other.querySelector('.faq-q');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      /* Toggle current item */
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Open first by default */
  const first = items[0];
  if (first) {
    first.classList.add('open');
    const firstBtn = first.querySelector('.faq-q');
    if (firstBtn) firstBtn.setAttribute('aria-expanded', 'true');
  }
}

/* ── Mobile nav toggle ──────────────────────────────────────────── */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('nav-overlay');
  const closeBtn  = document.getElementById('nav-overlay-close');
  if (!hamburger || !overlay) return;

  function closeNav() {
    hamburger.classList.remove('open');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function openNav() {
    hamburger.classList.add('open');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('open');
    if (isOpen) closeNav();
    else openNav();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeNav);
  }

  overlay.querySelectorAll('.nav-overlay-link').forEach(a => {
    a.addEventListener('click', closeNav);
  });
}



/* ── Smooth scroll for nav anchor links ────────────────────────── */
function initAnchorSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        if (window.lenis) {
          window.lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

/* ── 3D Cascading Ellipse Slider for Recommendations ───────────── */
function initRecs3D() {
  const stage = document.getElementById('recsStage');
  if (!stage) return;

  const cards = Array.from(stage.querySelectorAll('.rec-card-3d'));
  const dots = Array.from(document.querySelectorAll('.recs-dot'));
  const prevBtn = document.getElementById('recsPrev');
  const nextBtn = document.getElementById('recsNext');

  const total = cards.length;
  if (!total) return;

  let activeIndex = 0;
  let autoTimer = null;
  const AUTO_INTERVAL = 3500;

  function updatePositions() {
    cards.forEach((card, i) => {
      let offset = (i - activeIndex) % total;
      if (offset < 0) offset += total;
      card.className = `rec-card rec-card-3d pos-${offset}`;
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  }

  function goToNext() {
    activeIndex = (activeIndex + 1) % total;
    updatePositions();
  }

  function goToPrev() {
    activeIndex = (activeIndex - 1 + total) % total;
    updatePositions();
  }

  function goToIndex(index) {
    activeIndex = index % total;
    updatePositions();
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoTimer = setInterval(goToNext, AUTO_INTERVAL);
  }

  function stopAutoPlay() {
    if (autoTimer) clearInterval(autoTimer);
  }

  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (activeIndex !== index) {
        goToIndex(index);
        startAutoPlay();
      }
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToNext();
      startAutoPlay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToPrev();
      startAutoPlay();
    });
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToIndex(index);
      startAutoPlay();
    });
  });

  stage.addEventListener('mouseenter', stopAutoPlay);
  stage.addEventListener('mouseleave', startAutoPlay);

  let touchStartX = 0;
  stage.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });

  stage.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) goToNext();
      else goToPrev();
    }
    startAutoPlay();
  }, { passive: true });

  updatePositions();
  startAutoPlay();
}

/* ── Master init ────────────────────────────────────────────────── */
export function initInteractions() {
  initMagnetic();
  initProjectCards();
  initLazyVideos();
  initFAQ();
  initMobileNav();
  initAnchorSmoothScroll();
  initRecs3D();
}
