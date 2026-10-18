// GitHub contribution grid. Reads activity.json and paints the calendar.
//
// The JSON is a committed snapshot, not a live API call. Two reasons, in order:
// the contribution calendar is only reachable through GraphQL, which rejects
// unauthenticated queries outright, so a client-side fetch would mean shipping a
// personal access token in public JS; and the data only changes when Omar commits,
// so paying a request and a failure mode on every page view buys no freshness.
//
// Regenerate the snapshot with scripts/refresh-activity.sh.
//
// Markup it expects, per .activity block:
//   <p class="activity-total"><strong class="activity-count"></strong><span>…</span></p>
//   <div class="grid-scroll"><div class="activity-grid" data-source="…"></div>
//   <div class="activity-months" aria-hidden="true"></div></div>
//
// On .activity-grid:
//   data-source     snapshot to load, default activity.json
//   data-fallback   optional stand-in used only if data-source is unreachable
//   data-weeks      optional, show only the most recent N weeks
//
// On the containing .activity:
//   .activity-notice  revealed if the fallback is what rendered
(function () {
  'use strict';

  var grids = document.querySelectorAll('.activity-grid');
  if (!grids.length) return;

  // Same four steps the legend shows. 0 means an empty cell.
  function level(count) {
    if (!count) return 0;
    if (count > 6) return 4;
    if (count > 4) return 3;
    if (count > 2) return 2;
    return 1;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  function parseDay(value) {
    return new Date(value + 'T12:00:00');
  }

  function load(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
      return response.json();
    });
  }

  // Run `callback` the first time `element` scrolls into view, then stop
  // watching. Once only, deliberately: the total rolling up is a flourish, and
  // doing it on every pass through the viewport turns it into a tic.
  //
  // Falls back to running straight away where IntersectionObserver is missing,
  // which is exactly what an already-visible element does anyway.
  function whenFirstVisible(element, callback) {
    if (!('IntersectionObserver' in window)) {
      callback();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        observer.disconnect();
        callback();
        return;
      }
    }, { threshold: 0.35 });

    observer.observe(element);
  }

  // One grid per .activity block. Scoped lookups rather than ids, so a page can
  // carry more than one — a wide year-long strip on About and a compact
  // 13-week window in a sidebar, for instance.
  function mount(GRID) {
    var scope = GRID.closest('.activity') || document;
    var countEl = scope.querySelector('.activity-count');
    var monthsEl = scope.querySelector('.activity-months');
    var noticeEl = scope.querySelector('.activity-notice');

    var source = GRID.getAttribute('data-source') || 'activity.json';
    var fallback = GRID.getAttribute('data-fallback');
    var weeks = parseInt(GRID.getAttribute('data-weeks') || '0', 10);

    // Set by renderCount, called once by the visibility observer at the end of
    // render(). The reels are built at render time but held at their start
    // position until then.
    var playCount = null;

    // Pad the first week so the first real day lands in its own weekday column.
    function leadingBlanks(days) {
      if (!days.length) return 0;
      return parseDay(days[0].date).getDay();
    }

    // A missing snapshot is a normal state, not an exception worth shouting
    // about. Drop the whole block rather than showing a grid of empty squares,
    // which reads as "no contributions this year" instead of "no data".
    function teardown() {
      var section = GRID.closest('.activity');
      if (section) section.remove();
    }

    // One label per month, pinned to the column that month's first day falls in.
    // Absolutely positioned rather than spread with space-between, because months
    // are not the same width and an even spread drifts out of step with the grid.
    // A label is dropped when it would collide with the last one drawn, which is
    // what stops a shrunk grid printing "SepOct" across two adjacent columns.
    function renderMonths(days, column) {
      if (!monthsEl) return;
      var blanks = leadingBlanks(days);
      var fragment = document.createDocumentFragment();
      var previousLabel = null;
      var previousColumn = -Infinity;
      // "September" is the longest label at roughly 26px in this font.
      var minColumns = Math.max(1, Math.ceil(28 / column));

      days.forEach(function (day, index) {
        var label = parseDay(day.date).toLocaleDateString('en', { month: 'short' });
        if (label === previousLabel) return;
        previousLabel = label;

        var col = Math.floor((index + blanks) / 7);
        if (col - previousColumn < minColumns) return;
        previousColumn = col;

        var el = document.createElement('span');
        el.textContent = label;
        el.style.left = col * column + 'px';
        fragment.append(el);
      });

      monthsEl.replaceChildren(fragment);
    }

    // Each digit is a strip of 0-9 translated up to its own final digit. Build
    // only: the reels are spun by playCount, which the caller fires the first time
    // the block is actually on screen.
    function renderCount(total) {
      if (!countEl) return;
      var text = total.toLocaleString('en');
      countEl.textContent = '';
      countEl.setAttribute('aria-label', text);

      var reels = [];
      var digits = 0;

      Array.from(text).forEach(function (character, index) {
        // Grouping separators are real characters in the formatted total, so keep
        // them as text; only digits get a reel.
        if (!/\d/.test(character)) {
          countEl.append(document.createTextNode(character));
          return;
        }

        var windowEl = document.createElement('span');
        windowEl.className = 'count-digit';
        windowEl.setAttribute('aria-hidden', 'true');

        var reel = document.createElement('span');
        reel.className = 'count-reel';

        // Later digits start higher so the number settles right-to-left, the way
        // a mechanical counter does. Counting digits rather than characters keeps
        // the strip short when a separator is present.
        var turns = ++digits;
        reel.style.transitionDelay = (text.length - index) * 100 + 'ms';
        var steps = 10 * (turns + 2);
        for (var n = 0; n < steps; n++) {
          var item = document.createElement('span');
          item.textContent = n % 10;
          reel.append(item);
        }

        reel.setAttribute('data-position', 10 * (turns + 1) + Number(character));
        reel.style.transform = 'translateY(-10em)';
        windowEl.append(reel);
        countEl.append(windowEl);
        reels.push(reel);
      });

      // Both the built-in reel and the play are here; true means the reel is
      // held at its start position until something calls playCount.
      var settle = function () {
        reels.forEach(function (reel) {
          reel.style.transform = 'translateY(-' + reel.getAttribute('data-position') + 'em)';
        });
      };

      // Reduced motion: the CSS drops the transition, so there is no animation to
      // wait for. Settle the digits now rather than parking them at zero behind a
      // reel that will never turn.
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        settle();
        return;
      }

      // Otherwise the reels are built but deliberately not started. The caller
      // plays them once the block is actually on screen: at load the About card
      // sits well below the fold, so starting here means the number has already
      // settled by the time anyone scrolls to it.
      playCount = function () {
        // Two frames: one for the strip to be laid out, one for the transition
        // to have a start value to animate away from.
        requestAnimationFrame(function () {
          requestAnimationFrame(settle);
        });
      };
    }

    function render(data) {
      if (!data || !Array.isArray(data.days) || !data.days.length) {
        console.warn('[activity] ' + source + ' has no usable days array');
        teardown();
        return;
      }

      // A calendar-year snapshot always runs through 31 December, so its tail is
      // empty until the year is out. Slicing from the end of the array would
      // hand back mostly future days and render a near-blank window, so anchor
      // "the last N weeks" on the last day that has actually happened. ISO dates
      // compare correctly as plain strings.
      var days = data.days;
      if (weeks > 0) {
        var now = new Date();
        var today = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0');
        var elapsed = days.filter(function (day) { return day.date <= today; });
        if (elapsed.length >= weeks * 7) {
          days = elapsed.slice(-weeks * 7);
        } else if (elapsed.length) {
          // Fewer weeks of history than asked for: show all of it rather than
          // padding the window out with the empty tail.
          days = elapsed;
        } else {
          // Snapshot is entirely in the future or unparseable: fall back to the
          // raw tail so something renders.
          days = days.slice(-weeks * 7);
        }
      }

      if (!days.length) {
        teardown();
        return;
      }

      // Read the column pitch back out of the cascade rather than assuming it, so
      // a slot that shrinks --cell keeps its month labels aligned.
      var gridStyle = window.getComputedStyle(GRID);
      var column = parseFloat(gridStyle.gridAutoColumns) + parseFloat(gridStyle.rowGap);
      if (!column) column = 15;

      var blanks = leadingBlanks(days);
      var fragment = document.createDocumentFragment();

      for (var b = 0; b < blanks; b++) {
        var pad = document.createElement('i');
        pad.className = 'day';
        pad.setAttribute('aria-hidden', 'true');
        fragment.append(pad);
      }

      days.forEach(function (day) {
        var cell = document.createElement('i');
        var count = Number(day.count) || 0;
        var step = level(count);
        cell.className = 'day';
        if (step) cell.setAttribute('data-level', step);
        cell.title = formatDate(parseDay(day.date)) + ': ' + count;
        fragment.append(cell);
      });

      GRID.replaceChildren(fragment);
      renderMonths(days, column);

      // The headline counts the visible window, not the whole snapshot, or a
      // 13-week view would sit under a year-long total.
      if (weeks > 0) {
        var shown = days.reduce(function (sum, day) {
          return sum + (Number(day.count) || 0);
        }, 0);
        renderCount(shown);
      } else {
        renderCount(Number(data.total) || 0);
      }

      // Watch the whole block rather than just the grid: the total sits above
      // the cells, so observing .activity-grid would hold the reel until the row
      // below the number had scrolled in. The observer handles the already-on-
      // screen case (it fires immediately), so there is no separate load path.
      whenFirstVisible(scope === document ? GRID : scope, function () {
        if (playCount) playCount();
      });
    }

    load(source)
      .catch(function (error) {
        if (!fallback) throw error;
        console.warn('[activity] no ' + source + ', falling back to ' + fallback);
        return load(fallback).then(function (data) {
          // Say so on the page. Placeholder counts that look like real ones are
          // the one failure mode here that is silent.
          if (noticeEl) noticeEl.hidden = false;
          return data;
        });
      })
      .then(render)
      .catch(function (error) {
        // "Failed to fetch" from a file:// page is the commonest way to see the
        // block vanish with nothing on screen but a bare word in the console,
        // and the cause is not obvious: the browser blocks the request outright
        // because there is no server to serve it from. Name it.
        var hint = '';
        if (window.location.protocol === 'file:') {
          hint = ' — this page is open from disk, where the browser blocks ' +
            'fetch. Serve the folder instead: python3 -m http.server, then open ' +
            'http://localhost:8000/';
        } else {
          hint = ' — run scripts/refresh-activity.sh to create ' + source + '.';
        }
        console.warn('[activity] could not load ' + source + ':', error.message + hint);
        teardown();
      });
  }

  Array.prototype.forEach.call(grids, mount);
})();