(function () {
  var nav = document.querySelector('.chapter-nav');
  var projectSections = Array.prototype.slice.call(document.querySelectorAll('main .pp-section'));

  if (!nav && projectSections.length) {
    nav = document.createElement('nav');
    nav.className = 'chapter-nav';
    nav.setAttribute('aria-label', 'Page chapters');

    projectSections.forEach(function (section, i) {
      var heading = section.querySelector('.pp-h2, h2');
      if (!heading) return;

      var slug = heading.textContent.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      section.id = section.id || 'chapter-' + (i + 1) + '-' + slug;

      var link = document.createElement('a');
      link.href = '#' + section.id;

      var number = document.createElement('span');
      number.className = 'chapter-index';
      number.textContent = String(i + 1).padStart(2, '0');

      var label = document.createElement('span');
      label.textContent = heading.textContent.trim();

      link.appendChild(number);
      link.appendChild(label);
      nav.appendChild(link);
    });

    var pageTitle = document.querySelector('.pp-title');
    if (pageTitle) {
      var titleLabel = document.createElement('div');
      titleLabel.className = 'chapter-project-title';
      titleLabel.textContent = pageTitle.textContent.trim();
      nav.insertBefore(titleLabel, nav.firstChild);
    }

    document.body.appendChild(nav);
  }

  if (!nav) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  var targets = links.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  });
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  function setCurrent(index) {
    if (index < 0 || index >= links.length) return;
    links.forEach(function (link, i) {
      link.classList.toggle('is-current', i === index);
      link.classList.toggle('is-past', i < index);
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  links.forEach(function (link, i) {
    link.addEventListener('click', function (event) {
      var target = targets[i];
      if (!target || reduceMotion || !hasGsap || typeof ScrollToPlugin === 'undefined') return;
      event.preventDefault();
      gsap.to(window, {
        duration: 0.55,
        ease: 'power2.inOut',
        overwrite: 'auto',
        scrollTo: { y: target, offsetY: 76 }
      });
    });
  });

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof ScrollToPlugin !== 'undefined') gsap.registerPlugin(ScrollToPlugin);
    targets.forEach(function (target, i) {
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: 'top center',
        onEnter: function () { setCurrent(i); },
        onEnterBack: function () { setCurrent(i); }
      });
    });
  }

  var current = -1;
  targets.forEach(function (target, i) {
    if (target && target.getBoundingClientRect().top <= window.innerHeight / 2) current = i;
  });
  if (current >= 0) setCurrent(current);

  if (!hasGsap) {
    var ticking = false;
    function updateCurrent() {
      ticking = false;
      var active = -1;
      targets.forEach(function (target, i) {
        if (target && target.getBoundingClientRect().top <= window.innerHeight / 2) active = i;
      });
      if (active >= 0) setCurrent(active);
    }
    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateCurrent);
    }
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  }

  var projectTitle = nav.querySelector('.chapter-project-title');
  var projectHeader = document.querySelector('.pp-head');
  if (projectTitle && projectHeader) {
    function showProjectTitle(show) {
      if (hasGsap && !reduceMotion) {
        gsap.to(projectTitle, {
          autoAlpha: show ? 1 : 0,
          y: show ? 0 : -8,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      } else {
        projectTitle.classList.toggle('is-visible', show);
      }
    }

    if (hasGsap && !reduceMotion) {
      projectTitle.classList.add('gsap-managed');
      gsap.set(projectTitle, { autoAlpha: 0, y: -8 });
      ScrollTrigger.create({
        trigger: projectHeader,
        start: 'bottom top+=100',
        onEnter: function () { showProjectTitle(true); },
        onLeaveBack: function () { showProjectTitle(false); }
      });
    } else {
      function updateProjectTitle() {
        showProjectTitle(projectHeader.getBoundingClientRect().bottom <= 100);
      }
      window.addEventListener('scroll', updateProjectTitle, { passive: true });
      window.addEventListener('resize', updateProjectTitle);
      updateProjectTitle();
    }
  }
})();
