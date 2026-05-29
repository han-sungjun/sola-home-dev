/* 더운정픽 공통 레이어 어댑터 v20260529-phase4
   기존 팝업을 한 번에 갈아엎지 않고, sheet/modal/fullscreen 규격 속성과 클래스를 부여합니다.
   바깥 영역 클릭 닫힘은 여기서 기본 차단합니다. X/확인/취소 같은 명시 버튼은 그대로 동작합니다.
*/
(function(){
  'use strict';

  var LAYERS = [
    { id:'accountHelpModal', type:'sheet', panel:'.sheet-panel', header:'.sheet-head', body:'.sheet-body', close:'.sheet-close' },
    { id:'gnbSheet', type:'sheet', panel:'.gnb-sheet-panel,.gnb-panel,.gnb-sheet-inner', header:'.gnb-sheet-head,.gnb-head', body:'.gnb-sheet-body,.gnb-body,.gnb-menu', close:'.gnb-close,#gnbCloseBtn,[data-close-gnb]' },
    { id:'appAlert', type:'modal', panel:'.app-alert-card', header:'.app-alert-head', body:'.app-alert-message', close:null },
    { id:'settingsSuiteModal', type:'modal', panel:'.gnb-management-shell', header:'.gnb-management-head', body:'.gnb-management-body', close:'.gnb-management-close' },
    { id:'detailModal', type:'modal', panel:'.upick-div-modal-panel', header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'noticeModal', type:'modal', panel:'.upick-div-modal-panel', header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'accountEditModal', type:'modal', panel:'.upick-div-modal-panel', header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'passwordChangeModal', type:'modal', panel:'.upick-div-modal-panel', header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'calendarReservationModal', type:'modal', panel:'.upick-div-dialog-panel', header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'calendarDayModal', type:'modal', panel:null, header:'.calendar-day-modal-head', body:'.calendar-day-modal-body', close:'#calendarDayCloseBtn' },
    { id:'qrModal', type:'modal', panel:null, header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'communityEditorModal', type:'modal', panel:null, header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'communityDetailModal', type:'modal', panel:null, header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'communityReportModal', type:'modal', panel:null, header:'.modal-head', body:'.modal-body', close:'.close-btn' },
    { id:'aiImageZoomBackdrop', type:'fullscreen', panel:'.ai-image-zoom-card', header:'.ai-image-zoom-head,.ai-image-zoom-title', body:'.ai-image-zoom-scroll', close:'.ai-image-zoom-close' }
  ];

  function addClass(el, cls){ if(el && !el.classList.contains(cls)) el.classList.add(cls); }
  function setAttr(el, name, value){ if(el && el.getAttribute(name) !== String(value)) el.setAttribute(name, String(value)); }
  function closestLayer(el){ return el && el.closest && el.closest('.du-layer'); }
  function isPanelOrControl(target, layer){
    if(!target || !layer) return false;
    if(target.closest('.du-layer__panel,[data-du-layer-panel],.upick-div-modal-panel,.upick-div-dialog-panel,.gnb-management-shell,.sheet-panel,.ai-image-zoom-card')) return true;
    if(target.closest('[data-du-layer-close],.close-btn,.gnb-management-close,.sheet-close,.ai-image-zoom-close')) return true;
    return false;
  }

  function enhanceLayer(cfg){
    var layer = document.getElementById(cfg.id);
    if(!layer) return;
    addClass(layer, 'du-layer');
    addClass(layer, 'du-layer--' + cfg.type);
    setAttr(layer, 'data-du-layer', cfg.type);
    setAttr(layer, 'data-close-on-backdrop', 'false');
    setAttr(layer, 'data-du-close-on-backdrop', 'false');
    setAttr(layer, 'data-du-close-on-esc', 'false');

    var panel = cfg.panel ? layer.querySelector(cfg.panel) : null;
    if(!panel){
      panel = layer.querySelector('.upick-div-modal-panel,.upick-div-dialog-panel,.gnb-management-shell,.sheet-panel,.ai-image-zoom-card') || layer.firstElementChild;
    }
    addClass(panel, 'du-layer__panel');
    setAttr(panel, 'data-du-layer-panel', '');

    var backdrop = layer.querySelector('.upick-div-modal-backdrop');
    if(backdrop){
      addClass(backdrop, 'du-layer__backdrop');
      setAttr(backdrop, 'data-du-layer-backdrop', '');
    }

    var header = cfg.header ? layer.querySelector(cfg.header) : null;
    addClass(header, 'du-layer__header');
    if(header) setAttr(header, 'data-du-layer-header', '');

    var body = cfg.body ? layer.querySelector(cfg.body) : null;
    addClass(body, 'du-layer__body');
    if(body) setAttr(body, 'data-du-layer-body', '');

    var close = cfg.close ? layer.querySelector(cfg.close) : null;
    addClass(close, 'du-layer__close');
    if(close) setAttr(close, 'data-du-layer-close', '');

    var footer = layer.querySelector('.du-layer__footer,.calendar-form-actions,.calendar-day-modal-footer,.community-report-actions,.account-edit-actions,.password-change-actions,.qr-modal-footer,.app-alert-actions,.modal-actions,.sheet-actions');
    addClass(footer, 'du-layer__footer');
    if(footer) setAttr(footer, 'data-du-layer-footer', '');

    var pill = layer.querySelector('.pill,.gnb-management-kicker');
    addClass(pill, 'du-layer__badge');
    var title = layer.querySelector('.gnb-management-head h3,.sheet-title,.app-alert-title,.modal-title,.dialog-title');
    addClass(title, 'du-layer__title');
    var subtitle = layer.querySelector('.gnb-management-head p,.sheet-desc,.app-alert-message,.modal-desc,.dialog-desc');
    addClass(subtitle, 'du-layer__subtitle');
  }



  function enhanceOpenLayers(){
    LAYERS.forEach(enhanceLayer);
    document.querySelectorAll('.common-modal-overlay').forEach(function(layer){
      addClass(layer, 'du-layer');
      addClass(layer, 'du-layer--modal');
      setAttr(layer, 'data-du-layer', 'modal');
      setAttr(layer, 'data-du-close-on-backdrop', 'false');
      setAttr(layer, 'data-close-on-backdrop', 'false');
      setAttr(layer, 'data-du-close-on-esc', 'false');
      var stage = layer.querySelector('.common-modal-stage');
      addClass(stage, 'du-layer__panel');
      setAttr(stage, 'data-du-layer-panel', '');
      var header = layer.querySelector('.du-layer__header,.modal-head,.gnb-management-head');
      addClass(header, 'du-layer__header');
      var body = layer.querySelector('.du-layer__body,.modal-body,.gnb-management-body');
      addClass(body, 'du-layer__body');
      var footer = layer.querySelector('.du-layer__footer,.modal-actions,.gnb-management-actions');
      addClass(footer, 'du-layer__footer');
    });
  }

  function init(){
    enhanceOpenLayers();

    // 바깥 클릭 닫힘 전면 금지: 패널/버튼 내부 클릭은 절대 막지 않습니다.
    document.addEventListener('click', function(e){
      var layer = closestLayer(e.target);
      if(!layer) return;
      if(isPanelOrControl(e.target, layer)) return;
      if(layer.getAttribute('data-du-close-on-backdrop') === 'false' || layer.getAttribute('data-close-on-backdrop') === 'false'){
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // ESC 닫힘도 기본 금지. 입력 중 ESC 같은 기본 동작 방해를 피하려고 layer가 열려 있을 때만 차단합니다.
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      var opened = document.querySelector('.du-layer[aria-hidden="false"],.du-layer.show,.du-layer.is-open,.du-layer.open,.du-layer[open]');
      if(!opened) return;
      if(opened.getAttribute('data-du-close-on-esc') === 'false'){
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  window.DuLayerAdapter = { init:init, enhanceLayer:enhanceLayer, enhanceOpenLayers:enhanceOpenLayers, layers:LAYERS.slice() };
  document.addEventListener('upick:layer-opened', enhanceOpenLayers);
  document.addEventListener('upick:alert-opened', enhanceOpenLayers);
})();

/* v20260529-ai-image-close-guard: AI 이미지 확대는 X 버튼에서만 닫히도록 최종 방어 */
(function(){
  'use strict';
  var allowUntil = 0;
  function layer(){ return document.getElementById('aiImageZoomBackdrop'); }
  function isOpen(el){ return !!(el && (el.classList.contains('show') || el.getAttribute('aria-hidden') === 'false')); }
  function markAllow(){ allowUntil = Date.now() + 700; }
  function bind(){
    var el = layer();
    if(!el || el.dataset.duAiCloseGuardFinal === '1') return;
    el.dataset.duAiCloseGuardFinal = '1';
    var close = document.getElementById('aiImageZoomCloseBtn') || el.querySelector('.ai-image-zoom-close');
    if(close){
      ['pointerdown','mousedown','touchstart','click','keydown'].forEach(function(name){
        close.addEventListener(name, function(ev){
          if(name === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
          markAllow();
        }, true);
      });
    }
    ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click'].forEach(function(name){
      document.addEventListener(name, function(ev){
        var current = layer();
        if(!isOpen(current)) return;
        if(!ev.target || !current.contains(ev.target)) return;
        if(ev.target.closest && ev.target.closest('.ai-image-zoom-card,.ai-image-zoom-close,[data-du-layer-close]')) return;
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
        return false;
      }, true);
    });
  }
  function patchClose(){
    if(typeof window.closeAiImageZoom !== 'function' || window.closeAiImageZoom.__duGuarded) return;
    var original = window.closeAiImageZoom;
    var guarded = function(){
      var el = layer();
      var activeEvent = window.event;
      var byClose = activeEvent && activeEvent.target && activeEvent.target.closest && activeEvent.target.closest('#aiImageZoomCloseBtn,.ai-image-zoom-close,[data-du-layer-close]');
      if(isOpen(el) && !byClose && Date.now() > allowUntil){
        return false;
      }
      return original.apply(this, arguments);
    };
    guarded.__duGuarded = true;
    window.closeAiImageZoom = guarded;
  }
  function init(){ bind(); patchClose(); setTimeout(patchClose, 0); setTimeout(patchClose, 300); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  window.addEventListener('load', init, {once:true});
})();
