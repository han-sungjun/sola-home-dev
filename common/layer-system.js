/* 더운정픽 공통 레이어 시스템 v20260528
   레이어 타입: bottom-sheet / modal / fullscreen
   공통 정책: 바깥 클릭 닫힘 금지, ESC 기본 닫힘 금지, 명시 버튼만 닫힘
*/
(function(){
  'use strict';

  var OPEN_SELECTOR = [
    'dialog[open]',
    '.app-alert.show', '.app-alert.is-open',
    '.sheet-modal.show', '.sheet-modal.is-open',
    '.bottom-sheet.show', '.bottom-sheet.is-open',
    '.auth-bottom-sheet.show', '.auth-bottom-sheet.is-open',
    '.account-recovery-sheet.show', '.account-recovery-sheet.is-open',
    '.common-modal-overlay',
    '.upick-div-modal.show', '.upick-div-modal.upick-motion-open', '.upick-div-modal[open]',
    '.modal.show', '.modal.is-open',
    '.modal-overlay.show', '.modal-overlay.is-open',
    '.modal-backdrop.show', '.modal-backdrop.is-open',
    '.admin-modal.show', '.admin-modal.is-open',
    '.admin-dialog.show', '.admin-dialog.is-open',
    '.ai-image-zoom-backdrop.show', '.ai-image-zoom-backdrop.upick-motion-open'
  ].join(',');

  var LAYER_SELECTORS = [
    'dialog',
    '.app-alert',
    '.sheet-modal', '.bottom-sheet', '.auth-bottom-sheet', '.account-recovery-sheet',
    '.common-modal-overlay',
    '.upick-div-modal',
    '.modal', '.modal-overlay', '.modal-backdrop',
    '.admin-modal', '.admin-dialog',
    '.ai-image-zoom-backdrop',
    '[role="dialog"]', '[role="alertdialog"]'
  ].join(',');

  function isLayerRoot(el){
    if(!el || !el.matches) return false;
    return el.matches(LAYER_SELECTORS);
  }

  function getLayerRoot(target){
    if(!target || !target.closest) return null;
    return target.closest(LAYER_SELECTORS);
  }

  function classify(el){
    if(!el || !el.classList) return 'modal';
    if(el.matches('.sheet-modal,.bottom-sheet,.auth-bottom-sheet,.account-recovery-sheet')) return 'bottom-sheet';
    if(el.matches('.ai-image-zoom-backdrop,.upick-fullscreen-layer,[data-upick-layer-type="fullscreen"]')) return 'fullscreen';
    return 'modal';
  }

  function stamp(el){
    if(!el || el.dataset.upickLayerStamped === '1') return;
    el.dataset.upickLayerStamped = '1';
    el.dataset.upickLayer = 'true';
    el.dataset.upickLayerType = el.dataset.upickLayerType || classify(el);
    el.dataset.closeOnBackdrop = 'false';
    if(!el.hasAttribute('data-upick-close-on-backdrop')) el.setAttribute('data-upick-close-on-backdrop','false');
  }

  function syncOpenState(){
    var hasOpen = !!document.querySelector(OPEN_SELECTOR);
    document.documentElement.classList.toggle('upick-layer-open', hasOpen);
    document.body.classList.toggle('upick-layer-open', hasOpen);
    document.querySelectorAll(LAYER_SELECTORS).forEach(stamp);
    if(typeof window.__upickSyncModalScrollLock === 'function'){
      try{ window.__upickSyncModalScrollLock(); }catch(_){ }
    }
  }

  function isBackdropClick(event){
    var target = event.target;
    if(!target) return false;

    // 레이어 루트 자체를 누른 경우 = 바깥 영역
    if(isLayerRoot(target)) return true;

    // 별도 backdrop 요소를 가진 div-modal 계열
    if(target.closest && target.closest('.upick-div-modal-backdrop,.modal-backdrop')) return true;

    // dialog의 빈 영역 클릭도 닫힘 금지 대상으로 처리
    var root = getLayerRoot(target);
    if(root && target === root) return true;

    return false;
  }

  function preventBackdropClose(event){
    if(!isBackdropClick(event)) return;
    var root = getLayerRoot(event.target) || (isLayerRoot(event.target) ? event.target : null);
    if(!root) return;
    stamp(root);
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    return false;
  }

  ['pointerdown','mousedown','touchstart','click','dblclick'].forEach(function(name){
    document.addEventListener(name, preventBackdropClose, true);
  });

  // ESC로 닫히는 팝업이 섞이면 레이어 정책이 흔들려서 기본 차단합니다.
  document.addEventListener('keydown', function(event){
    if(event.key !== 'Escape') return;
    if(!document.querySelector(OPEN_SELECTOR)) return;
    var allowEsc = document.querySelector('[data-upick-allow-esc-close="true"]');
    if(allowEsc) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }, true);

  var observer = new MutationObserver(syncOpenState);
  function init(){
    document.querySelectorAll(LAYER_SELECTORS).forEach(stamp);
    syncOpenState();
    observer.observe(document.documentElement, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','open','aria-hidden','style']
    });
  }

  window.UpickLayerSystem = {
    sync: syncOpenState,
    stamp: stamp,
    classify: classify,
    policy: {
      closeOnBackdrop:false,
      closeOnEsc:false,
      types:['bottom-sheet','modal','fullscreen']
    }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
