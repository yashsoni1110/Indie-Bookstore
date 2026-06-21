((window, document) => {
  'use strict';

  const IS_DEV = ['localhost', '127.0.0.1', '10.81.49.217'].includes(window.location.hostname);

  const CONFIG = {
    fallbackEventDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    endpoints: {
      event: 'https://api.mocki.io/v2/01d0a1b0-2f3b-4c4d-9e0a-1b0c2d3e4f5a',
      speakers: 'https://jsonplaceholder.typicode.com/users',
      rsvp: 'https://httpbin.org/post'
    }
  };

  const UI = {
    heroTitle: document.getElementById('hero-title'),
    heroSubtitle: document.getElementById('hero-subtitle'),
    timer: {
      days: document.getElementById('days-val'),
      hours: document.getElementById('hours-val'),
      mins: document.getElementById('minutes-val'),
      secs: document.getElementById('seconds-val')
    },
    speakersGrid: document.getElementById('authors-grid'),
    rsvp: {
      form: document.getElementById('rsvp-form'),
      name: document.getElementById('rsvp-name'),
      email: document.getElementById('rsvp-email'),
      aff: document.getElementById('rsvp-affiliation'),
      submitBtn: document.querySelector('#rsvp-form button[type="submit"]')
    },
    venue: {
      name: document.getElementById('venue-name'),
      addr: document.getElementById('venue-address')
    },
    modals: {
      profile: document.getElementById('author-modal'),
      success: document.getElementById('success-modal')
    },
    backToTop: document.getElementById('back-to-top'),
    header: document.querySelector('.site-header')
  };

  const state = {
    eventName: 'Signature Literary Series',
    eventDate: null,
    eventLocation: 'Portland Grand Ballroom',
    speakers: [],
    lastActiveElement: null // track for focus return on modal close
  };

  async function loadEventMetadata() {
    try {
      if (IS_DEV) console.info('[Platform] Contacting metadata server...');

      const res = await fetch(CONFIG.endpoints.event);
      if (!res.ok) throw new Error(`Server returned status code ${res.status}`);

      const payload = await res.json();
      state.eventName = payload.eventName || 'Literary Nexus Gala';
      state.eventLocation = payload.location || 'Portland Grand Ballroom';

      let parsedTarget = new Date(payload.eventDate);
      const currentTime = new Date();
      // Shift date forward to prevent expired timer in local preview
      if (isNaN(parsedTarget.getTime()) || parsedTarget < currentTime) {
        const currentYear = currentTime.getFullYear();
        parsedTarget = new Date(`${currentYear}-12-31T19:00:00Z`);

        if (parsedTarget < currentTime) {
          parsedTarget = new Date(`${currentYear + 1}-12-31T19:00:00Z`);
        }
      }
      state.eventDate = parsedTarget;

      syncEventDOM();
    } catch (err) {
      console.error('[Platform] Metadata sync failed. Initiating fallback configurations.', err);

      state.eventName = 'Signature Literary Gala';
      state.eventLocation = 'Portland Grand Ballroom';
      state.eventDate = CONFIG.fallbackEventDate;
      syncEventDOM();
    }
  }

  function syncEventDOM() {
    if (UI.heroTitle) UI.heroTitle.textContent = `The Literary Nexus Presents: ${state.eventName}`;
    if (UI.venue.name) UI.venue.name.textContent = state.eventLocation;

    startTimerLoop();
  }

  async function loadSpeakers() {
    try {
      const res = await fetch(CONFIG.endpoints.speakers);
      if (!res.ok) throw new Error(`HTTP status: ${res.status}`);

      const users = await res.json();

      const rawData = users.slice(0, 5);

      const speakerMetas = [
        {
          role: 'Pulitzer Prize Winning Novelist',
          bio: 'Author of the internationally acclaimed trilogy "Chamber of Echoes". Her works explore the intersections of post-industrial history, ancestral memory, and ecological change. Iowa Writers\' Workshop alumnus.',
          books: ['Chamber of Echoes (2022)', 'Shadows of the Willamette (2019)', 'Under the Red Ochre (2015)']
        },
        {
          role: 'Poet Laureate & Essayist',
          bio: 'A major contemporary voice in lyric poetry and cultural criticism. His collections have received the National Book Award and the Whiting Award. Contributing editor at Harper\'s Magazine.',
          books: ['Late Transmissions: Selected Poems (2024)', 'A Taxonomy of Silences (2021)', 'Cities Built on Sand (2017)']
        },
        {
          role: 'Historical Biographer',
          bio: 'Specializes in the political and cultural figures of the early American West. Her recent biography of Abigail Scott Duniway has been praised as a definitive historical account.',
          books: ['Pioneering the Press (2023)', 'Fever of Gold: Oregon Trail Diaries (2020)']
        },
        {
          role: 'Suspense & Neo-Noir Writer',
          bio: 'A native Portland writer whose gritty, atmospheric detective fiction is set along the misty shores of the Columbia River. Translated into fourteen languages.',
          books: ['Fog Line (2023)', 'The St. Johns Mystery (2021)', 'Basement Drafts (2018)']
        },
        {
          role: 'Speculative Fiction Visionary',
          bio: 'Explores utopian futures and climate adaptation through a distinct sociological lens. Known for building lush, deeply researched speculative worlds.',
          books: ['The Green Meridian (2024)', 'Calculated Rain (2022)', 'Archipelagoes (2019)']
        }
      ];

      state.speakers = rawData.map((user, i) => {
        const metadata = speakerMetas[i % speakerMetas.length];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tagline: user.company.catchPhrase,
          expandedBio: user.company.bs,
          role: metadata.role,
          longBio: metadata.bio,
          books: metadata.books,
          avatar: `https://picsum.photos/id/${user.id}/200/200`
        };
      });

      renderSpeakersGrid();
    } catch (err) {
      console.error('[Platform] Speaker sync failed. Loading static backup profiles.', err);
      loadStaticSpeakers();
    }
  }

  function renderSpeakersGrid() {
    if (!UI.speakersGrid) return;
    UI.speakersGrid.innerHTML = '';

    state.speakers.forEach((sp, idx) => {
      const card = document.createElement('article');
      card.className = `author-card reveal ${idx === 0 ? 'keynote-card' : ''}`;
      card.setAttribute('aria-label', `Speaker profile: ${sp.name}`);

      if (idx === 0) {
        card.innerHTML = `
          <div class="author-img-container">
            <img class="author-img" src="${sp.avatar}" alt="${sp.name}" loading="lazy" width="150" height="150">
          </div>
          <div class="author-info-container">
            <span class="keynote-badge">Keynote Speaker</span>
            <h3 class="author-name" style="font-size: 1.8rem; margin-bottom: 4px;">${sp.name}</h3>
            <p class="author-role" style="font-size: 0.9rem; margin-bottom: 8px;">${sp.role}</p>
            <p class="author-bio-snippet" style="font-size: 1.05rem;"><span class="quote-mark">&ldquo;</span>${sp.tagline}<span class="quote-mark">&rdquo;</span></p>
            <button type="button" class="btn-author-detail" data-id="${sp.id}">
              View Full Profile <span>&rarr;</span>
            </button>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="author-img-container">
            <img class="author-img" src="${sp.avatar}" alt="${sp.name}" loading="lazy" width="120" height="120">
          </div>
          <h3 class="author-name">${sp.name}</h3>
          <p class="author-role">${sp.role}</p>
          <p class="author-bio-snippet"><span class="quote-mark">&ldquo;</span>${sp.tagline}<span class="quote-mark">&rdquo;</span></p>
          <button type="button" class="btn-author-detail" data-id="${sp.id}">
            View Full Profile <span>&rarr;</span>
          </button>
        `;
      }
      UI.speakersGrid.appendChild(card);
    });

    initIntersectionObservers();
  }

  function loadStaticSpeakers() {
    state.speakers = [
      { id: 1, name: 'Eleanor Vance', role: 'Pulitzer Prize Winning Novelist', tagline: 'Reading spaces with modern narratives.', expandedBio: 'excavate archival fables', email: 'eleanor@literarynexus.com', longBio: 'Eleanor Vance is a novelist known for reimagining historical diaries through complex characters.', books: ['The Ivory Arch (2023)'], avatar: 'https://picsum.photos/id/64/200/200' },
      { id: 2, name: 'Marcus Aurel', role: 'Poet Laureate & Essayist', tagline: 'Synthesized lyrical streams mapping urban changes.', expandedBio: 'harness cultural rhythms', email: 'marcus@literarynexus.com', longBio: 'Marcus Aurel writes poetry focusing on the architecture of human connection and city spaces.', books: ['Cobblestone Verses (2022)'], avatar: 'https://picsum.photos/id/91/200/200' }
    ];
    renderSpeakersGrid();
  }

  let timerTicker;

  function startTimerLoop() {
    if (!state.eventDate) return;
    if (timerTicker) clearInterval(timerTicker);

    const checkDate = () => {
      const distance = state.eventDate.getTime() - Date.now();

      if (distance < 0) {
        clearInterval(timerTicker);
        const box = document.querySelector('.countdown-container');
        if (box) {
          box.innerHTML = '<div class="countdown-label" style="font-size: 1.1rem; color: var(--accent-gold);">The Event Has Commenced</div>';
        }
        return;
      }

      const days = Math.floor(distance / 86400000);
      const hours = Math.floor((distance % 86400000) / 3600000);
      const mins = Math.floor((distance % 3600000) / 60000);
      const secs = Math.floor((distance % 60000) / 1000);

      if (UI.timer.days) UI.timer.days.textContent = String(days).padStart(2, '0');
      if (UI.timer.hours) UI.timer.hours.textContent = String(hours).padStart(2, '0');
      if (UI.timer.mins) UI.timer.mins.textContent = String(mins).padStart(2, '0');
      if (UI.timer.secs) UI.timer.secs.textContent = String(secs).padStart(2, '0');
    };

    checkDate();
    timerTicker = setInterval(checkDate, 1000);
  }

  function trapModalFocus(e, modalNode) {
    const focusables = modalNode.querySelectorAll('button, [href], input, [tabindex="0"]');
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  }

  function toggleModal(modalNode, shouldOpen) {
    if (shouldOpen) {
      state.lastActiveElement = document.activeElement;
      modalNode.classList.add('active');
      modalNode.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      const closeTrigger = modalNode.querySelector('.modal-close-btn');
      if (closeTrigger) closeTrigger.focus();
    } else {
      modalNode.classList.remove('active');
      modalNode.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (state.lastActiveElement) {
        state.lastActiveElement.focus();
        state.lastActiveElement = null;
      }
    }
  }

  function handleProfileOverlay(id) {
    const sp = state.speakers.find(s => s.id === parseInt(id, 10));
    if (!sp) return;

    const imgNode = document.getElementById('modal-author-img');
    const nameNode = document.getElementById('modal-author-name');
    const metaNode = document.getElementById('modal-author-meta');
    const mailNode = document.getElementById('modal-author-email');
    const bioNode = document.getElementById('modal-author-bio');
    const listNode = document.getElementById('modal-author-books');

    if (imgNode) { imgNode.src = sp.avatar; imgNode.alt = sp.name; }
    if (nameNode) nameNode.textContent = sp.name;
    if (metaNode) metaNode.textContent = sp.role;
    if (mailNode) { mailNode.href = `mailto:${sp.email}`; mailNode.textContent = sp.email; }

    if (bioNode) {
      bioNode.innerHTML = `
        <p style="font-style: italic; color: var(--accent-gold); margin-bottom: 12px;">Creative Thesis: "${sp.tagline}"</p>
        <p style="font-weight: 600; margin-bottom: var(--spacing-sm);">Core Competence: ${sp.expandedBio}</p>
        <p>${sp.longBio}</p>
      `;
    }

    if (listNode) {
      listNode.innerHTML = '';
      if (sp.books && sp.books.length > 0) {
        const h = document.createElement('h4');
        h.className = 'modal-author-books-title';
        h.textContent = 'Selected Bibliography';
        listNode.appendChild(h);

        const ul = document.createElement('ul');
        ul.className = 'modal-author-books-list';
        sp.books.forEach(b => {
          const li = document.createElement('li');
          li.textContent = b;
          ul.appendChild(li);
        });
        listNode.appendChild(ul);
      }
    }

    toggleModal(UI.modals.profile, true);
  }

  function checkInput(field) {
    const grp = field.closest('.form-group');
    const err = grp.querySelector('.error-message');
    let ok = true;
    let msg = '';

    if (field.hasAttribute('required') && !field.value.trim()) {
      ok = false;
      msg = 'This credential is required.';
    } else if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value.trim())) {
        ok = false;
        msg = 'Invalid professional email format.';
      }
    }

    if (!ok) {
      field.classList.add('invalid');
      field.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = msg; err.style.display = 'block'; }
    } else {
      field.classList.remove('invalid');
      field.setAttribute('aria-invalid', 'false');
      if (err) err.style.display = 'none';
    }

    return ok;
  }

  async function transmitRsvp(e) {
    e.preventDefault();

    const nameOk = checkInput(UI.rsvp.name);
    const emailOk = checkInput(UI.rsvp.email);

    if (!nameOk || !emailOk) {
      const target = !nameOk ? UI.rsvp.name : UI.rsvp.email;
      target.focus();
      return;
    }

    const initialText = UI.rsvp.submitBtn.textContent;
    UI.rsvp.submitBtn.disabled = true;
    UI.rsvp.submitBtn.textContent = 'Encrypting Credentials...';

    const vals = {
      name: UI.rsvp.name.value.trim(),
      email: UI.rsvp.email.value.trim(),
      affiliation: UI.rsvp.aff.value.trim() || 'Independent Scholar'
    };

    try {
      const res = await fetch(CONFIG.endpoints.rsvp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vals, event: state.eventName, loc: state.eventLocation })
      });

      if (!res.ok) throw new Error(`Server returned code ${res.status}`);

      const debugResult = await res.json();
      if (IS_DEV) console.info('[RSVP] Transmission payload captured:', debugResult);

      const confirmNum = Math.floor(100000 + Math.random() * 900000);

      document.getElementById('success-attendee-name').textContent = vals.name;
      document.getElementById('success-attendee-email').textContent = vals.email;
      document.getElementById('success-attendee-aff').textContent = vals.affiliation;
      document.getElementById('success-reg-id').textContent = `LN-${confirmNum}`;
      document.getElementById('success-event-location').textContent = state.eventLocation;

      UI.rsvp.form.reset();
      toggleModal(UI.modals.success, true);
    } catch (err) {
      console.error('[RSVP] Transmission error.', err);
      alert('Unable to secure reservation slot. Please verify your connection and try again.');
    } finally {
      UI.rsvp.submitBtn.disabled = false;
      UI.rsvp.submitBtn.textContent = initialText;
    }
  }

  function compileICSAttachment(title, desc, hr, min) {
    const day = state.eventDate || new Date();

    const start = new Date(day);
    start.setHours(hr, min, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const pad = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const raw = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The Literary Nexus//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@literarynexus.com`,
      `DTSTAMP:${pad(new Date())}`,
      `DTSTART:${pad(start)}`,
      `DTEND:${pad(end)}`,
      `SUMMARY:The Literary Nexus: ${title}`,
      `DESCRIPTION:${desc.replace(/,/g, '\\,')}`,
      'LOCATION:Portland Grand Ballroom\\, 421 SW Morrison St\\, Portland\\, OR 97204',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const file = new Blob([raw], { type: 'text/calendar;charset=utf-8;' });
    const trigger = document.createElement('a');
    trigger.href = URL.createObjectURL(file);
    trigger.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(trigger);
    trigger.click();
    document.body.removeChild(trigger);
  }

  function initIntersectionObservers() {
    const reveals = document.querySelectorAll('.reveal, .reveal-stagger');

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('active');
          if (e.target.classList.contains('timeline-item')) {
            e.target.classList.add('active');
          }
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach(r => obs.observe(r));
  }

  function bindWindowScrolls() {

    const bg = document.querySelector('.hero-bg');

    window.addEventListener('scroll', () => {
      const top = window.pageYOffset;

      if (bg) bg.style.transform = `translateY(${top * 0.45}px)`;

      if (UI.header) {
        if (top > 50) {
          UI.header.classList.add('scrolled');
        } else {
          UI.header.classList.remove('scrolled');
        }
      }

      if (UI.backToTop) {
        if (top > 300) {
          UI.backToTop.classList.add('visible');
        } else {
          UI.backToTop.classList.remove('visible');
        }
      }
    }, { passive: true });
  }

  function bindUIActions() {

    document.body.addEventListener('click', (e) => {
      const detailBtn = e.target.closest('.btn-author-detail');
      if (detailBtn) {
        handleProfileOverlay(detailBtn.getAttribute('data-id'));
        return;
      }

      const closeBtn = e.target.closest('.modal-close-btn');
      if (closeBtn) {
        closeModal();
        return;
      }

      if (e.target.classList.contains('modal-overlay')) {
        closeModal();
      }
    });

    function closeModal() {
      const open = document.querySelector('.modal-overlay.active');
      if (open) toggleModal(open, false);
    }

    document.addEventListener('keydown', (e) => {
      const open = document.querySelector('.modal-overlay.active');
      if (!open) return;

      if (e.key === 'Escape') {
        closeModal();
        e.preventDefault();
      }

      if (e.key === 'Tab') {
        trapModalFocus(e, open);
      }
    });

    if (UI.rsvp.name) UI.rsvp.name.addEventListener('blur', () => checkInput(UI.rsvp.name));
    if (UI.rsvp.email) UI.rsvp.email.addEventListener('blur', () => checkInput(UI.rsvp.email));

    if (UI.rsvp.form) UI.rsvp.form.addEventListener('submit', transmitRsvp);

    if (UI.backToTop) {
      UI.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    document.addEventListener('click', (e) => {
      const calBtn = e.target.closest('.btn-calendar');
      if (!calBtn) return;

      const title = calBtn.getAttribute('data-title');
      const hr = parseInt(calBtn.getAttribute('data-offset-hour'), 10);
      const min = parseInt(calBtn.getAttribute('data-offset-min'), 10);
      const desc = calBtn.closest('.timeline-content').querySelector('.timeline-desc').textContent;

      compileICSAttachment(title, desc, hr, min);
    });
  }

  function bootstrap() {
    loadEventMetadata();
    loadSpeakers();
    bindWindowScrolls();
    bindUIActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})(window, document);
