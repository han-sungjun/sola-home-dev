(function(){
  'use strict';

  var raf = 0;

  function getFrame(){
    return document.querySelector('.app') || document.querySelector('.shell') || document.body;
  }

  function syncFixedFrame(){
    raf = 0;
    var frame = getFrame();
    if(!frame) return;

    var rect = frame.getBoundingClientRect();
    var width = Math.max(0, Math.round(rect.width * 100) / 100);
    var left = Math.round(rect.left * 100) / 100;

    document.documentElement.style.setProperty('--app-fixed-left', left + 'px');
    document.documentElement.style.setProperty('--app-fixed-width', width + 'px');
  }

  function requestSync(){
    if(raf) return;
    raf = window.requestAnimationFrame(syncFixedFrame);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', requestSync, { once:true });
  }else{
    requestSync();
  }

  window.addEventListener('load', requestSync, { passive:true });
  window.addEventListener('resize', requestSync, { passive:true });
  window.addEventListener('orientationchange', requestSync, { passive:true });
  window.addEventListener('scroll', requestSync, { passive:true });

  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', requestSync, { passive:true });
    window.visualViewport.addEventListener('scroll', requestSync, { passive:true });
  }

  if(window.ResizeObserver){
    var observer = new ResizeObserver(requestSync);
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){
        var frame = getFrame();
        if(frame) observer.observe(frame);
      }, { once:true });
    }else{
      var frame = getFrame();
      if(frame) observer.observe(frame);
    }
  }

  window.__upickSyncFixedFrame = requestSync;
})();
