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

  function isAdminPage(){
    return /sola-admin/i.test(location.pathname) || document.body.classList.contains('admin-page');
  }

  function ensureLoader(){
    var loader = document.getElementById('globalLoadingBar') || document.getElementById('pageLoader');
    if(loader) return loader;
    loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-loader';
    loader.setAttribute('aria-hidden','true');
    document.body.appendChild(loader);
    return loader;
  }

  function ensureMarkup(loader){
    if(!loader) return;
    var content = loader.querySelector('.loader-content');
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
    var active = Array.prototype.some.call(
      document.querySelectorAll('#pageLoader,#globalLoadingBar,.page-loader,.global-loading'),
      isVisible
    );
    document.documentElement.classList.toggle('upick-loading-lock', active);
    document.body.classList.toggle('upick-loading-lock', active);
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

    var observer = new MutationObserver(function(){
      ensureMarkup(loader);
      isVisible(loader) ? start() : stop();
    });
    observer.observe(loader, { attributes:true, attributeFilter:['class','aria-hidden','style'] });

    if(isVisible(loader)) start();
  }

  function init(){
    document.querySelectorAll('#pageLoader,#globalLoadingBar,.page-loader,.global-loading').forEach(bind);
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        mutation.addedNodes && Array.prototype.forEach.call(mutation.addedNodes, function(node){
          if(!node || node.nodeType !== 1) return;
          if(node.matches && node.matches('#pageLoader,#globalLoadingBar,.page-loader,.global-loading')) bind(node);
          if(node.querySelectorAll) node.querySelectorAll('#pageLoader,#globalLoadingBar,.page-loader,.global-loading').forEach(bind);
        });
      });
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    syncLock();
  }

  window.UpickLoading = {
    show: function(message, subMessage){
      var loader = ensureLoader();
      bind(loader);
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
      document.querySelectorAll('#pageLoader,#globalLoadingBar,.page-loader,.global-loading').forEach(function(loader){
        loader.classList.remove('show','is-visible');
        loader.setAttribute('aria-hidden','true');
      });
      syncLock();
    },
    bind: bind,
    refresh: init
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once:true });
  }else{
    init();
  }
})();
