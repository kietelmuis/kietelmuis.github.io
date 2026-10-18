(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  var modes = new WeakMap();
  var pending = new WeakMap();
  var groups = [
    ['.section-title', 0, 0],
    ['.section-sub', 0, 0.12],
    ['.about-body p,.about-fact', 0.06, 0.05],
    ['.timeline-tag,.timeline-title,.timeline-company,.timeline-desc', 0.06, 0.04],
    ['.tile-name,.tile-desc,.tile-stack', 0.06, 0.02],
    ['.skill-key,.skill-val', 0.08, 0],
    ['.contact-lede,.contact-key,.contact-val', 0.08, 0]
  ];

  groups.forEach(function (group) {
    var previousParent = null;
    var siblingIndex = 0;
    document.querySelectorAll(group[0]).forEach(function (el) {
      if (el.parentNode !== previousParent) {
        previousParent = el.parentNode;
        siblingIndex = 0;
      }
      el.setAttribute('data-text-reveal', 'sweep');
      el.style.setProperty('--text-reveal-delay', (group[2] + siblingIndex++ * group[1]) + 's');
      modes.set(el, 'sweep');
    });
  });

  function play(el) {
    if (!modes.has(el)) return;
    el.setAttribute('data-text-reveal', modes.get(el));
    if (el.classList.contains('is-revealing')) return;

    el.classList.add('is-revealing');
    clearTimeout(pending.get(el));
    var delay = parseFloat(el.style.getPropertyValue('--text-reveal-delay')) || 0;
    pending.set(el, setTimeout(function () {
      if (!el.classList.contains('is-revealing')) return;
      el.removeAttribute('data-text-reveal');
      el.classList.remove('is-revealing');
    }, (delay + 2) * 1000));
  }

  function disarm(el) {
    if (!modes.has(el)) return;
    clearTimeout(pending.get(el));
    el.setAttribute('data-text-reveal', modes.get(el));
    el.classList.remove('is-revealing');
  }

  var onEnter = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) play(entry.target);
    });
  }, { threshold: 0.03, rootMargin: '0px 0px 16% 0px' });

  var onExit = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) disarm(entry.target);
    });
  }, { threshold: 0 });

  document.querySelectorAll('[data-text-reveal]').forEach(function (el) {
    onEnter.observe(el);
    onExit.observe(el);
  });

  var quiet;
  function sweepVisible() {
    document.querySelectorAll('[data-text-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) play(el);
    });
  }

  window.addEventListener('scroll', function () {
    clearTimeout(quiet);
    quiet = setTimeout(sweepVisible, 180);
  }, { passive: true });
  window.addEventListener('resize', sweepVisible, { passive: true });
  setTimeout(sweepVisible, 600);
})();
