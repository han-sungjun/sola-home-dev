(function(){
        'use strict';
        function qs(sel, root){ return (root || document).querySelector(sel); }
        function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }
        function closestSection(sel){ var el = qs(sel); return el && el.closest('.gnb-settings-section'); }
        function makeEl(html){ var t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }
        function modalStash(){ var el=qs('#gnbCommonModalStash'); if(!el){ el=document.createElement('div'); el.id='gnbCommonModalStash'; el.className='common-modal-stash'; document.body.appendChild(el); } return el; }
        function activateTab(scope, name){
          qsa('[data-manage-tab]', scope).forEach(function(btn){
            var on = btn.dataset.manageTab === name;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          qsa('[data-manage-panel]', scope).forEach(function(panel){
            var on = panel.dataset.managePanel === name;
            panel.classList.toggle('active', on);
            panel.hidden = !on;
          });
        }
        function openManageModal(panel, firstTab, focusSelector){
          if(!panel) return;
          if(firstTab && qs('[data-manage-tab]', panel)) activateTab(panel, firstTab);
          if(window.CommonModal && typeof window.CommonModal.open === 'function'){
            window.CommonModal.open({
              content: panel,
              stageClass: 'common-modal-stage--gnb',
              labelledby: panel.getAttribute('aria-labelledby') || '',
              initialFocusSelector: focusSelector || '[data-manage-tab].active, .gnb-manage-close'
            });
          }else{
            document.body.appendChild(panel);
          }
        }
        function closeManageModal(){
          if(window.CommonModal && typeof window.CommonModal.close === 'function') window.CommonModal.close();
        }
        function initAccountManageModal(){
          var summary = qs('#gnbSettingsAccountSummary');
          var header = summary && qs('.gnb-settings-section-header', summary);
          var pill = qs('#gnbPushStatusPill');
          if(!summary || !header || qs('#openGnbAccountManageBtn')) return;

          var actions = makeEl('<div class="gnb-summary-actions"></div>');
          if(pill) actions.appendChild(pill);
          var openBtn = makeEl('<button class="gnb-manage-open-btn" id="openGnbAccountManageBtn" type="button"><img alt="" class="upick-inline-icon" loading="lazy" src="/icons/internal/shield-check.svg"><span>계정 관리</span></button>');
          actions.appendChild(openBtn);
          header.appendChild(actions);

          var modalPanel = makeEl('\
            <div class="gnb-management-dialog gnb-account-dialog--unified" id="gnbAccountManageModal" aria-labelledby="gnbAccountManageTitle">\
              <div class="gnb-management-shell">\
                <div class="gnb-management-head">\
                  <div>\
                    <span class="gnb-management-kicker">설정</span>\
                    <h3 id="gnbAccountManageTitle">계정 관리</h3>\
                    <p>알림, 계정 정보, 보안, 삭제를 한 화면에서 관리합니다.</p>\
                  </div>\
                  <button class="gnb-manage-close" type="button" aria-label="계정 관리 닫기">✕</button>\
                </div>\
                <div class="gnb-management-body gnb-account-unified-body" aria-label="계정 관리 항목">\
                  <section class="gnb-account-unified-section" id="gnbAccountNoticeSlot"></section>\
                  <section class="gnb-account-unified-section" id="gnbAccountMainSlot"></section>\
                  <section class="gnb-account-unified-section gnb-account-delete-section" id="gnbAccountDeleteSlot"></section>\
                </div>\
              </div>\
            </div>');

          modalStash().appendChild(modalPanel);

          function setSectionCopy(section, title, desc){
            if(!section) return;
            var titleEl = qs('.gnb-settings-section-title', section);
            var descEl = qs('.gnb-settings-section-desc', section);
            if(titleEl) titleEl.textContent = title;
            if(descEl) descEl.textContent = desc;
          }

          var noticeSection = closestSection('#gnbEnablePushBtn');
          var accountSection = closestSection('#openAccountEditBtn');
          var deleteSection = closestSection('#withdrawBtn');

          setSectionCopy(noticeSection, '알림 관리', '이 기기의 공지와 주요 안내 수신 상태를 관리합니다.');
          setSectionCopy(accountSection, '계정 및 보안', '닉네임, 비밀번호 변경, 현재 공간 나가기를 관리합니다.');
          setSectionCopy(deleteSection, '계정 삭제', '삭제 전 내용을 확인한 뒤 신중하게 진행해 주세요.');

          if(noticeSection) qs('#gnbAccountNoticeSlot', modalPanel).appendChild(noticeSection);
          if(accountSection) qs('#gnbAccountMainSlot', modalPanel).appendChild(accountSection);
          if(deleteSection) qs('#gnbAccountDeleteSlot', modalPanel).appendChild(deleteSection);

          qsa('.gnb-account-unified-section', modalPanel).forEach(function(slot){
            if(!slot.children.length) slot.hidden = true;
          });

          qs('.gnb-manage-close', modalPanel).addEventListener('click', closeManageModal);
          openBtn.addEventListener('click', function(){
            openManageModal(modalPanel, null, '.gnb-manage-close, #gnbEnablePushBtn, #openAccountEditBtn');
          });
        }
        function initOperationManageModal(){
          var admin = qs('.gnb-admin-premium');
          var openBtn = qs('#openGnbOperationManageBtn');
          if(!admin || !openBtn || qs('#gnbOperationManageModal')) return;
          var oldActions = qs('.gnb-admin-actions', admin);
          var shareBtn = qs('[data-view-link="shareinsights"]', oldActions || admin);
          var adminBtn = qs('#openAdminPageFromGnbBtn');
          var rootPanel = qs('.gnb-root-panel', admin);
          if(oldActions && oldActions.parentElement) oldActions.remove();
          if(rootPanel && rootPanel.parentElement) rootPanel.remove();

          var modalPanel = makeEl('\
            <div class="gnb-management-dialog gnb-operation-dialog gnb-operation-dialog--unified" id="gnbOperationManageModal" aria-labelledby="gnbOperationManageTitle">\
              <div class="gnb-management-shell">\
                <div class="gnb-management-head operation">\
                  <div>\
                    <span class="gnb-management-kicker">관리자 전용</span>\
                    <h3 id="gnbOperationManageTitle">운영 관리</h3>\
                    <p>공유 흐름, 관리자 페이지, Root 보조 기능을 한곳에서 관리합니다.</p>\
                  </div>\
                  <button class="gnb-manage-close" type="button" aria-label="운영 관리 닫기">✕</button>\
                </div>\
                <div class="gnb-management-body gnb-operation-unified-body">\
                  <section class="gnb-operation-unified-section">\
                    <div class="gnb-operation-section-head">\
                      <strong>공유 및 관리자</strong>\
                      <span>운영 흐름 확인과 관리자 페이지 이동</span>\
                    </div>\
                    <div class="gnb-operation-action-grid">\
                      <div class="gnb-management-action-slot" id="gnbShareActionSlot"></div>\
                      <div class="gnb-management-action-slot" id="gnbAdminActionSlot"></div>\
                    </div>\
                  </section>\
                  <section class="gnb-operation-unified-section root-only-panel" id="gnbRootUnifiedSection">\
                    <div id="gnbRootActionSlot"></div>\
                  </section>\
                </div>\
              </div>\
            </div>');
          modalStash().appendChild(modalPanel);
          if(shareBtn) qs('#gnbShareActionSlot', modalPanel).appendChild(shareBtn);
          if(adminBtn) qs('#gnbAdminActionSlot', modalPanel).appendChild(adminBtn);
          if(rootPanel) qs('#gnbRootActionSlot', modalPanel).appendChild(rootPanel);
          qs('.gnb-manage-close', modalPanel).addEventListener('click', closeManageModal);
          openBtn.addEventListener('click', function(){ openManageModal(modalPanel, null, '.gnb-manage-close, #gnbShareActionSlot button, #gnbAdminActionSlot button'); });
        }
        function init(){ initAccountManageModal(); initOperationManageModal(); }
        if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
        else init();
      })();