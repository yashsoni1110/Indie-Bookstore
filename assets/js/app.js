'use strict';

const SPEAKERS_API    = 'https://jsonplaceholder.typicode.com/users';
const RSVP_API        = 'https://httpbin.org/post';
const TYPEWRITER_TEXT = 'A Signature Series Engagement';

let eventDate     = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
let eventName     = 'Signature Literary Gala';
let eventLocation = 'Portland Grand Ballroom';
let speakers      = [];
let timerInterval = null;
let lastFocused   = null;

document.addEventListener('DOMContentLoaded', init);

function init() {
  // Critical setup required for basic content & layout
  setupDarkMode();
  setupMobileNav();
  setupListeners();
  setupScrollEffects();
  fetchEventData();
  fetchSpeakers();

  // Defer decorative scripts until the browser is idle to keep the main thread unblocked
  if ('requestIdleCallback' in window) {
    requestIdleCallback(deferredInit);
  } else {
    setTimeout(deferredInit, 120);
  }
}

function deferredInit() {
  setupScheduleFilter();
  startTypewriter();
  updateSeatsDisplay();
  spawnParticles();
  trackCursor();
  animateStats();
}

// Event metadata

async function fetchEventData() {
  try {
    const res = await fetch('assets/data/event.json');
    if (!res.ok) throw new Error();

    const data = await res.json();
    eventName     = data.eventName || eventName;
    eventLocation = data.location  || eventLocation;

    const parsed = new Date(data.eventDate);
    if (!isNaN(parsed) && parsed > new Date()) {
      eventDate = parsed;
    } else {
      const y = new Date().getFullYear();
      eventDate = new Date(`${y}-12-31T19:00:00Z`);
      if (eventDate < new Date()) eventDate = new Date(`${y + 1}-12-31T19:00:00Z`);
    }
  } catch {
    // API unavailable — defaults are already set
  } finally {
    updatePageTitle();
    startCountdown();
  }
}

function updatePageTitle() {
  const title = document.getElementById('hero-title');
  const venue = document.getElementById('venue-name');
  if (title) title.textContent = `The Literary Nexus Presents: ${eventName}`;
  if (venue) venue.textContent = eventLocation;
}

// Event countdown

function startCountdown() {
  if (timerInterval) clearInterval(timerInterval);

  const tick = () => {
    const diff = eventDate - Date.now();

    if (diff <= 0) {
      clearInterval(timerInterval);
      const box = document.querySelector('.countdown-container');
      if (box) box.innerHTML = '<span class="countdown-label">The Event Has Commenced</span>';
      return;
    }

    setDigit('days-val',    Math.floor(diff / 86400000));
    setDigit('hours-val',   Math.floor((diff % 86400000) / 3600000));
    setDigit('minutes-val', Math.floor((diff % 3600000)  / 60000));
    setDigit('seconds-val', Math.floor((diff % 60000)    / 1000));
  };

  tick();
  timerInterval = setInterval(tick, 1000);
}

// plays a 3D flip when the digit changes
function setDigit(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = String(value).padStart(2, '0');
  if (el.textContent === text) return;

  el.classList.remove('flipping');
  void el.offsetWidth; // force reflow so animation replays
  el.textContent = text;
  el.classList.add('flipping');
  el.addEventListener('animationend', () => el.classList.remove('flipping'), { once: true });
}

// Speaker list

const SPEAKER_DETAILS = [
  {
    role:  'Pulitzer Prize Winning Novelist',
    bio:   'Author of the internationally acclaimed trilogy "Chamber of Echoes". Her works explore post-industrial history, ancestral memory, and ecological change. Iowa Writers\' Workshop alumnus.',
    books: ['Chamber of Echoes (2022)', 'Shadows of the Willamette (2019)', 'Under the Red Ochre (2015)']
  },
  {
    role:  'Poet Laureate & Essayist',
    bio:   'A major voice in lyric poetry and cultural criticism. His collections received the National Book Award and the Whiting Award. Contributing editor at Harper\'s Magazine.',
    books: ['Late Transmissions: Selected Poems (2024)', 'A Taxonomy of Silences (2021)', 'Cities Built on Sand (2017)']
  },
  {
    role:  'Historical Biographer',
    bio:   'Specialises in political and cultural figures of the early American West. Her biography of Abigail Scott Duniway has been praised as a definitive historical account.',
    books: ['Pioneering the Press (2023)', 'Fever of Gold: Oregon Trail Diaries (2020)']
  },
  {
    role:  'Suspense & Neo-Noir Writer',
    bio:   'A Portland native whose atmospheric detective fiction is set along the Columbia River. Translated into fourteen languages.',
    books: ['Fog Line (2023)', 'The St. Johns Mystery (2021)', 'Basement Drafts (2018)']
  },
  {
    role:  'Speculative Fiction Visionary',
    bio:   'Explores utopian futures and climate adaptation through a sociological lens. Known for building deeply researched speculative worlds.',
    books: ['The Green Meridian (2024)', 'Calculated Rain (2022)', 'Archipelagoes (2019)']
  }
];

