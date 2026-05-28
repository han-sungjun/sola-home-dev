/* 더운정픽 모달 바깥 클릭 닫힘 방지 v20260528-perf
   layer-system.js와 중복되는 MutationObserver/개별 바인딩을 제거하고,
   가벼운 위임 방식만 유지합니다.
*/
(function(){
  'use strict';

  var BACKDROP_SELECTOR = [
    'dialog',
    '.app-alert',
    '.sheet-modal',
    '.bottom-sheet',
    '.auth-bottom-sheet',
    '.account-recovery-sheet',
    '.common-modal-overlay',
    '.modal',
    '.modal-overlay',
    '.modal-backdrop',
    '.admin-modal',
    '.admin-dialog',
    '.upick-div-modal',
    '.upick-div-modal-backdrop',
    '.ai-image-zoom-backdrop',
    '[role="dialog"]',
    '[role="alertdialog"]',
    '[data-upick-layer="true"]'
  ].join(',');

  function isBackdropTarget(target){
    return !!(target && target.matches && target.matches(BACKDROP_SELECTOR));
  }

  function lockBackdrop(event){
    if(!isBackdropTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }

  document.addEventListener('pointerdown', lockBackdrop, true);
  document.addEventListener('click', lockBackdrop, true);

  window.__UPICK_MODAL_BACKDROP_LOCK__ = {
    bind: function(){
      if(window.UpickLayerSystem && typeof window.UpickLayerSystem.sync === 'function'){
        window.UpickLayerSystem.sync();
      }
    }
  };
})();
