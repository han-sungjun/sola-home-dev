(function () {
  'use strict';

  var COVER_ID = 'privacyCover';
  var visible = false;
  var hideTimer = 0;
  var showTimer = 0;

  function getCover() {
    var cover = document.getElementById(COVER_ID);
    if (cover) return cover;

    cover = document.createElement('div');
    cover.id = COVER_ID;
    cover.setAttribute('aria-hidden', 'true');
    cover.innerHTML = '' +
      '<div class="privacy-cover-card" role="presentation">' +
        '<div class="privacy-cover-logo" aria-hidden="true">' +
          '<img src="/icons/internal/brand-symbol-real.png" alt="" loading="eager">' +
        '</div>' +
        '<p class="privacy-cover-title">더운정픽</p>' +
        '<p class="privacy-cover-desc">보안을 위해 화면 내용을 잠시 가렸습니다.</p>' +
      '</div>';

    if (document.body) {
      document.body.appendChild(cover);
    }
    return cover;
  }

  function showCover() {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);

    var cover = getCover();
    if (!cover) return;

    visible = true;
    document.documentElement.classList.add('privacy-cover-active');
    if (document.body) document.body.classList.add('privacy-cover-active');
    cover.classList.add('is-visible');
  }

  function hideCover() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);

    hideTimer = setTimeout(function () {
      var cover = document.getElementById(COVER_ID);
      visible = false;
      document.documentElement.classList.remove('privacy-cover-active');
      if (document.body) document.body.classList.remove('privacy-cover-active');
      if (cover) cover.classList.remove('is-visible');
    }, 160);
  }

  function maybeShowForBlur() {
    clearTimeout(showTimer);
    showTimer = setTimeout(function () {
      if (document.hidden || !document.hasFocus()) {
        showCover();
      }
    }, 40);
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      showCover();
    } else {
      hideCover();
    }
  }

  function handlePageShow() {
    hideCover();
  }

  function init() {
    getCover();

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('pagehide', showCover, { passive: true });
    window.addEventListener('pageshow', handlePageShow, { passive: true });
    window.addEventListener('blur', maybeShowForBlur, { passive: true });
    window.addEventListener('focus', hideCover, { passive: true });

    document.addEventListener('freeze', showCover, { passive: true });
    document.addEventListener('resume', hideCover, { passive: true });

    window.TheUnjeongPrivacyCover = {
      show: showCover,
      hide: hideCover,
      isVisible: function () { return visible; }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