async function fetchSpeakers() {
  showSkeletons(5);

  try {
    const res   = await fetch(SPEAKERS_API);
    if (!res.ok) throw new Error();
    const users = await res.json();

    speakers = users.slice(0, 5).map((user, i) => ({
      id:        user.id,
      name:      user.name,
      email:     user.email,
      tagline:   user.company.catchPhrase,
      workStyle: user.company.bs,
      role:      SPEAKER_DETAILS[i].role,
      bio:       SPEAKER_DETAILS[i].bio,
      books:     SPEAKER_DETAILS[i].books,
      photo:     `https://picsum.photos/id/${user.id}/200/200`
    }));
  } catch {
    // static fallback so the page never looks broken
    speakers = [
      {
        id: 1, name: 'Eleanor Vance', role: 'Pulitzer Prize Winning Novelist',
        tagline: 'Reading spaces with modern narratives.', workStyle: 'excavate archival fables',
        email: 'eleanor@literarynexus.com',
        bio:   'Eleanor Vance is a novelist known for reimagining historical diaries through complex characters.',
        books: ['The Ivory Arch (2023)'], photo: 'https://picsum.photos/id/64/200/200'
      },
      {
        id: 2, name: 'Marcus Aurel', role: 'Poet Laureate & Essayist',
        tagline: 'Synthesized lyrical streams mapping urban changes.', workStyle: 'harness cultural rhythms',
        email: 'marcus@literarynexus.com',
        bio:   'Marcus Aurel writes poetry on the architecture of human connection and city spaces.',
        books: ['Cobblestone Verses (2022)'], photo: 'https://picsum.photos/id/91/200/200'
      }
    ];
  }

  renderSpeakers();
}

