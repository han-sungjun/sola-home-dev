/* 더운정픽 공통 레이어 시스템 v20260529
   기존 show/open 기반 팝업을 그대로 살리면서 3종 레이어 정책만 통합합니다. */
(function(){
  'use strict';

  const OPEN_CLASS = 'show';
  const CLOSING_CLASS = 'is-closing';
  const BASE_Z = 50000;
  const STEP_Z = 20;
  let seq = 0;
  const opened = new Set();
  let lastFocus = null;

  const typeById = {
    accountHelpModal: 'bottom-sheet',
    gnbSheet: 'bottom-sheet',
    detailModal: 'modal',
    noticeModal: 'modal',
    accountEditModal: 'modal',
    passwordChangeModal: 'modal',
    calendarReservationModal: 'modal',
    calendarDayModal: 'modal',
    communityEditorModal: 'modal',
    communityDetailModal: 'modal',
    communityReportModal: 'modal',
    appAlert: 'modal',
    aiImageZoomBackdrop: 'fullscreen'
  };

  function q(sel, root){ return (root || document).querySelector(sel); }
  function qa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
  function isElement(v){ return !!(v && v.nodeType === 1); }
  function getLayer(input){ return typeof input === 'string' ? document.getElementById(input.replace(/^#/, '')) : input; }
  function getType(layer){ return layer?.dataset?.duLayer || layer?.dataset?.duLayerType || typeById[layer?.id] || (layer?.classList?.contains('sheet-modal') ? 'bottom-sheet' : 'modal'); }
  function getPanel(layer){
    if(!layer) return null;
    return q('[data-du-layer-panel]', layer) || q('.du-layer__panel', layer) || q('.upick-div-modal-panel', layer) || q('.upick-div-dialog-panel', layer) || q('.sheet-panel', layer) || q('.ai-image-zoom-card', layer) || layer.firstElementChild;
  }
  function isOpen(layer){ return !!(layer && (layer.hasAttribute('open') || layer.classList.contains(OPEN_CLASS) || layer.classList.contains('is-open') || layer.getAttribute('aria-hidden') === 'false')); }

  function decorate(layer){
    if(!isElement(layer)) return layer;
    if(!layer.dataset.duLayer && typeById[layer.id]) layer.dataset.duLayer = typeById[layer.id];
    if(!layer.dataset.duCloseOnBackdrop) layer.dataset.duCloseOnBackdrop = 'false';
    if(!layer.dataset.duCloseOnEsc) layer.dataset.duCloseOnEsc = 'false';
    layer.classList.add('du-layer');
    layer.classList.add('du-layer--' + getType(layer));
    const panel = getPanel(layer);
    if(panel && !panel.hasAttribute('data-du-layer-panel')) panel.setAttribute('data-du-layer-panel', '');
    qa('#closeModal,#closeNoticeModal,#closeAccountEditModal,#closePasswordChangeModal,#closeCalendarReservationModal,#calendarDayCloseBtn,#calendarDayCloseBottomBtn,#accountHelpCloseBtn,#aiImageZoomCloseBtn,.close-btn,.sheet-close,.ai-image-zoom-close', layer)
      .forEach(btn => { if(!btn.hasAttribute('data-du-layer-close')) btn.setAttribute('data-du-layer-close',''); });
    return layer;
  }

  function syncBody(){
    const anyOpen = qa('.du-layer').some(isOpen);
    document.documentElement.classList.toggle('du-layer-open', anyOpen);
    document.body.classList.toggle('du-layer-open', anyOpen);
    try{ if(typeof window.__upickSyncModalScrollLock === 'function') window.__upickSyncModalScrollLock(); }catch(_){ }
  }

  function bring(layer){
    if(!isElement(layer)) return;
    decorate(layer);
    seq += 1;
    layer.style.setProperty('--du-layer-z', String(BASE_Z + (seq * STEP_Z)));
    opened.add(layer);
    try{ if(window.UpickPopupStack?.bring) window.UpickPopupStack.bring(layer); }catch(_){ }
    syncBody();
  }

  function release(layer){
    if(!isElement(layer)) return;
    opened.delete(layer);
    setTimeout(syncBody, 0);
    try{ if(window.UpickPopupStack?.release) window.UpickPopupStack.release(layer); }catch(_){ }
  }

  function focusFirst(layer, selector){
    const target = selector ? q(selector, layer) : null;
    const fallback = target || q('[autofocus], [data-du-layer-close], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', layer) || layer;
    requestAnimationFrame(() => { try{ fallback?.focus?.({preventScroll:true}); }catch(_){ } });
  }

  function open(input, options={}){
    const layer = decorate(getLayer(input));
    if(!layer) return null;
    lastFocus = document.activeElement;
    const panel = getPanel(layer);
    layer.classList.remove('closing', CLOSING_CLASS, 'upick-motion-closing');
    layer.classList.add('ready');
    layer.setAttribute('aria-hidden', 'false');
    layer.setAttribute('open', '');
    bring(layer);
    const afterOpen = () => {
      if(typeof options.afterOpen === 'function') options.afterOpen();
      focusFirst(layer, options.initialFocusSelector);
    };
    if(window.UpickMotion && options.motion !== false){
      window.UpickMotion.open(layer, {
        activeClass: OPEN_CLASS,
        closingClass: CLOSING_CLASS,
        panel,
        duration: Number.isFinite(options.duration) ? options.duration : 260,
        afterOpen
      });
    }else{
      requestAnimationFrame(() => requestAnimationFrame(() => { layer.classList.add(OPEN_CLASS); afterOpen(); }));
    }
    return layer;
  }

  function close(input, options={}){
    const layer = decorate(getLayer(input));
    if(!layer) return null;
    const panel = getPanel(layer);
    const done = () => {
      layer.classList.remove(OPEN_CLASS, 'ready', 'closing', CLOSING_CLASS, 'is-open', 'upick-motion-open', 'upick-motion-closing');
      layer.setAttribute('aria-hidden', 'true');
      layer.removeAttribute('open');
      release(layer);
      if(options.restoreFocus !== false){ try{ lastFocus?.focus?.({preventScroll:true}); }catch(_){ } }
      if(typeof options.afterClose === 'function') options.afterClose();
    };
    if(window.UpickMotion && options.motion !== false && isOpen(layer)){
      window.UpickMotion.close(layer, {
        activeClass: OPEN_CLASS,
        closingClass: CLOSING_CLASS,
        panel,
        duration: Number.isFinite(options.duration) ? options.duration : 260,
        afterClose: done
      });
    }else{
      layer.classList.remove(OPEN_CLASS);
      layer.classList.add(CLOSING_CLASS);
      setTimeout(done, Number.isFinite(options.duration) ? options.duration : 260);
    }
    return layer;
  }

  function initKnown(){
    Object.keys(typeById).forEach(id => decorate(document.getElementById(id)));
    qa('.sheet-modal,.upick-div-modal,.upick-div-dialog,.ai-image-zoom-backdrop,[role="dialog"][aria-modal="true"],.app-alert').forEach(decorate);
    syncBody();
  }

  document.addEventListener('pointerdown', function(event){
    const layer = event.target && event.target.closest && event.target.closest('.du-layer,[data-du-layer],.sheet-modal,.upick-div-modal,.upick-div-dialog,.ai-image-zoom-backdrop,.app-alert');
    if(!layer) return;
    decorate(layer);
    const panel = getPanel(layer);
    const isBackdrop = event.target === layer || (panel && !panel.contains(event.target));
    if(isBackdrop){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
  }, true);

  document.addEventListener('click', function(event){
    const layer = event.target && event.target.closest && event.target.closest('.du-layer,[data-du-layer],.sheet-modal,.upick-div-modal,.upick-div-dialog,.ai-image-zoom-backdrop,.app-alert');
    if(!layer) return;
    decorate(layer);
    const panel = getPanel(layer);
    const isBackdrop = event.target === layer || (panel && !panel.contains(event.target));
    if(isBackdrop){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
  }, true);

  document.addEventListener('keydown', function(event){
    if(event.key !== 'Escape') return;
    const top = Array.from(opened).filter(isOpen).pop();
    if(top && top.dataset.duCloseOnEsc !== 'true'){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
  }, true);

  window.UpickLayer = window.UpickLayer || { open, close, bring, release, decorate, sync: syncBody, isOpen, getPanel };
  window.openLayer = window.openLayer || open;
  window.closeLayer = window.closeLayer || close;
  window.__upickBringPopupToFront = window.__upickBringPopupToFront || bring;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initKnown, {once:true});
  else initKnown();
})();
