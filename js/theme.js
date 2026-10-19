// Shared theme state. One copy for the whole site — index.html and every page
// in projects/ read and write the same 'theme-v2' key in localStorage.
(function () {
  var KEY = 'theme-v2';
  var html = document.documentElement;

  // Apply the stored theme immediately. Dark is the default, so only a saved
  // 'light' choice opts out. This script is a blocking <script> in <head>, so
  // data-theme is set before first paint — no flash of the wrong theme.
  try {
    if (localStorage.getItem(KEY) !== 'light') {
      html.setAttribute('data-theme', 'dark');
    }
  } catch (e) {
    // Storage can be unavailable (e.g. blocked cookies); keep the dark default.
    html.setAttribute('data-theme', 'dark');
  }

  function isDark() {
    return html.getAttribute('data-theme') === 'dark';
  }

  function setDark(dark) {
    if (dark) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    var toggle = document.getElementById('themeToggle');
    if (toggle) toggle.setAttribute('aria-pressed', String(dark));
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch (e) {}
  }

  // This file loads in <head>, before the nav button exists, so wait for it.
  function init() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(isDark()));
    toggle.addEventListener('click', function () {
      setDark(!isDark());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();