function showSkeletons(count) {
  const grid = document.getElementById('authors-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = `
      <div class="skeleton-block skeleton-avatar"></div>
      <div class="skeleton-block skeleton-title"></div>
      <div class="skeleton-block skeleton-role"></div>
      <div class="skeleton-block skeleton-line"></div>
      <div class="skeleton-block skeleton-line short"></div>
      <div class="skeleton-block skeleton-btn"></div>
    `;
    grid.appendChild(card);
  }
}

function renderSpeakers() {
  const grid = document.getElementById('authors-grid');
  if (!grid) return;
  grid.innerHTML = '';

  speakers.forEach((sp, i) => {
    const card = document.createElement('article');
    card.className = `author-card reveal${i === 0 ? ' keynote-card' : ''}`;
    card.setAttribute('aria-label', `Speaker profile: ${sp.name}`);

    if (i === 0) {
      card.innerHTML = `
        <div class="author-img-container">
          <img class="author-img" src="${sp.photo}" alt="${sp.name}" loading="lazy" width="150" height="150">
        </div>
        <div class="author-info-container">
          <span class="keynote-badge">Keynote Speaker</span>
          <h3 class="author-name">${sp.name}</h3>
          <p class="author-role">${sp.role}</p>
          <p class="author-bio-snippet"><span class="quote-mark">&ldquo;</span>${sp.tagline}<span class="quote-mark">&rdquo;</span></p>
          <button type="button" class="btn-author-detail" data-id="${sp.id}">View Full Profile <span>&rarr;</span></button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="author-img-container">
          <img class="author-img" src="${sp.photo}" alt="${sp.name}" loading="lazy" width="120" height="120">
        </div>
        <h3 class="author-name">${sp.name}</h3>
        <p class="author-role">${sp.role}</p>
        <p class="author-bio-snippet"><span class="quote-mark">&ldquo;</span>${sp.tagline}<span class="quote-mark">&rdquo;</span></p>
        <button type="button" class="btn-author-detail" data-id="${sp.id}">View Full Profile <span>&rarr;</span></button>
      `;
    }

    grid.appendChild(card);
  });

  setupRevealObserver();
}

// Author details modal

function openAuthorModal(id) {
  const sp = speakers.find(s => s.id === parseInt(id));
  if (!sp) return;

  document.getElementById('modal-author-img').src     = sp.photo;
  document.getElementById('modal-author-img').alt     = sp.name;
  document.getElementById('modal-author-name').textContent = sp.name;
  document.getElementById('modal-author-meta').textContent = sp.role;

  const emailEl = document.getElementById('modal-author-email');
  emailEl.href        = `mailto:${sp.email}`;
  emailEl.textContent = sp.email;

  document.getElementById('modal-author-bio').innerHTML = `
    <p style="font-style:italic;color:var(--accent-gold);margin-bottom:12px;">"${sp.tagline}"</p>
    <p style="font-weight:600;margin-bottom:var(--spacing-sm);">Focus: ${sp.workStyle}</p>
    <p>${sp.bio}</p>
  `;

  const listEl = document.getElementById('modal-author-books');
  listEl.innerHTML = '';

  if (sp.books?.length) {
    const heading = document.createElement('h4');
    heading.className   = 'modal-author-books-title';
    heading.textContent = 'Selected Bibliography';

    const ul = document.createElement('ul');
    ul.className = 'modal-author-books-list';
    sp.books.forEach(b => {
      const li = document.createElement('li');
      li.textContent = b;
      ul.appendChild(li);
    });

    listEl.appendChild(heading);
    listEl.appendChild(ul);
  }

  openModal(document.getElementById('author-modal'));
}

// General modal controls

function openModal(el) {
  lastFocused = document.activeElement;
  el.classList.add('active');
  el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  el.querySelector('.modal-close-btn')?.focus();
}

function closeModal(el) {
  el.classList.remove('active');
  el.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocused?.focus();
  lastFocused = null;
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
}

// RSVP form submission

async function submitRSVP(e) {
  e.preventDefault();

  const nameField = document.getElementById('rsvp-name');
  const emailField = document.getElementById('rsvp-email');
  const affField   = document.getElementById('rsvp-affiliation');
  const submitBtn  = e.target.querySelector('button[type="submit"]');

  // clear any previous error banner
  e.target.querySelector('.form-error-banner')?.remove();

  const nameOk  = validateField(nameField);
  const emailOk = validateField(emailField);
  if (!nameOk || !emailOk) {
    (!nameOk ? nameField : emailField).focus();
    return;
  }

  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Confirming...';

  const payload = {
    name:        nameField.value.trim(),
    email:       emailField.value.trim(),
    affiliation: affField.value.trim() || 'Independent Scholar',
    event:       eventName,
    location:    eventLocation
  };

  try {
    const res = await fetch(RSVP_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    if (!res.ok) throw new Error();

    const ticketId = `LN-${Math.floor(100000 + Math.random() * 900000)}`;
    document.getElementById('success-attendee-name').textContent  = payload.name;
    document.getElementById('success-attendee-email').textContent = payload.email;
    document.getElementById('success-attendee-aff').textContent   = payload.affiliation;
    document.getElementById('success-reg-id').textContent         = ticketId;
    document.getElementById('success-event-location').textContent = eventLocation;

    e.target.reset();
    fireConfetti();
    openModal(document.getElementById('success-modal'));

  } catch {
    const banner = document.createElement('div');
    banner.className   = 'form-error-banner';
    banner.textContent = 'Something went wrong. Please check your connection and try again.';
    e.target.prepend(banner);
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = originalLabel;
  }
}

function validateField(field) {
  const group = field.closest('.form-group');
  const err   = group?.querySelector('.error-message');
  let msg = '';

  if (field.required && !field.value.trim()) {
    msg = 'This field is required.';
  } else if (field.type === 'email' && field.value.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) msg = 'Enter a valid email address.';
  }

  field.classList.toggle('invalid', !!msg);
  field.setAttribute('aria-invalid', String(!!msg));
  if (err) { err.textContent = msg; err.style.display = msg ? 'block' : 'none'; }
  return !msg;
}

// Calendar (.ics) generation

function downloadICS(title, desc, hour, min) {
  const base  = eventDate || new Date();
  const start = new Date(base);
  start.setHours(hour, min, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Literary Nexus//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@literarynexus.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Literary Nexus: ${title}`,
    `DESCRIPTION:${desc.replace(/,/g, '\\,')}`,
    'LOCATION:Portland Grand Ballroom\\, 421 SW Morrison St\\, Portland OR',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');

  const a  = document.createElement('a');
  a.href   = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `${title.replace(/\s+/g, '_')}.ics`;
  a.click();
  a.remove();
}

// Scrollspy & page reveal animations

function setupScrollEffects() {
  const heroBg = document.querySelector('.hero-bg');
  const header  = document.querySelector('.site-header');
  const backTop = document.getElementById('back-to-top');
  const progBar = document.getElementById('reading-progress');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    if (heroBg) heroBg.style.transform = `translateY(${y * 0.45}px)`;
    header?.classList.toggle('scrolled', y > 50);
    backTop?.classList.toggle('visible', y > 300);

    if (progBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progBar.style.width = max > 0 ? `${(y / max) * 100}%` : '0%';
    }
  }, { passive: true });
}

