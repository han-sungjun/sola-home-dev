
(function(){
  'use strict';
  var active = false;
  var sx = 0;
  var sy = 0;
  var moved = false;
  var suppressNextClick = false;
  function point(e){
    var s = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return { x: Number(s.clientX || 0), y: Number(s.clientY || 0) };
  }
  function isSliderTarget(target){
    return !!(target && target.closest && target.closest('#detailModal .benefit-detail-photo-slider'));
  }
  function down(e){
    if(e.button != null && e.button !== 0) return;
    if(!isSliderTarget(e.target)) return;
    var p = point(e);
    active = true;
    moved = false;
    sx = p.x;
    sy = p.y;
  }
  function move(e){
    if(!active) return;
    var p = point(e);
    var dx = p.x - sx;
    var dy = p.y - sy;
    if(Math.abs(dx) > 6 || Math.abs(dy) > 6){
      moved = true;
    }
    if(Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15){
      suppressNextClick = true;
      window.__upickBenefitPhotoSuppressNextClick = true;
    }
  }
  function up(e){
    if(!active) return;
    active = false;
    var p = point(e);
    var dx = p.x - sx;
    var dy = p.y - sy;
    if(Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15){
      suppressNextClick = true;
      window.__upickBenefitPhotoSuppressNextClick = true;
    }
    setTimeout(function(){ moved = false; }, 0);
  }
  function block(e){
    if(!isSliderTarget(e.target)) return;
    if(!suppressNextClick && window.__upickBenefitPhotoSuppressNextClick !== true) return;
    suppressNextClick = false;
    window.__upickBenefitPhotoSuppressNextClick = false;
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    return false;
  }
  document.addEventListener('pointerdown', down, true);
  document.addEventListener('pointermove', move, true);
  document.addEventListener('pointerup', up, true);
  document.addEventListener('pointercancel', up, true);
  document.addEventListener('click', block, true);
})();

/* ===== v20260610-bottom-nav-body-lock-v1 =====
   하단 네비바를 화면 기준이 아니라 실제 body > .app 쉘의 좌표/폭에 고정합니다.
   DevTools 열기/닫기, 스크롤바 생성, 브라우저 리사이즈 때도 본문 폭과 동일하게 맞춥니다. */
