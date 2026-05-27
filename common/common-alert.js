/* 더운정픽 공통 알럿/컨펌 v2026051602 */
(function(){
  'use strict';

  var queue = Promise.resolve();
  var ALERT_OPEN_DURATION = 280;
  var ALERT_CLOSE_DURATION = 360;
  var lastFocus = null;
  var alertEl = null;
  var titleEl = null;
  var messageEl = null;
  var confirmBtn = null;
  var cancelBtn = null;
  var actionsEl = null;

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function escapeText(value){ return String(value == null ? '' : value); }

  function ensureAlert(){
    alertEl = qs('#appAlert');
    if(!alertEl){
      alertEl = document.createElement('div');
      alertEl.id = 'appAlert';
      alertEl.className = 'app-alert';
      alertEl.setAttribute('aria-hidden','true');
      alertEl.innerHTML = ''+
        '<div class="app-alert-card" role="alertdialog" aria-modal="true" aria-labelledby="appAlertTitle" aria-describedby="appAlertMessage">'+
          '<div class="app-alert-head">'+
            '<div class="app-alert-icon" id="appAlertIcon" aria-hidden="true"></div>'+
            '<h3 class="app-alert-title" id="appAlertTitle">안내</h3>'+
          '</div>'+
          '<p class="app-alert-message" id="appAlertMessage"></p>'+
          '<div class="app-alert-actions">'+
            '<button class="app-alert-cancel hidden" id="appAlertCancel" type="button">취소</button>'+
            '<button class="app-alert-confirm" id="appAlertConfirm" type="button">확인</button>'+
          '</div>'+
        '</div>';
      document.body.appendChild(alertEl);
    }

    titleEl = qs('#appAlertTitle', alertEl) || qs('#appAlertTitle');
    messageEl = qs('#appAlertMessage', alertEl) || qs('#appAlertMessage');
    confirmBtn = qs('#appAlertConfirm', alertEl) || qs('#appAlertConfirm');
    cancelBtn = qs('#appAlertCancel', alertEl) || qs('#appAlertCancel');

    var actions = qs('.app-alert-actions', alertEl);
    actionsEl = actions;
    if(actions && !cancelBtn){
      cancelBtn = document.createElement('button');
      cancelBtn.className = 'app-alert-cancel hidden';
      cancelBtn.id = 'appAlertCancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = '취소';
      actions.insertBefore(cancelBtn, actions.firstChild);
    }
    if(actions && !confirmBtn){
      confirmBtn = document.createElement('button');
      confirmBtn.className = 'app-alert-confirm';
      confirmBtn.id = 'appAlertConfirm';
      confirmBtn.type = 'button';
      confirmBtn.textContent = '확인';
      actions.appendChild(confirmBtn);
    }

    if(alertEl.parentElement !== document.body){
      document.body.appendChild(alertEl);
    }

    alertEl.addEventListener('click', blockBackdropClose, true);
    alertEl.addEventListener('pointerdown', blockBackdropClose, true);

    return alertEl;
  }

  function blockBackdropClose(event){
    if(event.target === alertEl){
      event.preventDefault();
      event.stopPropagation();
      if(event.stopImmediatePropagation) event.stopImmediatePropagation();
    }
  }

  var alertInteractionLockActive = false;

  function isInsideAlertCard(target){
    if(!alertEl || !target) return false;
    var card = getAlertPanel();
    return !!(card && card.contains(target));
  }

  function blockOutsideAlertInteraction(event){
    if(!alertInteractionLockActive || !alertEl) return;

    // 알럿 카드 내부 버튼/입력만 허용합니다.
    if(isInsideAlertCard(event.target)) return;

    // 알럿 오버레이와 뒤쪽 GNB/팝업/본문은 모두 이벤트를 삼켜서
    // 알럿 뒤 레이어가 닫히거나 클릭되는 것을 방지합니다.
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation) event.stopImmediatePropagation();
  }

  var ALERT_LOCK_EVENTS = ['pointerdown','mousedown','touchstart','touchmove','wheel','click','dblclick'];

  /*
   * Stable scroll lock
   * - 관리자/입장/계정 만들기 페이지에서 알럿 표시 시 스크롤바가 사라지면
   *   닫을 때 최상단 튐/lock 잔류가 발생할 수 있습니다.
   * - 그래서 body fixed 방식이 아니라 "스크롤바는 유지"하고 wheel/touch/key/scroll만 막습니다.
   * - 스크롤바 레일은 항상 남겨 레이아웃 이동을 방지합니다.
   */
  if(!window.__upickHardScrollFreeze){
    window.__upickHardScrollFreeze = (function(){
      var reasons = {};
      var saved = null;
      var containers = [];
      var resetting = false;
      var keyBlockInstalled = false;
      var scrollBlockInstalled = false;
      var SCROLL_KEYS = {
        'ArrowUp':true,'ArrowDown':true,'PageUp':true,'PageDown':true,
        'Home':true,'End':true,' ':true,'Spacebar':true
      };

      function collectContainers(){
        var list = [];
        ['#mainContent','.app','.shell','.admin-page','.page','.content','.tab-content'].forEach(function(sel){
          document.querySelectorAll(sel).forEach(function(el){
            if(el && el !== document.body && el !== document.documentElement && list.indexOf(el) < 0) list.push(el);
          });
        });
        return list;
      }

      function hasReason(){
        return Object.keys(reasons).some(function(key){ return reasons[key]; });
      }

      function allowModalScroll(target){
        if(!target || !target.closest) return false;
        return !!target.closest('.app-alert-card,.common-modal-overlay,.sheet-modal.show,.sheet-modal.is-open,.bottom-sheet.show,.bottom-sheet.is-open,.auth-bottom-sheet.show,.auth-bottom-sheet.is-open,.account-recovery-sheet.show,.account-recovery-sheet.is-open,.admin-modal.show,.admin-modal.is-open,.admin-dialog.show,.admin-dialog.is-open,.modal.show,.modal.is-open,dialog[open],#gnbSheet.show,.gnb-sheet.show');
      }

      function blockScrollKeys(event){
        if(!saved || allowModalScroll(event.target)) return;
        if(SCROLL_KEYS[event.key]){
          event.preventDefault();
          event.stopPropagation();
          if(event.stopImmediatePropagation) event.stopImmediatePropagation();
        }
      }

      function keepScrollPosition(){
        if(!saved || resetting) return;
        var doc = document.documentElement;
        var body = document.body;
        var x = window.pageXOffset || doc.scrollLeft || body.scrollLeft || 0;
        var y = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
        if(x !== saved.x || y !== saved.y){
          resetting = true;
          window.scrollTo(saved.x, saved.y);
          requestAnimationFrame(function(){ resetting = false; });
        }
      }

      function installGuards(){
        if(!keyBlockInstalled){
          document.addEventListener('keydown', blockScrollKeys, true);
          keyBlockInstalled = true;
        }
        if(!scrollBlockInstalled){
          window.addEventListener('scroll', keepScrollPosition, {capture:true, passive:true});
          document.addEventListener('scroll', keepScrollPosition, {capture:true, passive:true});
          scrollBlockInstalled = true;
        }
      }

      function removeGuards(){
        if(keyBlockInstalled){
          document.removeEventListener('keydown', blockScrollKeys, true);
          keyBlockInstalled = false;
        }
        if(scrollBlockInstalled){
          window.removeEventListener('scroll', keepScrollPosition, {capture:true});
          document.removeEventListener('scroll', keepScrollPosition, {capture:true});
          scrollBlockInstalled = false;
        }
      }

      function apply(){
        if(saved) return;
        var doc = document.documentElement;
        var body = document.body;
        var x = window.pageXOffset || doc.scrollLeft || body.scrollLeft || 0;
        var y = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
        containers = collectContainers().map(function(el){
          return {
            el: el,
            overscrollBehavior: el.style.overscrollBehavior,
            touchAction: el.style.touchAction,
            scrollTop: el.scrollTop
          };
        });
        saved = {
          x:x, y:y,
          htmlOverflowY: doc.style.overflowY,
          htmlOverflowX: doc.style.overflowX,
          htmlOverscroll: doc.style.overscrollBehavior,
          htmlScrollbarGutter: doc.style.scrollbarGutter,
          bodyOverflowY: body.style.overflowY,
          bodyOverflowX: body.style.overflowX,
          bodyOverscroll: body.style.overscrollBehavior,
          bodyScrollbarGutter: body.style.scrollbarGutter,
          bodyTouchAction: body.style.touchAction
        };

        // 스크롤바는 계속 보이게 하고, 실제 이동은 이벤트/scroll guard로 차단합니다.
        doc.style.overflowY = 'scroll';
        doc.style.overflowX = 'hidden';
        doc.style.overscrollBehavior = 'none';
        doc.style.scrollbarGutter = 'stable';
        body.style.overflowY = 'scroll';
        body.style.overflowX = 'hidden';
        body.style.overscrollBehavior = 'none';
        body.style.scrollbarGutter = 'stable';
        body.style.touchAction = 'none';
        containers.forEach(function(item){
          item.el.style.overscrollBehavior = 'none';
          item.el.style.touchAction = 'none';
        });
        body.classList.add('upick-hard-scroll-lock');
        doc.classList.add('upick-hard-scroll-lock');
        installGuards();
        window.scrollTo(x, y);
      }

      function restore(){
        if(!saved || hasReason()) return;
        var doc = document.documentElement;
        var body = document.body;
        var x = saved.x;
        var y = saved.y;
        removeGuards();
        doc.style.overflowY = saved.htmlOverflowY;
        doc.style.overflowX = saved.htmlOverflowX;
        doc.style.overscrollBehavior = saved.htmlOverscroll;
        doc.style.scrollbarGutter = saved.htmlScrollbarGutter;
        body.style.overflowY = saved.bodyOverflowY;
        body.style.overflowX = saved.bodyOverflowX;
        body.style.overscrollBehavior = saved.bodyOverscroll;
        body.style.scrollbarGutter = saved.bodyScrollbarGutter;
        body.style.touchAction = saved.bodyTouchAction;
        containers.forEach(function(item){
          if(item.el){
            item.el.style.overscrollBehavior = item.overscrollBehavior;
            item.el.style.touchAction = item.touchAction;
            try{ item.el.scrollTop = item.scrollTop; }catch(_){ }
          }
        });
        containers = [];
        saved = null;
        body.classList.remove('upick-hard-scroll-lock');
        doc.classList.remove('upick-hard-scroll-lock');
        requestAnimationFrame(function(){ window.scrollTo(x, y); });
      }

      return {
        lock:function(reason){ reasons[reason || 'default'] = true; apply(); },
        unlock:function(reason){ delete reasons[reason || 'default']; restore(); },
        sync:function(reason, active){ active ? this.lock(reason) : this.unlock(reason); },
        isLocked:function(){ return !!saved; },
        forceUnlock:function(){ reasons = {}; restore(); }
      };
    })();
  }

  function installAlertInteractionLock(){
    if(alertInteractionLockActive) return;
    alertInteractionLockActive = true;
    ALERT_LOCK_EVENTS.forEach(function(type){
      document.addEventListener(type, blockOutsideAlertInteraction, { capture:true, passive:false });
    });
  }

  function removeAlertInteractionLock(){
    if(!alertInteractionLockActive) return;
    ALERT_LOCK_EVENTS.forEach(function(type){
      document.removeEventListener(type, blockOutsideAlertInteraction, { capture:true });
    });
    alertInteractionLockActive = false;
  }


  function hasVisibleAppAlert(){
    var el = alertEl || qs('#appAlert');
    if(!el) return false;
    if(el.classList && el.classList.contains('show')) return true;
    if(el.tagName === 'DIALOG' && el.open && el.classList && el.classList.contains('show')) return true;
    return false;
  }
  window.__upickHasVisibleAppAlert = hasVisibleAppAlert;

  function forceClearAlertLockIfClosed(){
    if(hasVisibleAppAlert()) return;
    document.documentElement.classList.remove('upick-alert-open');
    document.body.classList.remove('upick-alert-open');
    removeAlertInteractionLock();
    if(window.__upickHardScrollFreeze){
      window.__upickHardScrollFreeze.unlock('alert');
    }
    if(typeof window.__upickSyncModalScrollLock === 'function'){
      window.__upickSyncModalScrollLock();
    }
  }

  function setOpenLock(open){
    document.documentElement.classList.toggle('upick-alert-open', !!open);
    document.body.classList.toggle('upick-alert-open', !!open);
    if(window.__upickHardScrollFreeze){
      window.__upickHardScrollFreeze.sync('alert', !!open);
    }
    if(open) installAlertInteractionLock();
    else removeAlertInteractionLock();
    if(typeof window.__upickSyncModalScrollLock === 'function'){
      setTimeout(window.__upickSyncModalScrollLock, 0);
      setTimeout(window.__upickSyncModalScrollLock, ALERT_CLOSE_DURATION + 40);
    }
  }

  function focusConfirm(){
    requestAnimationFrame(function(){
      try{ confirmBtn && confirmBtn.focus({preventScroll:true}); }catch(_){ try{ confirmBtn && confirmBtn.focus(); }catch(__){} }
    });
  }

  function getAlertPanel(){
    return alertEl ? qs('.app-alert-card', alertEl) : null;
  }

  function openNativeDialogIfNeeded(){
    if(typeof alertEl.showModal === 'function' && alertEl.tagName === 'DIALOG' && !alertEl.open){
      try{ alertEl.showModal(); }catch(_){ alertEl.setAttribute('open',''); }
    }
  }

  function closeNativeDialogIfNeeded(){
    if(alertEl && alertEl.tagName === 'DIALOG' && alertEl.open){
      try{ alertEl.close(); }catch(_){ alertEl.removeAttribute('open'); }
    }
  }

  function openLayer(){
    ensureAlert();
    lastFocus = document.activeElement;

    if(window.UpickMotion && typeof window.UpickMotion.open === 'function'){
      return window.UpickMotion.open(alertEl, {
        activeClass: 'show',
        panel: getAlertPanel(),
        duration: ALERT_OPEN_DURATION,
        beforeOpen: function(){
          openNativeDialogIfNeeded();
          setOpenLock(true);
        },
        afterOpen: focusConfirm
      });
    }

    alertEl.classList.add('show');
    alertEl.setAttribute('aria-hidden','false');
    setOpenLock(true);
    openNativeDialogIfNeeded();
    focusConfirm();
    return Promise.resolve(true);
  }

  function closeLayer(){
    if(!alertEl) return Promise.resolve(false);

    function afterClose(){
      closeNativeDialogIfNeeded();
      setOpenLock(false);
      forceClearAlertLockIfClosed();
      setTimeout(forceClearAlertLockIfClosed, ALERT_CLOSE_DURATION + 80);
      if(lastFocus && typeof lastFocus.focus === 'function'){
        try{ lastFocus.focus({preventScroll:true}); }catch(_){ try{ lastFocus.focus(); }catch(__){} }
      }
      lastFocus = null;
    }

    if(window.UpickMotion && typeof window.UpickMotion.close === 'function'){
      return window.UpickMotion.close(alertEl, {
        activeClass: 'show',
        panel: getAlertPanel(),
        duration: ALERT_CLOSE_DURATION,
        afterClose: afterClose
      });
    }

    alertEl.classList.remove('show');
    alertEl.setAttribute('aria-hidden','true');
    afterClose();
    return Promise.resolve(true);
  }

  function normalizeOptions(input, maybeOptions){
    var extra = {};
    if(typeof maybeOptions === 'function') extra.callback = maybeOptions;
    else if(maybeOptions && typeof maybeOptions === 'object') extra = maybeOptions;
    if(typeof input === 'string') return Object.assign({ message: input }, extra);
    return Object.assign({}, input || {}, extra);
  }

  function runAlertCallback(options, value){
    var callback = null;
    if(value === true){
      callback = options.onConfirm || options.callback || options.onClose;
    }else{
      callback = options.onCancel || options.callback || options.onClose;
    }
    if(typeof callback !== 'function') return Promise.resolve();
    try{
      return Promise.resolve(callback(value));
    }catch(error){
      return Promise.reject(error);
    }
  }

  function restoreAlertButtons(){
    if(confirmBtn) confirmBtn.disabled = false;
    if(cancelBtn) cancelBtn.disabled = false;
  }

  function showCommonAlert(input, maybeOptions){
    var options = normalizeOptions(input, maybeOptions);
    return enqueue(function(resolve){
      ensureAlert();
      titleEl.textContent = escapeText(options.title || '안내');
      messageEl.textContent = escapeText(options.message || '');
      confirmBtn.textContent = escapeText(options.confirmText || '확인');
      confirmBtn.setAttribute('aria-label', confirmBtn.textContent);
      cancelBtn.textContent = escapeText(options.cancelText || '취소');
      cancelBtn.classList.add('hidden');
      cancelBtn.setAttribute('aria-hidden','true');
      if(actionsEl){
        actionsEl.classList.add('is-alert');
        actionsEl.classList.remove('is-confirm');
      }
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      var closing = false;
      var finish = function(){
        if(closing) return;
        closing = true;
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        confirmBtn.disabled = true;
        if(cancelBtn) cancelBtn.disabled = true;

        Promise.resolve(closeLayer())
          .catch(function(){ return true; })
          .then(function(){
            // 콜백이 다른 팝업/GNB/시트 상태를 바꿔도 fade-out이 먼저 끝나도록 합니다.
            return runAlertCallback(options, true).catch(function(error){
              console.warn('[UpickAlert] callback failed:', error);
            });
          })
          .then(function(){ resolve(true); })
          .finally(function(){ restoreAlertButtons(); setTimeout(forceClearAlertLockIfClosed, 0); setTimeout(forceClearAlertLockIfClosed, 120); });
      };
      confirmBtn.onclick = finish;
      openLayer();
    });
  }

  function showCommonConfirm(input, maybeOptions){
    var options = normalizeOptions(input, maybeOptions);
    return enqueue(function(resolve){
      ensureAlert();
      titleEl.textContent = escapeText(options.title || '확인');
      messageEl.textContent = escapeText(options.message || '');
      confirmBtn.textContent = escapeText(options.confirmText || '확인');
      cancelBtn.textContent = escapeText(options.cancelText || '취소');
      confirmBtn.setAttribute('aria-label', confirmBtn.textContent);
      cancelBtn.setAttribute('aria-label', cancelBtn.textContent);
      cancelBtn.classList.remove('hidden');
      cancelBtn.removeAttribute('aria-hidden');
      if(actionsEl){
        actionsEl.classList.add('is-confirm');
        actionsEl.classList.remove('is-alert');
      }
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      var closing = false;
      var finish = function(value){
        if(closing) return;
        closing = true;
        var result = !!value;
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        confirmBtn.disabled = true;
        if(cancelBtn) cancelBtn.disabled = true;

        Promise.resolve(closeLayer())
          .catch(function(){ return true; })
          .then(function(){
            // confirm/cancel 각각의 콜백도 닫힘 모션 완료 후 실행합니다.
            return runAlertCallback(options, result).catch(function(error){
              console.warn('[UpickAlert] callback failed:', error);
            });
          })
          .then(function(){ resolve(result); })
          .finally(function(){ restoreAlertButtons(); setTimeout(forceClearAlertLockIfClosed, 0); setTimeout(forceClearAlertLockIfClosed, 120); });
      };
      confirmBtn.onclick = function(){ finish(true); };
      cancelBtn.onclick = function(){ finish(false); };
      openLayer();
    });
  }

  function enqueue(job){
    queue = queue.catch(function(){}).then(function(){
      return new Promise(job);
    });
    return queue;
  }

  document.addEventListener('keydown', function(event){
    if(!alertEl || !alertEl.classList.contains('show')) return;
    if(event.key === 'Escape'){
      event.preventDefault();
      event.stopPropagation();
      if(event.stopImmediatePropagation) event.stopImmediatePropagation();
      if(cancelBtn && !cancelBtn.classList.contains('hidden')) cancelBtn.click();
      else if(confirmBtn) confirmBtn.click();
    }
  }, true);

  function focusAfterClose(target){
    if(target && typeof target.focus === 'function'){
      try{ target.focus({preventScroll:true}); }catch(_){ try{ target.focus(); }catch(__){} }
    }
  }

  function openModalAlertCompat(message, focusTarget, title){
    return showCommonAlert({
      title: title || '안내',
      message: message || '',
      confirmText: '확인',
      onClose: function(){ focusAfterClose(focusTarget); }
    });
  }

  function openModalConfirmCompat(message, focusTarget, title, confirmText, cancelText){
    return showCommonConfirm({
      title: title || '확인',
      message: message || '',
      confirmText: confirmText || '확인',
      cancelText: cancelText || '취소',
      onCancel: function(){ focusAfterClose(focusTarget); }
    });
  }

  window.UpickAlert = Object.assign(window.UpickAlert || {}, {
    alert: showCommonAlert,
    confirm: showCommonConfirm,
    openModalAlert: openModalAlertCompat,
    openModalConfirm: openModalConfirmCompat,
    closeDuration: ALERT_CLOSE_DURATION,
    openDuration: ALERT_OPEN_DURATION
  });

  window.showCommonAlert = showCommonAlert;
  window.showCommonConfirm = showCommonConfirm;
  window.showAppAlert = showCommonAlert;
  window.showAppConfirm = showCommonConfirm;
  window.showAlert = showCommonAlert;
  window.showConfirm = showCommonConfirm;
  if(!window.openModalAlert) window.openModalAlert = openModalAlertCompat;
  if(!window.openModalConfirm) window.openModalConfirm = openModalConfirmCompat;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureAlert, {once:true});
  else ensureAlert();
})();


