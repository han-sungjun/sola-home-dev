(function(){
  'use strict';

  var root = null;
  var overlay = null;
  var stage = null;
  var scrollY = 0;
  var currentContent = null;
  var currentOptions = null;
  var currentPlaceholder = null;
  var initialized = false;
  var closeTimer = null;

  function ensureRoot(){
    if(root) return root;
    root = document.getElementById('commonModalRoot');
    if(!root){
      root = document.createElement('div');
      root.id = 'commonModalRoot';
      root.className = 'common-modal-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function lockBody(){
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('common-modal-lock');
    document.body.classList.add('common-modal-lock');
    document.body.style.top = '-' + scrollY + 'px';
  }

  function unlockBody(){
    document.documentElement.classList.remove('common-modal-lock');
    document.body.classList.remove('common-modal-lock');
    document.body.style.top = '';
    window.scrollTo(0, scrollY || 0);
  }

  function focusFirst(selector){
    window.setTimeout(function(){
      var target = selector && stage ? stage.querySelector(selector) : null;
      if(!target && stage) target = stage.querySelector('[autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if(target && target.focus) target.focus({preventScroll:true});
    }, 30);
  }

  function close(){
    if(!overlay) return;
    var targetOverlay = overlay;
    var targetStage = stage;
    var opts = currentOptions || {};
    var content = currentContent;
    if(closeTimer) window.clearTimeout(closeTimer);
    targetOverlay.classList.add('is-closing');
    targetOverlay.classList.remove('is-open');
    if(targetStage) targetStage.classList.add('is-closing');
    closeTimer = window.setTimeout(function(){
      if(content && currentPlaceholder && currentPlaceholder.parentNode){
        currentPlaceholder.parentNode.insertBefore(content, currentPlaceholder);
        currentPlaceholder.remove();
      }else if(content && content.parentNode){
        content.parentNode.removeChild(content);
      }
      document.removeEventListener('keydown', trapEsc, true);
      if(targetOverlay && targetOverlay.parentNode) targetOverlay.remove();
      overlay = null;
      stage = null;
      currentContent = null;
      currentOptions = null;
      currentPlaceholder = null;
      closeTimer = null;
      unlockBody();
      if(typeof opts.onClose === 'function') opts.onClose(content);
    }, 240);
  }

  function open(options){
    options = options || {};
    close();
    ensureRoot();

    var content = options.content;
    if(typeof content === 'string'){
      var template = document.createElement('template');
      template.innerHTML = content.trim();
      content = template.content.firstElementChild;
    }
    if(!content) return null;

    overlay = document.createElement('div');
    overlay.className = 'common-modal-overlay' + (options.overlayClass ? ' ' + options.overlayClass : '');
    overlay.setAttribute('role','presentation');

    stage = document.createElement('div');
    stage.className = 'common-modal-stage' + (options.stageClass ? ' ' + options.stageClass : '');
    stage.setAttribute('role','dialog');
    stage.setAttribute('aria-modal','true');
    if(options.labelledby) stage.setAttribute('aria-labelledby', options.labelledby);

    if(content.parentNode){
      currentPlaceholder = document.createComment('common-modal-placeholder');
      content.parentNode.insertBefore(currentPlaceholder, content);
    }
    stage.appendChild(content);
    overlay.appendChild(stage);
    root.appendChild(overlay);
    requestAnimationFrame(function(){
      if(overlay) overlay.classList.add('is-open');
    });

    overlay.addEventListener('click', function(event){
      if(event.target === overlay){
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
    document.addEventListener('keydown', trapEsc, true);

    currentContent = content;
    currentOptions = options;
    lockBody();
    focusFirst(options.initialFocusSelector);
    return content;
  }

  function trapEsc(event){
    if(!overlay) return;
    if(event.key === 'Escape'){
      event.preventDefault();
      event.stopPropagation();
      if(currentOptions && currentOptions.allowEscClose === true) close();
    }
  }

  function init(){
    if(initialized) return;
    initialized = true;
    ensureRoot();
  }

  window.CommonModal = { init:init, open:open, close:close, isOpen:function(){ return !!overlay; } };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

/* ===== v70: native <dialog> fade-in/out bridge ===== */
(function(){
  'use strict';
  if(!window.HTMLDialogElement || window.__upickDialogMotionPatched) return;
  window.__upickDialogMotionPatched = true;
  var proto = window.HTMLDialogElement.prototype;
  var nativeShowModal = proto.showModal;
  var nativeShow = proto.show;
  var nativeClose = proto.close;
  var DURATION = 240;

  function shouldSkip(dialog){
    return !dialog || dialog.classList.contains('app-alert') || dialog.dataset.motion === 'none';
  }
  function prepareOpen(dialog){
    if(shouldSkip(dialog)) return;
    bindCloseGuards(dialog);
    dialog.classList.add('upick-dialog-motion');
    dialog.classList.remove('is-open','is-closing');
    dialog.setAttribute('aria-hidden','true');
  }
  function markOpen(dialog){
    if(shouldSkip(dialog)) return;
    dialog.classList.remove('is-closing');
    dialog.classList.add('upick-dialog-motion');
    dialog.setAttribute('aria-hidden','false');
    // 최초 호출 시에도 opacity:0/transform 초기 상태가 먼저 계산되도록 한 프레임을 보장합니다.
    // showModal() 직후 같은 프레임에 is-open을 붙이면 첫 1회만 페이드가 생략될 수 있습니다.
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(dialog.open && !dialog.__upickDialogClosing){
          dialog.classList.add('is-open');
        }
      });
    });
  }
  function cancelClosing(dialog){
    if(!dialog) return;
    if(dialog.__upickDialogCloseTimer){
      clearTimeout(dialog.__upickDialogCloseTimer);
      dialog.__upickDialogCloseTimer = null;
    }
    dialog.__upickDialogClosing = false;
    dialog.classList.remove('is-closing');
  }
  function bindCloseGuards(dialog){
    if(!dialog || dialog.__upickDialogCloseGuardsBound) return;
    dialog.__upickDialogCloseGuardsBound = true;
    dialog.addEventListener('cancel', function(event){
      if(shouldSkip(dialog) || dialog.__upickDialogForceClose) return;
      event.preventDefault();
      dialog.close();
    }, true);
    dialog.addEventListener('close', function(){
      if(shouldSkip(dialog)) return;
      if(dialog.__upickDialogCloseTimer){
        clearTimeout(dialog.__upickDialogCloseTimer);
        dialog.__upickDialogCloseTimer = null;
      }
      dialog.__upickDialogClosing = false;
      dialog.classList.remove('is-closing','is-open');
      dialog.setAttribute('aria-hidden','true');
    });
  }

  proto.showModal = function(){
    cancelClosing(this);
    prepareOpen(this);
    if(!this.open) nativeShowModal.apply(this, arguments);
    markOpen(this);
  };
  proto.show = function(){
    cancelClosing(this);
    prepareOpen(this);
    if(!this.open) nativeShow.apply(this, arguments);
    markOpen(this);
  };
  proto.close = function(returnValue){
    var dialog = this;
    if(shouldSkip(dialog) || dialog.__upickDialogForceClose || !dialog.open){
      return nativeClose.apply(dialog, arguments);
    }
    if(dialog.__upickDialogClosing) return;
    dialog.__upickDialogClosing = true;
    dialog.classList.add('is-closing');
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden','true');
    dialog.__upickDialogCloseTimer = setTimeout(function(){
      dialog.__upickDialogForceClose = true;
      try{ nativeClose.call(dialog, returnValue); }
      finally{
        dialog.__upickDialogForceClose = false;
        dialog.__upickDialogClosing = false;
        dialog.__upickDialogCloseTimer = null;
        dialog.classList.remove('is-closing','is-open');
      }
    }, DURATION);
  };
})();
