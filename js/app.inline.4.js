(function(){
  'use strict';

  function removeLegacyViewer(){
    var legacy = document.getElementById('benefitPhotoZoomViewer');
    if(!legacy) return;
    legacy.classList.remove('show');
    legacy.setAttribute('aria-hidden','true');
    legacy.remove();
  }

  function guardLegacyOpen(){
    removeLegacyViewer();
  }

  // 키보드(Enter/Space) 접근은 app.js의 신규 상세 사진 슬라이드 팝업 핸들러가 처리합니다.
  // 여기서는 이벤트 전파를 막지 않고, 기존 단일 대표사진 팝업만 제거해서
  // 키보드 접근 시에도 신규 다중 사진 팝업이 정상적으로 열리도록 합니다.
  document.addEventListener('keydown', function(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    var target = event.target;
    if(target && target.closest && target.closest('#detailModal .benefit-detail-photo-slider')){
      removeLegacyViewer();
      window.setTimeout(removeLegacyViewer, 0);
      window.setTimeout(removeLegacyViewer, 80);
    }
  }, true);

  document.addEventListener('click', function(){
    removeLegacyViewer();
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guardLegacyOpen, {once:true});
  else guardLegacyOpen();

  new MutationObserver(function(){
    removeLegacyViewer();
  }).observe(document.documentElement, {childList:true, subtree:true});
})();
