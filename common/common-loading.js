(function(){
  'use strict';

  var DEFAULT_STEPS = [
    { at: 0, main: '입주민 전용 서비스를 연결하고 있어요', sub: '잠시만 기다려주세요' },
    { at: 1200, main: '편리한 혜택 정보를 준비하고 있어요', sub: '곧 이용하실 수 있어요' },
    { at: 3200, main: '안전하게 데이터를 확인하고 있어요', sub: '네트워크 상태에 따라 조금 더 걸릴 수 있어요' },
    { at: 5600, main: '거의 준비가 완료되었어요', sub: '잠시 후 자동으로 연결됩니다' }
  ];

  var ADMIN_STEPS = [
    { at: 0, main: '운영자 전용 서비스를 연결하고 있어요', sub: '잠시만 기다려주세요' },
    { at: 1200, main: '관리자 데이터를 확인하고 있어요', sub: '운영 화면을 준비 중입니다' },
    { at: 3200, main: '안전하게 권한을 확인하고 있어요', sub: '네트워크 상태에 따라 조금 더 걸릴 수 있어요' },
    { at: 5600, main: '거의 준비가 완료되었어요', sub: '잠시 후 자동으로 연결됩니다' }
  ];

  var boundLoaders = new WeakMap();
  var hideTimer = null;
  var rafLockId = null;

  function isAdminPage(){
    return /sola-admin/i.test(location.pathname) || document.body.classList.contains('admin-page');
  }

  function hasVisibleInitialLoader(){
    var existing = document.getElementById('globalLoadingBar') || document.getElementById('pageLoader');
    if(!existing) return null;
    var initial = existing.dataset && existing.dataset.initialAppLoading === '1';
    if(initial || isVisible(existing)) return existing;
    return null;
  }

  function ensurePlainLoader(){
    var loader = document.getElementById('globalLoadingBar') || document.getElementById('pageLoader');
    if(loader) return loader;
    loader = document.createElement('div');
    loader.id = 'globalLoadingBar';
    loader.className = 'global-loading';
    loader.setAttribute('aria-hidden','true');
    document.body.insertBefore(loader, document.body.firstChild);
    return loader;
  }

  function ensureLoader(forceTopLayer){
    // 개발계는 기존 DOM 기반 로딩바만 사용합니다.
    // dialog top-layer 로딩은 투명 레이어 잔존/클릭 차단 문제가 있어 사용하지 않습니다.
    var initial = hasVisibleInitialLoader();
    if(initial) return initial;
    return ensurePlainLoader();
  }

  function ensureMarkup(loader){
    if(!loader) return;
    loader.classList.add('upick-loader-enhanced');
    var content = loader.querySelector(':scope > .loader-content') || loader.querySelector('.loader-content');
    if(!content){
      content = document.createElement('div');
      content.className = 'loader-content';
      content.setAttribute('role','status');
      content.setAttribute('aria-live','polite');
      while(loader.firstChild) content.appendChild(loader.firstChild);
      loader.appendChild(content);
    }else{
      content.setAttribute('role','status');
      content.setAttribute('aria-live','polite');
    }

    var mark = content.querySelector('.loader-mark') || loader.querySelector('.loader-mark');
    if(!mark){
      mark = document.createElement('div');
      mark.className = 'loader-mark';
      mark.setAttribute('aria-label','로딩 중');
      content.insertBefore(mark, content.firstChild);
    }else if(mark.parentNode !== content){
      content.insertBefore(mark, content.firstChild);
    }
    mark.setAttribute('aria-label','로딩 중');

    var copy = content.querySelector('.loader-copy') || loader.querySelector('.loader-copy');
    if(!copy){
      copy = document.createElement('div');
      copy.className = 'loader-copy';
      copy.setAttribute('aria-hidden','true');
      content.appendChild(copy);
    }else if(copy.parentNode !== content){
      content.appendChild(copy);
    }
    if(!copy.querySelector('.loader-message')){
      var main = document.createElement('p');
      main.className = 'loader-message';
      copy.appendChild(main);
    }
    if(!copy.querySelector('.loader-sub-message')){
      var sub = document.createElement('p');
      sub.className = 'loader-sub-message';
      copy.appendChild(sub);
    }
  }

  function isVisible(loader){
    if(!loader) return false;
    return loader.classList.contains('show') ||
      loader.classList.contains('is-visible') ||
      loader.getAttribute('aria-hidden') === 'false';
  }

  function syncLock(){
    if(rafLockId) return;
    rafLockId = window.requestAnimationFrame(function(){
      rafLockId = null;
      var active = Array.prototype.some.call(
        document.querySelectorAll('#pageLoader,#globalLoadingBar,.page-loader,.global-loading'),
        isVisible
      );
      document.documentElement.classList.toggle('upick-loading-lock', active);
      document.body.classList.toggle('upick-loading-lock', active);
    });
  }

  function bind(loader){
    if(!loader || boundLoaders.has(loader)) return;
    ensureMarkup(loader);

    var state = { timers: [] };
    boundLoaders.set(loader, state);

    function clearTimers(){
      state.timers.forEach(function(id){ clearTimeout(id); });
      state.timers = [];
    }

    function setMessage(step){
      ensureMarkup(loader);
      var copy = loader.querySelector('.loader-copy');
      var main = loader.querySelector('.loader-message');
      var sub = loader.querySelector('.loader-sub-message');
      if(!copy || !main || !sub) return;
      copy.classList.add('is-changing');
      window.setTimeout(function(){
        main.textContent = step.main;
        sub.textContent = step.sub;
        copy.classList.remove('is-changing');
      }, 140);
    }

    function start(){
      clearTimers();
      var steps = loader.dataset.loadingMode === 'admin' || isAdminPage() ? ADMIN_STEPS : DEFAULT_STEPS;
      steps.forEach(function(step){
        state.timers.push(window.setTimeout(function(){ setMessage(step); }, step.at));
      });
      syncLock();
    }

    function stop(){
      clearTimers();
      syncLock();
    }

    state.visible = null;

    function syncState(){
      var visible = isVisible(loader);
      if(state.visible === visible){
        syncLock();
        return;
      }
      state.visible = visible;
      visible ? start() : stop();
    }

    var observer = new MutationObserver(syncState);
    observer.observe(loader, { attributes:true, attributeFilter:['class','aria-hidden'] });

    syncState();
  }

  function hideOne(loader){
    if(!loader) return;
    loader.classList.remove('show','is-visible');
    loader.setAttribute('aria-hidden','true');
    if(loader.dataset) delete loader.dataset.initialAppLoading;
  }

  function init(){
    // 성능 안정화: 전체 문서 subtree 감시는 제거합니다.
    // 기존 로더는 초기 1회만 바인딩하고, 동적 로더는 show() 호출 시 ensureLoader()에서 직접 바인딩합니다.
    document.querySelectorAll('#pageLoader,#globalLoadingBar,.page-loader,.global-loading').forEach(bind);
    syncLock();
  }

  window.UpickLoading = {
    show: function(message, subMessage){
      if(hideTimer){ clearTimeout(hideTimer); hideTimer = null; }
      var loader = ensureLoader(false);
      bind(loader);
      ensureMarkup(loader);
      if(message || subMessage){
        var main = loader.querySelector('.loader-message');
        var sub = loader.querySelector('.loader-sub-message');
        if(main && message) main.textContent = message;
        if(sub && subMessage) sub.textContent = subMessage;
      }
      loader.classList.add('show');
      loader.setAttribute('aria-hidden','false');
      syncLock();
      return loader;
    },
    hide: function(){
      if(hideTimer) clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function(){
        document.querySelectorAll('#pageLoader,#globalLoadingBar,.page-loader,.global-loading').forEach(hideOne);
        syncLock();
        hideTimer = null;
      }, 0);
    },
    bind: bind,
    refresh: init,
  };

  // 기존 코드가 showGlobalLoading/hideGlobalLoading 이름을 쓰는 경우도 공통 로딩으로 연결합니다. v2026051610
  window.showGlobalLoading = window.showGlobalLoading || function(message, subMessage){ return window.UpickLoading.show(message, subMessage); };
  window.hideGlobalLoading = window.hideGlobalLoading || function(){ return window.UpickLoading.hide(); };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once:true });
  }else{
    init();
  }
})();
