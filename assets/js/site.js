/* Kazo Technical School — site behaviour. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var WA_NUMBER = '256778331533';

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        toggle.focus();
      }
    });
  }

  // Current year in footer
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Upcoming Saturdays for booking forms
  function nextSaturdays(n) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    return out;
  }
  document.querySelectorAll('select[data-saturdays]').forEach(function (sel) {
    nextSaturdays(4).forEach(function (date) {
      var o = document.createElement('option');
      o.textContent = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      sel.appendChild(o);
    });
  });

  // Quantity steppers
  document.querySelectorAll('[data-qty]').forEach(function (wrap) {
    var input = wrap.querySelector('input');
    wrap.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(input.value, 10) || 1;
        v = Math.max(1, v + (b.dataset.step === 'up' ? 1 : -1));
        input.value = v;
      });
    });
  });

  // Forms: validate, then hand off to WhatsApp with the answers pre-filled
  function labelFor(field) {
    var l = field.form.querySelector('label[for="' + field.id + '"]');
    if (!l) return field.name;
    var clone = l.cloneNode(true);
    clone.querySelectorAll('.optional, mark').forEach(function (m) { m.remove(); });
    return clone.textContent.trim();
  }
  function errorText(field) {
    if (field.validity.valueMissing) return 'Please fill in: ' + labelFor(field) + '.';
    if (field.validity.typeMismatch && field.type === 'email') return 'Please enter a valid email address.';
    if (field.validity.rangeUnderflow || field.validity.rangeOverflow) return 'Please enter a number between ' + field.min + ' and ' + field.max + '.';
    if (field.validity.badInput) return 'Please enter a number.';
    return 'Please check this answer.';
  }
  function showError(field, msg) {
    var err = document.getElementById(field.id + '-err');
    if (msg) {
      field.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = msg; err.hidden = false; }
    } else {
      field.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.hidden = true; }
    }
  }
  document.querySelectorAll('form[data-wa-form]').forEach(function (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
    fields.forEach(function (f) {
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid')) showError(f, f.checkValidity() ? '' : errorText(f)); });
      f.addEventListener('change', function () { if (f.getAttribute('aria-invalid')) showError(f, f.checkValidity() ? '' : errorText(f)); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) {
        if (!f.name) return;
        var ok = f.checkValidity();
        showError(f, ok ? '' : errorText(f));
        if (!ok && !firstBad) firstBad = f;
      });
      if (firstBad) { firstBad.focus(); return; }
      var lines = [form.dataset.waIntro || ''];
      fields.forEach(function (f) {
        if (!f.name || !f.value.trim()) return;
        lines.push(labelFor(f) + ': ' + f.value.trim());
      });
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
      var win = window.open(url, '_blank', 'noopener');
      if (form.dataset.redirect) {
        window.location.href = form.dataset.redirect;
      } else if (!win) {
        window.location.href = url;
      }
    });
  });

  // "Save Saturday to My Phone": build a calendar file for the coming Saturday, 9–11am Kampala time (UTC+3)
  document.querySelectorAll('[data-ics]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sat = nextSaturdays(1)[0];
      var ymd = sat.getFullYear() + String(sat.getMonth() + 1).padStart(2, '0') + String(sat.getDate()).padStart(2, '0');
      var ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kazo Technical School//Booking//EN',
        'BEGIN:VEVENT',
        'UID:' + ymd + '-saturday@theweldingschool-ug.com',
        'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
        'DTSTART:' + ymd + 'T060000Z',
        'DTEND:' + ymd + 'T080000Z',
        'SUMMARY:Free Saturday welding session - Kazo Technical School',
        'LOCATION:Kazo Technical School\\, Kazo Muganzirwazza\\, Kampala',
        'DESCRIPTION:Bring closed shoes. WhatsApp +256 778 331533 if something changes.',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = 'kazo-saturday-session.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    });
  });

  // Click-to-load map (keeps Google's embed off the page until asked for)
  document.querySelectorAll('[data-map-load]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.map');
      var f = document.createElement('iframe');
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Kazo Technical School, Kazo Muganzirwazza, Kampala') + '&output=embed';
      f.title = 'Map showing Kazo Technical School in Kazo Muganzirwazza, Kampala';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
      btn.remove();
    });
  });
})();

/* YouTube videos: lightweight poster until needed.
   Desktop: autoplays muted when in view, click anywhere for sound, pauses when scrolled away.
   Phones, data-saver and reduced-motion users: tap to play with sound. No JS: the poster links to YouTube. */
