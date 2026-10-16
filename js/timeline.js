(function () {
  'use strict';

  var host = document.getElementById('experienceTimeline');
  if (!host) return;
  var entries = Array.prototype.slice.call(host.querySelectorAll('.timeline-item'));
  if (!entries.length) return;

  var nodes = [];
  var firstNode = 0;
  var lastNode = 0;
  var ticking = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  function measure() {
    var hostTop = host.getBoundingClientRect().top;
    var halfNode = (parseFloat(getComputedStyle(host).getPropertyValue('--node')) || 13) / 2;
    nodes = entries.map(function (entry) {
      return entry.getBoundingClientRect().top - hostTop + halfNode;
    });
    firstNode = nodes[0];
    lastNode = nodes[nodes.length - 1];
  }

  function update() {
    ticking = false;
    var halfNode = (parseFloat(getComputedStyle(host).getPropertyValue('--node')) || 13) / 2;
    var hostTop = host.getBoundingClientRect().top;
    var readingLine = reduceMotion ? hostTop + lastNode : window.innerHeight * 0.82;
    var tip = readingLine - hostTop;
    var span = lastNode - firstNode;
    var progress = span > 0 ? clamp((tip - firstNode) / span) : (tip >= lastNode ? 1 : 0);
    var cursorY = firstNode + progress * span;

    host.style.setProperty('--cursor-y', cursorY.toFixed(2) + 'px');
    host.setAttribute('data-state', progress <= 0 ? 'before' : progress >= 1 ? 'after' : 'live');

    entries.forEach(function (entry, index) {
      var from = nodes[index];
      var isLast = index === entries.length - 1;
      var to = isLast ? from : nodes[index + 1];
      var local = isLast ? (tip >= from ? 1 : 0) : clamp((tip - from) / Math.max(1, to - from));
      var length = isLast ? Math.max(0, entry.getBoundingClientRect().height - halfNode) : to - from;
      entry.style.setProperty('--segment-height', (local * length).toFixed(2) + 'px');
      entry.classList.toggle('is-passed', tip >= from);
    });
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  measure();
  if (reduceMotion) {
    update();
    return;
  }

  if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); schedule(); }).observe(host);
  window.addEventListener('resize', function () { measure(); schedule(); });
  window.addEventListener('scroll', schedule, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); schedule(); });
  update();
})();
