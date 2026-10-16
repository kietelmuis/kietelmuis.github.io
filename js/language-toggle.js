(function () {
  var translations = {
    en: {
      projects: 'Projects', experience: 'Experience', skills: 'Skills', contact: 'Contact',
      github: 'GitHub', switchTheme: 'Switch color theme', allProjects: '← All projects',
      nextXrooster: 'Next: XRooster →', viewSource: 'View source', inProgress: 'in progress',
      openSource: 'open source', forLearning: 'for learning', selectedWork: 'Selected work',
      workIntro: 'A mix of finished builds, active projects, and things still taking shape.',
      role: 'Systems developer — Rust, C#, and Go',
      heroIntro: 'Renderers, filesystem drivers, CLI tools. Low-level work in Rust, C#, and Go, mostly on Linux.',
      incoming: 'Incoming C# backend intern @ DMA One — January 2027',
      getInTouch: 'Get in touch', viewGithub: 'View GitHub', scroll: 'Scroll',
      problem: 'The problem', whyChoices: 'Why these choices', limitations: 'Current limitations',
      builtWith: 'Built with plain HTML and CSS', language: 'Site language',
      english: 'English', dutch: 'Dutch'
      ,timelineIntro: 'Three internships; one finished, one upcoming, one that introduced me to backend work.'
      ,backendIntern: 'C# Backend Software Intern', upcoming: 'upcoming', fullTime: 'Full-time backend internship in C#.'
      ,backendPast: 'Backend Software Intern', backendPastDesc: 'Worked on moving workloads from older .NET Framework microservices to newer .NET Core services.'
      ,selfStudy: 'Self-Study Internship', selfStudyDesc: 'Introduced me into TypeScript, worked with async and databases for the first time.'
      ,languages: 'Languages', systemsGraphics: 'Systems & graphics', applications: 'Applications'
      ,contactText: "I'm open to software systems and tooling roles, contracting, and interesting problems. Reach out and I'll get back to you."
    },
    nl: {
      projects: 'Projecten', experience: 'Ervaring', skills: 'Vaardigheden', contact: 'Contact',
      github: 'GitHub', switchTheme: 'Kleurenthema wisselen', allProjects: '← Alle projecten',
      nextXrooster: 'Volgende: XRooster →', viewSource: 'Bekijk broncode', inProgress: 'in ontwikkeling',
      openSource: 'open source', forLearning: 'om te leren', selectedWork: 'Geselecteerd werk',
      workIntro: 'Een mix van afgeronde projecten, werk in uitvoering en ideeën die nog vorm krijgen.',
      role: 'Systems developer — Rust, C# en Go',
      heroIntro: 'Renderers, bestandssysteemdrivers en CLI-tools. Laag-niveauwerk in Rust, C# en Go, vooral op Linux.',
      incoming: 'Binnenkort backendstagiair in C# bij DMA One — januari 2027',
      getInTouch: 'Neem contact op', viewGithub: 'Bekijk GitHub', scroll: 'Scroll',
      problem: 'Het probleem', whyChoices: 'Waarom deze keuzes', limitations: 'Huidige beperkingen',
      builtWith: 'Gebouwd met gewone HTML en CSS', language: 'Taal van de website',
      english: 'Engels', dutch: 'Nederlands'
      ,timelineIntro: 'Drie stages: één afgerond, één op komst en één die me kennis liet maken met backendontwikkeling.'
      ,backendIntern: 'C#-backendstagiair', upcoming: 'binnenkort', fullTime: 'Fulltime backendstage in C#.'
      ,backendPast: 'Backendstagiair', backendPastDesc: 'Meegewerkt aan de overstap van oudere .NET Framework-microservices naar nieuwere .NET Core-services.'
      ,selfStudy: 'Zelfstudie-stage', selfStudyDesc: 'Kennismaking met TypeScript; voor het eerst gewerkt met async en databases.'
      ,languages: 'Programmeertalen', systemsGraphics: 'Systemen en graphics', applications: 'Applicaties'
      ,contactText: 'Ik sta open voor functies in systeemsoftware en tooling, opdrachten en interessante uitdagingen. Stuur me een bericht; ik neem contact met je op.'
    }
  };

  var navRight = document.querySelector('.nav-right');
  var themeToggle = document.getElementById('themeToggle');
  var currentLang = localStorage.getItem('site-language') === 'nl' ? 'nl' : 'en';

  function translate(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
      var value = translations[lang][element.getAttribute('data-i18n')];
      if (value) element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (element) {
      var value = translations[lang][element.getAttribute('data-i18n-aria')];
      if (value) element.setAttribute('aria-label', value);
    });
    localStorage.setItem('site-language', lang);
    if (toggle) {
      toggle.querySelectorAll('button').forEach(function (button) {
        var active = button.dataset.lang === lang;
        button.classList.toggle('is-current', active);
        if (active) button.setAttribute('aria-pressed', 'true');
        else button.setAttribute('aria-pressed', 'false');
      });
    }
  }

  var toggle;
  if (navRight && themeToggle) {
    toggle = document.createElement('div');
    toggle.className = 'language-toggle';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Site language');
    ['en', 'nl'].forEach(function (lang) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'language-option';
      button.dataset.lang = lang;
      button.lang = lang;
      button.textContent = lang.toUpperCase();
      button.addEventListener('click', function () { translate(lang); });
      toggle.appendChild(button);
    });
    navRight.insertBefore(toggle, themeToggle);
  }

  translate(currentLang);
})();