function setupRevealObserver() {
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('active'); revealObs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => revealObs.observe(el));

  // scrollspy
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.site-nav a[href^="#"]');

  const spyObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-20% 0px -60% 0px' });

  sections.forEach(s => spyObs.observe(s));
}

// Mobile overlay menu navigation

function setupMobileNav() {
  const hamburger = document.getElementById('hamburger-btn');
  const overlay   = document.getElementById('mobile-nav-overlay');
  const closeBtn  = document.getElementById('mobile-nav-close');
  if (!hamburger || !overlay) return;

  const openNav = () => {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  };

  const closeNav = () => {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    hamburger.focus();
  };

  hamburger.addEventListener('click', openNav);
  closeBtn?.addEventListener('click', closeNav);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeNav(); });
  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeNav();
  });
}

// Dark/Light theme toggle

function setupDarkMode() {
  const buttons = document.querySelectorAll('.dark-mode-toggle');
  if (!buttons.length) return;

  const moonIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const sunIcon   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

  const apply = isDark => {
    document.body.classList.toggle('dark-mode', isDark);
    buttons.forEach(btn => {
      btn.innerHTML = isDark ? sunIcon : moonIcon;
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  };

  apply(localStorage.getItem('darkMode') === 'true');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const next = !document.body.classList.contains('dark-mode');
      apply(next);
      localStorage.setItem('darkMode', next);
    });
  });
}

// Timeline category filtering

function setupScheduleFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const items   = document.querySelectorAll('.timeline-item[data-session]');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      items.forEach(item => {
        item.classList.toggle('filtered-out', filter !== 'all' && item.dataset.session !== filter);
      });
    });
  });
}

// Typewriter visual effect

function startTypewriter() {
  const el = document.getElementById('hero-subtitle');
  if (!el) return;

  el.textContent = '';
  el.classList.add('typewriter-active');

  let i = 0;
  const interval = setInterval(() => {
    el.textContent += TYPEWRITER_TEXT[i++];
    if (i >= TYPEWRITER_TEXT.length) {
      clearInterval(interval);
      setTimeout(() => el.classList.remove('typewriter-active'), 3000);
    }
  }, 65);
}

// Remaining seat counts animation

function updateSeatsDisplay() {
  const el = document.getElementById('seats-count');
  if (!el) return;
  const daysSinceJan = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
  el.textContent = Math.max(3, 47 - (daysSinceJan % 44));
}

// Background particle canvas system

