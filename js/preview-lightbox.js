(function () {
  'use strict';

  var dialog;
  var closeTimer;

  function getDialog() {
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.className = 'preview-lightbox';
    dialog.setAttribute('aria-label', 'Image preview');
    document.body.appendChild(dialog);

    function closePreview() {
      if (!dialog.open || closeTimer) return;
      dialog.classList.remove('is-visible');
      closeTimer = window.setTimeout(function () {
        if (dialog.open) dialog.close();
        closeTimer = null;
      }, 260);
    }

    dialog.addEventListener('click', closePreview);
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closePreview();
    });

    return dialog;
  }

  function openPreview(figure) {
    var source = figure.querySelector('img[src]');
    if (!source || !source.getAttribute('src').trim()) return;

    var modal = getDialog();
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    var image = document.createElement('img');
    image.className = 'preview-lightbox-image';
    image.src = source.currentSrc || source.src;
    image.alt = source.alt || figure.getAttribute('aria-label') || 'Image preview';
    modal.querySelector('.preview-lightbox-image')?.remove();
    modal.insertBefore(image, modal.firstChild);

    if (!modal.open) modal.showModal();
    window.requestAnimationFrame(function () {
      modal.classList.add('is-visible');
    });
  }

  document.querySelectorAll('.pp-visual-placeholder').forEach(function (figure) {
    var image = figure.querySelector('img[src]');
    if (!image || !image.getAttribute('src').trim()) return;

    figure.classList.add('is-clickable');
    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('aria-haspopup', 'dialog');

    figure.addEventListener('click', function () { openPreview(figure); });
    figure.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPreview(figure);
      }
    });
  });
})();
