/*
 * Kazo Technical School — motion (smooth scroll + entrance animations)
 * Libraries (loaded with defer, pinned): GSAP 3.15.0 + ScrollTrigger + SplitText, Lenis 1.3.26.
 *
 * HOW TO USE — add a data attribute to any element; no JS changes needed.
 * Several values can be combined with a space, e.g. data-anim="image parallax".
 *
 *   data-anim="words"     Heading text rises in word by word (24px, 0.06s stagger, power3.out, 0.8s).
 *                         Plays when the element reaches 85% of the viewport; headings already
 *                         in view (e.g. the hero H1) play on page load. Use on headings only,
 *                         never on body paragraphs.
 *   data-anim="fade-up"   The whole block fades up (20px → 0, 0.6s). Blocks that enter the
 *                         viewport together stagger 0.1s in page order. Anything inside a
 *                         fade-up block moves with it and is not animated separately.
 *   data-anim="image"     Put on the <picture>/image wrapper: fades in while the image
 *                         settles from scale 1.06 → 1 (1s, power2.out).
 *   data-anim="parallax"  Put on a large image wrapper: the image drifts with scroll
 *                         (max 8% of its height). Desktop with a mouse/trackpad only.
 *
 * Every animation plays once and never reverses. Elements are only hidden while the
 * <html> element has the "js-anim" class, which an inline script in <head> adds when
 * reduced motion is off and removes again after 3s if this file never ran. So with
 * no JavaScript, slow networks or reduced motion, all content is simply visible.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = window.gsap && window.ScrollTrigger;

  // Nothing to do (or libraries failed to load): make sure everything is visible.
  if (reduce || !hasGsap || !root.classList.contains('js-anim')) {
    root.classList.remove('js-anim');
    return;
  }
  window.__motionReady = true;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  /* ---------- Smooth scrolling (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ autoRaf: false, anchors: false, allowNestedScroll: true }); // touch keeps native scrolling (syncTouch off by default)
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Offset for anchor targets: any fixed/sticky header height plus the site's scroll-padding.
  function anchorOffset() {
    var pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    var header = document.querySelector('.header');
    var pos = header ? getComputedStyle(header).position : '';
    var head = pos === 'fixed' || pos === 'sticky' ? header.offsetHeight : 0;
    return head + pad;
  }
  function scrollToTarget(target) {
    // Scrolling down hides the header (see site.js), so it only needs the breathing room then.
    var goingDown = target.getBoundingClientRect().top > 0;
    var pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    var y = target.getBoundingClientRect().top + window.scrollY - (goingDown ? pad : anchorOffset());
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
    // Move keyboard/screen-reader focus to the section without a second jump.
    if (!target.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    history.pushState(null, '', url.hash);
    scrollToTarget(target);
  });

  /* ---------- Entrance animations ---------- */
  var has = function (el, v) { return (' ' + (el.getAttribute('data-anim') || '') + ' ').indexOf(' ' + v + ' ') > -1; };
  var all = function (v) { return Array.prototype.slice.call(document.querySelectorAll('[data-anim~="' + v + '"]')); };
  // Elements inside a fade-up block ride along with their parent.
  var nested = function (el) { return el.parentElement && el.parentElement.closest('[data-anim~="fade-up"]'); };
  var ONCE = { start: 'top 85%', once: true };

  // Headings: word rise
  all('words').forEach(function (el) {
    if (nested(el)) return;
    var targets = el;
    if (window.SplitText) {
      var split = window.SplitText.create(el, { type: 'words', aria: 'auto' });
      targets = split.words;
    }
    gsap.set(el, { visibility: 'visible' });
    gsap.from(targets, {
      y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: Object.assign({ trigger: el }, ONCE),
    });
  });

  // Blocks: fade up, batched so blocks entering together stagger in page order.
  var blocks = all('fade-up').filter(function (el) { return !nested(el); });
  var firstRun = true;
  ScrollTrigger.batch(blocks, {
    start: 'top 85%',
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1, delay: firstRun ? 0.25 : 0.1, overwrite: true });
      firstRun = false;
    },
  });

  // Images: soft fade + settle from 1.06
  all('image').forEach(function (el) {
    if (nested(el)) return;
    var img = el.querySelector('img') || el;
    var tl = gsap.timeline({ scrollTrigger: Object.assign({ trigger: el }, ONCE) });
    tl.to(el, { opacity: 1, duration: 1, ease: 'power2.out' }, 0)
      .fromTo(img, { scale: has(el, 'parallax') ? 1.14 : 1.06 }, { scale: has(el, 'parallax') ? 1.08 : 1, duration: 1, ease: 'power2.out' }, 0);
  });

  // Parallax: desktop with a fine pointer only; image is pre-scaled so edges never show.
  gsap.matchMedia().add('(min-width: 1024px) and (pointer: fine)', function () {
    all('parallax').forEach(function (el) {
      var img = el.querySelector('img') || el;
      if (!has(el, 'image')) gsap.set(img, { scale: 1.08 });
      gsap.fromTo(img, { yPercent: -4 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });

  // Recalculate positions once fonts and late images settle.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