function spawnParticles() {
  const container = document.getElementById('hero-particles');
  if (!container || window.innerWidth < 768) return;

  for (let i = 0; i < 22; i++) {
    const dot  = document.createElement('span');
    const size = 2 + Math.random() * 4;
    dot.className = 'hero-particle';
    dot.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      --p-opacity:${(0.08 + Math.random() * 0.35).toFixed(2)};
      animation-duration:${(5 + Math.random() * 8).toFixed(1)}s;
      animation-delay:${(Math.random() * -10).toFixed(1)}s
    `;
    container.appendChild(dot);
  }
}

// Interactive spotlight hover effect

function trackCursor() {
  // skip on touch-only devices
  if (window.matchMedia('(hover: none)').matches) return;

  document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
  }, { passive: true });
}

// Stats number counter animation

function animateStats() {
  const nums = document.querySelectorAll('.stat-number[data-target]');
  if (!nums.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);

      const target = parseInt(entry.target.dataset.target);
      const t0     = performance.now();

      const step = now => {
        const p = Math.min((now - t0) / 1200, 1);
        entry.target.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(step);
        else entry.target.textContent = target;
      };

      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
}

// RSVP canvas confetti effect

function fireConfetti() {
  const box    = document.createElement('div');
  box.className = 'confetti-container';
  document.body.appendChild(box);

  const colors = ['#A30000', '#D4AF37', '#F8F0E3', '#7a0000', '#bfa032', '#cc3333', '#e8c84a'];

  for (let i = 0; i < 85; i++) {
    const dot  = document.createElement('span');
    const size = 4 + Math.random() * 9;
    dot.className = 'confetti-piece';
    dot.style.cssText = `
      left:${Math.random() * 100}%;
      width:${size}px;
      height:${(size * (0.4 + Math.random() * 0.8)).toFixed(1)}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.45 ? '50%' : '2px'};
      animation-delay:${(Math.random() * 0.9).toFixed(2)}s;
      animation-duration:${(2.2 + Math.random() * 2).toFixed(1)}s
    `;
    box.appendChild(dot);
  }

  setTimeout(() => box.remove(), 5500);
}

// Toast notification handlers

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('exiting');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3600);
}

// Keyboard modal focus locking

function trapFocus(e, modal) {
  const focusable = modal.querySelectorAll('button, [href], input, [tabindex="0"]');
  if (!focusable.length) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    last.focus(); e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus(); e.preventDefault();
  }
}

// Page event bindings

function setupListeners() {
  // author cards → open profile modal
  document.getElementById('authors-grid')?.addEventListener('click', e => {
    const btn = e.target.closest('.btn-author-detail');
    if (btn) openAuthorModal(btn.dataset.id);
  });

  // close modals (close button or backdrop click)
  document.body.addEventListener('click', e => {
    if (e.target.closest('.modal-close-btn') || e.target.classList.contains('modal-overlay')) {
      closeAllModals();
    }
  });

  // Escape key + tab focus trap
  document.addEventListener('keydown', e => {
    const open = document.querySelector('.modal-overlay.active');
    if (!open) return;
    if (e.key === 'Escape') closeAllModals();
    if (e.key === 'Tab')    trapFocus(e, open);
  });

  // RSVP
  document.getElementById('rsvp-form')?.addEventListener('submit', submitRSVP);
  ['rsvp-name', 'rsvp-email'].forEach(id => {
    document.getElementById(id)?.addEventListener('blur', e => validateField(e.target));
  });

  // back to top
  document.getElementById('back-to-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Add to Calendar
  document.querySelector('.timeline-container')?.addEventListener('click', e => {
    const btn = e.target.closest('.btn-calendar');
    if (!btn) return;
    const desc = btn.closest('.timeline-content')?.querySelector('.timeline-desc')?.textContent || '';
    downloadICS(btn.dataset.title, desc, +btn.dataset.offsetHour, +btn.dataset.offsetMin);
  });

  // newsletter — replace form with confirmation message
  document.getElementById('newsletter-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('newsletter-email');
    if (!input?.value.trim()) return;

    const msg = document.createElement('p');
    msg.className = 'newsletter-success';
    msg.innerHTML = `✦ Subscribed! <em>${input.value.trim()}</em> will receive exclusive invitations.`;
    e.target.replaceWith(msg);
  });

  // print ticket
  document.getElementById('btn-print-ticket')?.addEventListener('click', () => window.print());

  // kick off reveal animations now that listeners are ready
  setupRevealObserver();
}
