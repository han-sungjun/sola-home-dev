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

  function installAlertInteractionLock(){
    if(alertInteractionLockActive) return;
    alertInteractionLockActive = true;
    ['pointerdown','mousedown','touchstart','click','dblclick'].forEach(function(type){
      document.addEventListener(type, blockOutsideAlertInteraction, true);
    });
  }

  function removeAlertInteractionLock(){
    if(!alertInteractionLockActive) return;
    ['pointerdown','mousedown','touchstart','click','dblclick'].forEach(function(type){
      document.removeEventListener(type, blockOutsideAlertInteraction, true);
    });
    alertInteractionLockActive = false;
  }

  function setOpenLock(open){
    document.documentElement.classList.toggle('upick-alert-open', !!open);
    document.body.classList.toggle('upick-alert-open', !!open);
    if(open) installAlertInteractionLock();
    else removeAlertInteractionLock();
    if(typeof window.__upickSyncModalScrollLock === 'function'){
      setTimeout(window.__upickSyncModalScrollLock, 0);
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
          .finally(restoreAlertButtons);
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
          .finally(restoreAlertButtons);
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


/* ===== Fix v4: 알럿 표시 중 로딩 잠금 클래스가 확인 버튼을 막지 않도록 강제 해제 ===== */
(function(){
  const LOCK_CLASSES = [
    'upick-loading-lock',
    'ui-loading-lock',
    'upick-modal-lock',
    'upick-modal-hard-lock'
  ];

  function hasVisibleAlert(){
    return !!document.querySelector(
      'dialog[open], #appAlert[open], #appAlert.show, .common-alert.show, .app-alert.show, .modal-alert.show, [data-upick-common-alert][open]'
    );
  }

  function unlockForAlertClick(){
    if(!hasVisibleAlert()) return;

    LOCK_CLASSES.forEach(function(cls){
      document.body && document.body.classList.remove(cls);
      document.documentElement && document.documentElement.classList.remove(cls);
    });

    document.querySelectorAll('#globalLoadingBar,.global-loading,.page-loader').forEach(function(loader){
      loader.style.pointerEvents = 'none';
      loader.style.zIndex = '2147483000';
      loader.classList.remove('show');
      loader.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('dialog[open], #appAlert, .common-alert, .app-alert, .modal-alert').forEach(function(alertEl){
      alertEl.style.pointerEvents = 'auto';
      alertEl.style.zIndex = '2147483600';
    });

    document.querySelectorAll('dialog[open] button, #appAlert button, .common-alert button, .app-alert button, .modal-alert button').forEach(function(btn){
      btn.style.pointerEvents = 'auto';
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
    });
  }

  window.__upickUnlockForAlertClick = unlockForAlertClick;

  document.addEventListener('click', function(event){
    if(event.target && event.target.closest && event.target.closest('dialog[open], #appAlert, .common-alert, .app-alert, .modal-alert')){
      unlockForAlertClick();
    }
  }, true);

  document.addEventListener('keydown', function(event){
    if(event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') unlockForAlertClick();
  }, true);

  const timer = setInterval(unlockForAlertClick, 180);
  window.addEventListener('beforeunload', function(){ clearInterval(timer); });
  document.addEventListener('DOMContentLoaded', unlockForAlertClick);
  window.addEventListener('load', unlockForAlertClick);
})();