(function () {
  'use strict';
  var boxes = document.querySelectorAll('.video[data-video]');
  if (!boxes.length) return;
  var HOST = 'https://www.youtube-nocookie.com';
  var conn = navigator.connection || {};
  var canAutoplay = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches &&
    !conn.saveData && !/(^|-)2g$/.test(conn.effectiveType || '');

  function send(box, func, args) {
    if (box._frame && box._frame.contentWindow) box._frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [] }), HOST);
  }
  function mount(box, muted) {
    var id = box.getAttribute('data-video');
    var f = document.createElement('iframe');
    f.src = HOST + '/embed/' + id + '?autoplay=1&playsinline=1&rel=0&enablejsapi=1' + (muted ? '&mute=1&loop=1&playlist=' + id : '') + '&origin=' + encodeURIComponent(location.origin);
    f.title = box.getAttribute('data-video-title') || 'Video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    box.appendChild(f);
    box._frame = f;
    box.classList.add('is-playing');
    if (muted) {
      box._muted = true;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'video__sound';
      b.innerHTML = '<span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>Tap for sound</span>';
      b.setAttribute('aria-label', 'Play with sound: ' + f.title);
      b.addEventListener('click', function () {
        send(box, 'unMute'); send(box, 'setVolume', [100]); send(box, 'seekTo', [0, true]); send(box, 'playVideo');
        box._muted = false;
        b.remove();
        f.focus();
      });
      box.appendChild(b);
    }
  }
  boxes.forEach(function (box) {
    var link = box.querySelector('.video__play');
    link.addEventListener('click', function (e) {
      e.preventDefault();
      if (!box._frame) mount(box, false);
    });
    if (box.hasAttribute('data-video-autoplay') && canAutoplay && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            if (!box._frame) mount(box, true);
            else if (box._muted) send(box, 'playVideo');
          } else if (box._frame && box._muted) {
            send(box, 'pauseVideo');
          }
        });
      }, { threshold: 0.5 }).observe(box);
    }
  });
})();

/* Expanding cards: mouse hover, keyboard focus or first tap opens a card; a tap on the open card follows its link. */
(function () {
  'use strict';
  document.querySelectorAll('[data-xcards]').forEach(function (list) {
    var cards = Array.prototype.slice.call(list.querySelectorAll('.xcard'));
    function open(card) {
      cards.forEach(function (c) {
        var on = c === card;
        c.classList.toggle('is-active', on);
        c.setAttribute('data-active', on ? 'true' : 'false');
      });
    }
    list.classList.add('is-enhanced');
    cards.forEach(function (card) {
      card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') open(card); });
      card.addEventListener('focusin', function () { open(card); });
      card.addEventListener('click', function (e) {
        if (!card.classList.contains('is-active')) { e.preventDefault(); open(card); }
      });
    });
  });
})();

/* Header: hide while scrolling down, show again on any scroll up. Always shown at the top,
   while the mobile menu is open, and when keyboard focus is inside it. */
(function () {
  'use strict';
  var header = document.querySelector('.header');
  if (!header) return;
  var topbar = document.querySelector('.topbar');
  var nav = document.getElementById('site-nav');
  var lastY = window.scrollY, ticking = false, TOL = 6;
  function update() {
    ticking = false;
    var y = Math.max(0, window.scrollY);
    var tb = topbar ? topbar.offsetHeight : 0;
    header.classList.toggle('is-scrolled', y > tb);
    var keepOpen = (nav && nav.classList.contains('is-open')) || header.contains(document.activeElement);
    if (keepOpen || y <= tb + header.offsetHeight) {
      header.classList.remove('is-hidden');
    } else if (y > lastY + TOL) {
      header.classList.add('is-hidden');
    } else if (y < lastY - TOL) {
      header.classList.remove('is-hidden');
    }
    if (Math.abs(y - lastY) > TOL) lastY = y;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  update();
})();
