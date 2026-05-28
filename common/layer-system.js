/* 더운정픽 공통 레이어 정책 v20260529-safe
   - 기존 open/close/animation DOM 구조를 변경하지 않습니다.
   - 기존 팝업 CSS, z-index, transform, aria-hidden 값을 덮어쓰지 않습니다.
   - 모든 바깥 영역 클릭 닫힘을 캡처 단계에서 차단합니다.
*/
(function(){
  'use strict';

  const LAYER_SELECTOR = [
    '#accountHelpModal',
    '#gnbSheet',
    '#detailModal',
    '#noticeModal',
    '#accountEditModal',
    '#passwordChangeModal',
    '#calendarReservationModal',
    '#calendarDayModal',
    '#qrModal',
    '#communityEditorModal',
    '#communityDetailModal',
    '#communityReportModal',
    '#aiImageZoomBackdrop',
    '.sheet-modal',
    '.upick-div-modal',
    '.upick-div-dialog',
    '.modal',
    '.modal-overlay',
    '.modal-backdrop',
    '.ai-image-zoom-backdrop',
    '.benefit-image-preview-overlay',
    '.app-alert'
  ].join(',');

  const PANEL_SELECTOR = [
    '[data-du-layer-panel]',
    '.sheet-panel',
    '.upick-div-modal-panel',
    '.upick-div-dialog-panel',
    '.modal-content',
    '.modal-panel',
    '.modal-card',
    '.notice-modal-content',
    '.detail-modal-content',
    '.ai-image-zoom-card',
    '.benefit-image-preview-frame',
    '.app-alert-card',
    '.common-alert-card'
  ].join(',');

  const OPEN_SELECTORS = [
    '.show',
    '.is-open',
    '[open]',
    '[aria-hidden="false"]'
  ];

  function closestLayer(target){
    return target && target.closest ? target.closest(LAYER_SELECTOR) : null;
  }

  function getPanel(layer){
    if(!layer) return null;
    return layer.querySelector(PANEL_SELECTOR) || layer.firstElementChild || layer;
  }

  function looksOpen(layer){
    if(!layer) return false;
    if(layer.open || layer.hasAttribute('open')) return true;
    if(layer.classList.contains('show') || layer.classList.contains('is-open') || layer.classList.contains('ready')) return true;
    if(layer.getAttribute('aria-hidden') === 'false') return true;
    return OPEN_SELECTORS.some(sel => { try { return layer.matches(sel); } catch(_) { return false; } });
  }

  function isBackdropEvent(event, layer){
    const panel = getPanel(layer);
    if(!panel || panel === layer) return event.target === layer;
    return event.target === layer || !panel.contains(event.target);
  }

  function blockBackdrop(event){
    const layer = closestLayer(event.target);
    if(!layer || !looksOpen(layer)) return;
    if(!isBackdropEvent(event, layer)) return;

    // 더운정픽 정책: 바깥 영역 클릭은 모든 레이어에서 닫힘 금지
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }

  function syncBodyFlag(){
    try{
      const any = Array.from(document.querySelectorAll(LAYER_SELECTOR)).some(looksOpen);
      document.documentElement.classList.toggle('du-layer-open', any);
      document.body.classList.toggle('du-layer-open', any);
    }catch(_){ }
  }

  // 기존 코드를 덮어쓰지 않는 가벼운 API만 제공합니다.
  window.UpickLayerPolicy = window.UpickLayerPolicy || {
    version: '20260529-safe',
    sync: syncBodyFlag,
    isBackdropEvent,
    getPanel,
    looksOpen
  };

  ['pointerdown','mousedown','touchstart','click','dblclick'].forEach(type => {
    document.addEventListener(type, blockBackdrop, true);
  });

  document.addEventListener('keydown', function(event){
    if(event.key !== 'Escape') return;
    const layers = Array.from(document.querySelectorAll(LAYER_SELECTOR)).filter(looksOpen);
    if(!layers.length) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncBodyFlag, {once:true});
  else syncBodyFlag();
})();