/* upickAlertOverLoadingFix: 알럿이 로딩바와 동시에 떠도 확인 버튼 클릭 가능 */
(function(){
  window.upickAlertOverLoadingFix = function(){
    var loaders = document.querySelectorAll('#globalLoadingBar,.global-loading,.page-loader');
    loaders.forEach(function(el){
      el.style.pointerEvents = 'none';
      el.style.zIndex = '2147483000';
    });
    document.querySelectorAll('dialog[open], #appAlert, .common-alert, .app-alert, .modal-alert, .alert-backdrop, .common-alert-backdrop').forEach(function(el){
      el.style.zIndex = '2147483600';
      el.style.pointerEvents = 'auto';
    });
  };
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('dialog[open], #appAlert, .common-alert, .app-alert, .modal-alert')){
      window.upickAlertOverLoadingFix();
    }
  }, true);
})();


/* ===== Fix v4 revised: 알럿 버튼 클릭 보장 보정 =====
   더 이상 modal/alert 잠금 클래스를 제거하지 않습니다.
   잠금 클래스 제거가 관리자/입장/계정 만들기 페이지의 배경 스크롤 재활성화와
   확인 후 lock 잔류를 유발할 수 있어, 로딩바 pointer-events/z-index만 정리합니다. */
(function(){
  function hasVisibleAlert(){
    return !!document.querySelector(
      '#appAlert.show, dialog.app-alert[open], .common-alert.show, .app-alert.show, .modal-alert.show, [data-upick-common-alert][open]'
    );
  }

  function keepAlertClickable(){
    if(!hasVisibleAlert()) return;

    document.querySelectorAll('#globalLoadingBar,.global-loading,.page-loader').forEach(function(loader){
      loader.style.pointerEvents = 'none';
      loader.style.zIndex = '2147483000';
    });

    document.querySelectorAll('#appAlert.show, dialog.app-alert[open], .common-alert.show, .app-alert.show, .modal-alert.show').forEach(function(alertNode){
      alertNode.style.zIndex = '2147483600';
    });

    document.querySelectorAll('#appAlert.show .app-alert-card, #appAlert.show .app-alert-card *, dialog.app-alert[open] .app-alert-card, dialog.app-alert[open] .app-alert-card *, .common-alert.show button, .app-alert.show button, .modal-alert.show button').forEach(function(el){
      el.style.pointerEvents = 'auto';
    });
  }

  window.__upickUnlockForAlertClick = keepAlertClickable;

  document.addEventListener('click', function(event){
    if(event.target && event.target.closest && event.target.closest('#appAlert, dialog.app-alert, .common-alert, .app-alert, .modal-alert')){
      keepAlertClickable();
    }
  }, true);

  document.addEventListener('keydown', function(event){
    if(event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') keepAlertClickable();
  }, true);

  document.addEventListener('DOMContentLoaded', keepAlertClickable);
  window.addEventListener('load', keepAlertClickable);
})();

/* ===== Fix v20260527-3: 알럿/바텀팝업/모달 공통 스크롤 잠금 매니저 ===== */
(function(){
  'use strict';

  var scrollLockActive = false;
  var selectors = [
    '#appAlert.show',
    'dialog.app-alert[open]',
    '.app-alert.show',
    '.common-alert.show',
    '.modal-alert.show',
    '.common-modal-overlay.show',
    '.common-modal-overlay.is-open',
    '.common-modal-overlay[open]',
    '.modal-backdrop.show',
    '.modal-backdrop.is-open',
    'dialog[open]',
    '.sheet-modal.show',
    '.sheet-modal.is-open',
    '.bottom-sheet.show',
    '.bottom-sheet.is-open',
    '.auth-bottom-sheet.show',
    '.auth-bottom-sheet.is-open',
    '.account-recovery-sheet.show',
    '.account-recovery-sheet.is-open',
    '.admin-modal.show',
    '.admin-modal.is-open',
    '.admin-dialog.show',
    '.admin-dialog.is-open',
    '.modal.show',
    '.modal.is-open',
    '.modal-overlay.show',
    '.modal-overlay.is-open',
    '#gnbSheet.show',
    '.gnb-sheet.show'
  ];

  function isActuallyVisible(el){
    if(!el || el.closest('[aria-hidden="true"]')) return false;
    if(el.matches && el.matches('#appAlert') && !el.classList.contains('show')) return false;
    var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if(style && (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 && !el.classList.contains('upick-motion-closing'))) return false;
    return !!(el.offsetWidth || el.offsetHeight || (el.getClientRects && el.getClientRects().length));
  }

  function findOpenLayer(){
    for(var i=0;i<selectors.length;i++){
      var list = document.querySelectorAll(selectors[i]);
      for(var j=0;j<list.length;j++){
        if(isActuallyVisible(list[j])) return list[j];
      }
    }
    return null;
  }

  function allowScrollInside(target){
    if(!target || !target.closest) return false;
    return !!target.closest('.app-alert-card,.common-modal-overlay,.sheet-modal.show,.sheet-modal.is-open,.bottom-sheet.show,.bottom-sheet.is-open,.auth-bottom-sheet.show,.auth-bottom-sheet.is-open,.account-recovery-sheet.show,.account-recovery-sheet.is-open,.admin-modal.show,.admin-modal.is-open,.admin-dialog.show,.admin-dialog.is-open,.modal.show,.modal.is-open,dialog[open],#gnbSheet.show,.gnb-sheet.show');
  }

  function blockBackgroundScroll(event){
    if(!scrollLockActive) return;
    if(allowScrollInside(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation) event.stopImmediatePropagation();
  }

  function setLayerLock(active){
    active = !!active;
    if(scrollLockActive === active) return;
    scrollLockActive = active;
    document.documentElement.classList.toggle('upick-layer-scroll-lock', active);
    document.body.classList.toggle('upick-layer-scroll-lock', active);
    if(window.__upickHardScrollFreeze){
      window.__upickHardScrollFreeze.sync('layer', active);
    }
  }

  function hasVisibleAppAlertSafe(){
    if(typeof window.__upickHasVisibleAppAlert === 'function'){
      try{ return !!window.__upickHasVisibleAppAlert(); }catch(_){ }
    }
    var el = document.querySelector('#appAlert');
    if(!el) return false;
    if(el.classList && el.classList.contains('show')) return true;
    if(el.tagName === 'DIALOG' && el.open && el.classList && el.classList.contains('show')) return true;
    return false;
  }

  function sync(){
    var openLayer = !!findOpenLayer();
    setLayerLock(openLayer);
    if(!openLayer && !hasVisibleAppAlertSafe()){
      document.documentElement.classList.remove('upick-alert-open');
      document.body.classList.remove('upick-alert-open');
      if(window.__upickHardScrollFreeze){
        window.__upickHardScrollFreeze.unlock('alert');
        window.__upickHardScrollFreeze.unlock('layer');
      }
    }
  }

  window.__upickSyncModalScrollLock = sync;

  document.addEventListener('wheel', blockBackgroundScroll, {capture:true, passive:false});
  document.addEventListener('touchmove', blockBackgroundScroll, {capture:true, passive:false});
  document.addEventListener('scroll', function(){
    if(scrollLockActive && !findOpenLayer()) setLayerLock(false);
  }, true);

  if(window.MutationObserver){
    new MutationObserver(function(){
      requestAnimationFrame(sync);
    }).observe(document.documentElement, {
      subtree:true,
      childList:true,
      attributes:true,
      attributeFilter:['class','style','open','aria-hidden','hidden']
    });
  }

  document.addEventListener('DOMContentLoaded', sync);
  window.addEventListener('load', sync);
  window.addEventListener('resize', sync);
  setTimeout(sync, 0);
})();
