(function(){
  'use strict';

  function removeLegacyViewer(){
    var legacy = document.getElementById('benefitPhotoZoomViewer');
    if(!legacy) return;
    legacy.classList.remove('show');
    legacy.setAttribute('aria-hidden','true');
    legacy.remove();
  }

  function hasNewPreviewOpen(){
    var overlay = document.querySelector('.benefit-image-preview-overlay.show');
    return !!overlay;
  }

  function guardLegacyOpen(){
    removeLegacyViewer();
  }

  document.addEventListener('keydown', function(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    var target = event.target;
    if(target && target.closest && target.closest('#detailModal .benefit-detail-photo-slider')){
      // 다중 상세 사진은 신규 슬라이드 확대 팝업만 사용합니다.
      // 기존 대표사진 팝업이 동시에 뜨지 않도록 같은 키 이벤트의 전파를 차단합니다.
      event.stopPropagation();
    }
  }, true);

  document.addEventListener('click', function(){
    if(hasNewPreviewOpen()) removeLegacyViewer();
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guardLegacyOpen, {once:true});
  else guardLegacyOpen();

  new MutationObserver(function(){
    removeLegacyViewer();
  }).observe(document.documentElement, {childList:true, subtree:true});
})();