(function(){
  'use strict';
  var rafId = 0;
  var last = { left: '', width: '' };

  function getShell(){
    return document.querySelector('body > .app') || document.querySelector('.app') || document.body;
  }
  function getNavs(){
    return Array.prototype.slice.call(document.querySelectorAll('.bottom-nav, nav.bottom-nav, .mobile-bottom-nav, #bottomNav'));
  }
  function px(value){
    return Math.round(Number(value || 0) * 100) / 100 + 'px';
  }
  function apply(){
    rafId = 0;
    var shell = getShell();
    var navs = getNavs();
    if(!shell || !navs.length) return;

    var rect = shell.getBoundingClientRect();
    if(!rect || rect.width <= 0) return;

    var left = px(rect.left);
    var width = px(rect.width);
    if(left === last.left && width === last.width) return;
    last.left = left;
    last.width = width;

    navs.forEach(function(nav){
      if(!nav) return;
      nav.style.setProperty('position', 'fixed', 'important');
      nav.style.setProperty('left', left, 'important');
      nav.style.setProperty('right', 'auto', 'important');
      nav.style.setProperty('width', width, 'important');
      nav.style.setProperty('max-width', width, 'important');
      nav.style.setProperty('margin-left', '0', 'important');
      nav.style.setProperty('margin-right', '0', 'important');
      nav.style.setProperty('transform', 'none', 'important');
      nav.style.setProperty('box-sizing', 'border-box', 'important');
    });
  }
  function schedule(){
    if(rafId) return;
    rafId = requestAnimationFrame(apply);
  }
  function init(){
    schedule();
    setTimeout(schedule, 60);
    setTimeout(schedule, 250);
    window.addEventListener('resize', schedule, { passive:true });
    window.addEventListener('orientationchange', function(){ setTimeout(schedule, 120); }, { passive:true });
    window.addEventListener('load', schedule, { once:true });
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', schedule, { passive:true });
      window.visualViewport.addEventListener('scroll', schedule, { passive:true });
    }
    if(window.ResizeObserver){
      try{
        var ro = new ResizeObserver(schedule);
        ro.observe(getShell());
        window.__upickBottomNavBodyLockResizeObserver = ro;
      }catch(_){ }
    }
    if(window.MutationObserver){
      try{
        var mo = new MutationObserver(schedule);
        mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
        window.__upickBottomNavBodyLockMutationObserver = mo;
      }catch(_){ }
    }
  }
  window.__upickSyncBottomNavToBodyShell = schedule;
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();


/* ===== v20260610-benefit-filter-body-lock-v1 =====
   혜택 상단 검색/필터 고정바도 하단 네비바처럼 실제 body > .app 쉘 좌표/폭에 맞춥니다.
   is-fixed 상태에서만 inline 보정하고, 일반 sticky 상태에서는 원래 CSS 흐름을 유지합니다. */
(function(){
  'use strict';
  var rafId = 0;
  var last = { left: '', width: '', fixed: null };

  function getShell(){
    return document.querySelector('body > .app') || document.querySelector('.app') || document.body;
  }
  function getFilter(){
    return document.querySelector('#view-benefits .filter-sticky');
  }
  function px(value){
    return Math.round(Number(value || 0) * 100) / 100 + 'px';
  }
  function clearInline(filter){
    if(!filter) return;
    ['left','right','width','max-width','transform','margin-left','margin-right','box-sizing'].forEach(function(name){
      filter.style.removeProperty(name);
    });
  }
  function apply(){
    rafId = 0;
    var shell = getShell();
    var filter = getFilter();
    if(!shell || !filter) return;

    var fixed = filter.classList.contains('is-fixed');
    if(!fixed){
      if(last.fixed !== false){
        clearInline(filter);
        last = { left:'', width:'', fixed:false };
      }
      return;
    }

    var rect = shell.getBoundingClientRect();
    if(!rect || rect.width <= 0) return;

    var left = px(rect.left);
    var width = px(rect.width);
    if(left === last.left && width === last.width && last.fixed === true) return;
    last = { left:left, width:width, fixed:true };

    filter.style.setProperty('position', 'fixed', 'important');
    filter.style.setProperty('left', left, 'important');
    filter.style.setProperty('right', 'auto', 'important');
    filter.style.setProperty('width', width, 'important');
    filter.style.setProperty('max-width', width, 'important');
    filter.style.setProperty('margin-left', '0', 'important');
    filter.style.setProperty('margin-right', '0', 'important');
    filter.style.setProperty('transform', 'none', 'important');
    filter.style.setProperty('box-sizing', 'border-box', 'important');
  }
  function schedule(){
    if(rafId) return;
    rafId = requestAnimationFrame(apply);
  }
  function init(){
    schedule();
    setTimeout(schedule, 60);
    setTimeout(schedule, 250);
    window.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('resize', schedule, { passive:true });
    window.addEventListener('orientationchange', function(){ setTimeout(schedule, 120); }, { passive:true });
    window.addEventListener('load', schedule, { once:true });
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', schedule, { passive:true });
      window.visualViewport.addEventListener('scroll', schedule, { passive:true });
    }
    if(window.ResizeObserver){
      try{
        var ro = new ResizeObserver(schedule);
        ro.observe(getShell());
        var filter = getFilter();
        if(filter) ro.observe(filter);
        window.__upickBenefitFilterBodyLockResizeObserver = ro;
      }catch(_){ }
    }
    if(window.MutationObserver){
      try{
        var mo = new MutationObserver(schedule);
        mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
        window.__upickBenefitFilterBodyLockMutationObserver = mo;
      }catch(_){ }
    }
  }
  window.__upickSyncBenefitFilterToBodyShell = schedule;
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
