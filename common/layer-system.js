/* 더운정픽 공통 레이어 시스템 v20260528-perf
   레이어 타입: bottom-sheet / modal / fullscreen
   정책: 바깥 클릭 닫힘 금지, ESC 닫힘 금지, 명시 버튼만 닫힘
   성능 보정: 전역 MutationObserver attribute 감시 제거, DOM 전체 반복 최소화
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
    '.common-modal-overlay.is-open', '.common-modal-overlay.show',
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

  var scheduled = false;

  function isElement(node){
    return node && node.nodeType === 1;
  }

  function classify(el){
    if(!el || !el.matches) return 'modal';
    if(el.matches('.sheet-modal,.bottom-sheet,.auth-bottom-sheet,.account-recovery-sheet')) return 'bottom-sheet';
    if(el.matches('.ai-image-zoom-backdrop,.upick-fullscreen-layer,[data-upick-layer-type="fullscreen"]')) return 'fullscreen';
    return 'modal';
  }

  function stamp(el){
    if(!el || !el.dataset || el.dataset.upickLayerStamped === '1') return;
    el.dataset.upickLayerStamped = '1';
    el.dataset.upickLayer = 'true';
    el.dataset.upickLayerType = el.dataset.upickLayerType || classify(el);
    el.dataset.closeOnBackdrop = 'false';
    if(!el.hasAttribute('data-upick-close-on-backdrop')){
      el.setAttribute('data-upick-close-on-backdrop','false');
    }
  }

  function stampSubtree(root){
    if(!isElement(root)) return;
    if(root.matches && root.matches(LAYER_SELECTORS)) stamp(root);
    if(root.querySelectorAll){
      root.querySelectorAll(LAYER_SELECTORS).forEach(stamp);
    }
  }

  function syncOpenState(){
    scheduled = false;
    var hasOpen = !!document.querySelector(OPEN_SELECTOR);
    document.documentElement.classList.toggle('upick-layer-open', hasOpen);
    if(document.body){
      document.body.classList.toggle('upick-layer-open', hasOpen);
    }
    if(typeof window.__upickSyncModalScrollLock === 'function'){
      try{ window.__upickSyncModalScrollLock(); }catch(_){ }
    }
  }

  function scheduleSync(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(syncOpenState);
  }

  function isLayerRoot(el){
    return !!(el && el.matches && el.matches(LAYER_SELECTORS));
  }

  function getLayerRoot(target){
    return target && target.closest ? target.closest(LAYER_SELECTORS) : null;
  }

  function isBackdropClick(event){
    var target = event.target;
    if(!target) return false;

    // 루트 자체 클릭만 바깥 클릭으로 간주합니다.
    // 내부 버튼/입력/스크롤 클릭 성능과 동작을 방해하지 않습니다.
    if(isLayerRoot(target)) return true;

    if(target.classList && (
      target.classList.contains('upick-div-modal-backdrop') ||
      target.classList.contains('modal-backdrop') ||
      target.classList.contains('ai-image-zoom-backdrop')
    )) return true;

    return false;
  }

  function preventBackdropClose(event){
    if(!isBackdropClick(event)) return;

    var root = getLayerRoot(event.target) || (isLayerRoot(event.target) ? event.target : null);
    if(root) stamp(root);

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    return false;
  }

  // 최소 이벤트만 캡처합니다. touchstart/mousedown/dblclick까지 전부 막으면 모바일에서 체감 지연이 커집니다.
  document.addEventListener('pointerdown', preventBackdropClose, true);
  document.addEventListener('click', preventBackdropClose, true);

  document.addEventListener('keydown', function(event){
    if(event.key !== 'Escape') return;
    if(!document.querySelector(OPEN_SELECTOR)) return;
    if(document.querySelector('[data-upick-allow-esc-close="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }, true);

  var observer = new MutationObserver(function(records){
    records.forEach(function(record){
      record.addedNodes && record.addedNodes.forEach(stampSubtree);
    });
    scheduleSync();
  });

  function init(){
    stampSubtree(document.documentElement);
    syncOpenState();
    observer.observe(document.documentElement, {
      childList:true,
      subtree:true
    });
  }

  window.UpickLayerSystem = {
    sync: syncOpenState,
    scheduleSync: scheduleSync,
    stamp: stamp,
    stampSubtree: stampSubtree,
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
