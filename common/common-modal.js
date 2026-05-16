(function(){
  'use strict';

  var scrollY = 0;
  var openCount = 0;
  var initialized = false;

  function isDialogModalTarget(dialog){
    if(!dialog || dialog.tagName !== 'DIALOG') return false;
    if(dialog.classList.contains('app-alert')) return false; // alert/confirm은 common-alert가 담당
    return true;
  }

  function lockBody(){
    if(openCount > 0) return;
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('common-modal-lock');
    document.body.classList.add('common-modal-lock');
    document.body.style.top = '-' + scrollY + 'px';
  }

  function unlockBody(){
    if(openCount > 0) return;
    document.documentElement.classList.remove('common-modal-lock');
    document.body.classList.remove('common-modal-lock');
    document.body.style.top = '';
    window.scrollTo(0, scrollY || 0);
  }

  function markDialog(dialog){
    if(!isDialogModalTarget(dialog)) return dialog;
    dialog.dataset.commonModal = 'true';
    dialog.classList.add('common-modal');
    dialog.classList.add('common-modal--scroll');
    dialog.addEventListener('cancel', function(event){
      // ESC/뒤로가기성 닫힘은 기존 정책과 동일하게 방지
      if(dialog.dataset.allowEscClose !== 'true') event.preventDefault();
    });
    return dialog;
  }

  function markAllDialogs(root){
    Array.prototype.forEach.call((root || document).querySelectorAll('dialog'), markDialog);
  }

  function afterOpen(dialog){
    if(!isDialogModalTarget(dialog)) return;
    markDialog(dialog);
    if(dialog.dataset.commonModalOpened === 'true') return;
    dialog.dataset.commonModalOpened = 'true';
    openCount += 1;
    lockBody();
  }

  function afterClose(dialog){
    if(!isDialogModalTarget(dialog)) return;
    if(dialog.dataset.commonModalOpened !== 'true') return;
    dialog.dataset.commonModalOpened = 'false';
    openCount = Math.max(0, openCount - 1);
    unlockBody();
  }

  function patchDialogPrototype(){
    if(!window.HTMLDialogElement || window.HTMLDialogElement.__commonModalPatched) return;
    var proto = window.HTMLDialogElement.prototype;
    var nativeShowModal = proto.showModal;
    var nativeShow = proto.show;
    var nativeClose = proto.close;

    if(typeof nativeShowModal === 'function'){
      proto.showModal = function(){
        markDialog(this);
        var result = nativeShowModal.apply(this, arguments);
        afterOpen(this);
        return result;
      };
    }
    if(typeof nativeShow === 'function'){
      proto.show = function(){
        markDialog(this);
        var result = nativeShow.apply(this, arguments);
        afterOpen(this);
        return result;
      };
    }
    if(typeof nativeClose === 'function'){
      proto.close = function(){
        var result = nativeClose.apply(this, arguments);
        afterClose(this);
        return result;
      };
    }
    window.HTMLDialogElement.__commonModalPatched = true;
  }

  function observeDynamicDialogs(){
    if(!window.MutationObserver) return;
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        Array.prototype.forEach.call(mutation.addedNodes || [], function(node){
          if(!node || node.nodeType !== 1) return;
          if(node.tagName === 'DIALOG') markDialog(node);
          else if(node.querySelectorAll) markAllDialogs(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  function setupBackdropGuard(){
    document.addEventListener('click', function(event){
      var dialog = event.target && event.target.closest ? event.target.closest('dialog.common-modal,[data-common-modal="true"]') : null;
      if(!dialog) return;
      // dialog 자체/backdrop 영역 클릭으로 닫히지 않게 유지
      if(event.target === dialog){
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }

  function init(){
    if(initialized) return;
    initialized = true;
    patchDialogPrototype();
    markAllDialogs(document);
    observeDynamicDialogs();
    setupBackdropGuard();
  }

  window.CommonModal = {
    init:init,
    prepare:markDialog,
    open:function(dialog){
      dialog = typeof dialog === 'string' ? document.querySelector(dialog) : dialog;
      if(!dialog) return;
      markDialog(dialog);
      if(typeof dialog.showModal === 'function') dialog.showModal();
      else { dialog.setAttribute('open',''); afterOpen(dialog); }
    },
    close:function(dialog){
      dialog = typeof dialog === 'string' ? document.querySelector(dialog) : dialog;
      if(!dialog) return;
      if(typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); afterClose(dialog); }
    }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
