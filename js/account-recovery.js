const __RECOVERY_VERSION__ = globalThis.__SOLA_DYNAMIC_IMPORT_VERSION__ || String(Date.now());
const noCache = (url) => `${url}${url.includes('?') ? '&' : '?'}v=${__RECOVERY_VERSION__}`;
const { ENV, API_URL } = await import(noCache('/common/env-config.js'));

const API = API_URL[ENV] || {};
const qs = (selector) => document.querySelector(selector);

const SAVE_LOGIN_ID_KEY = 'upick_saved_login_id_v1';

const loginIdEl = qs('#loginId');
const saveLoginIdEl = qs('#saveLoginId');
const loginForm = qs('#loginForm');
const modal = qs('#accountHelpModal');
const closeBtn = qs('#accountHelpCloseBtn');
const alertEl = qs('#appAlert');
const alertTitleEl = qs('#appAlertTitle');
const alertMsgEl = qs('#appAlertMessage');
const alertConfirmEl = qs('#appAlertConfirm');
const alertCancelEl = qs('#appAlertCancel');

const tabs = {
  nickname: qs('#tabFindNickname'),
  id: qs('#tabFindId'),
  reset: qs('#tabResetPw'),
};
const sections = {
  nickname: qs('#findNicknameSection'),
  id: qs('#findIdSection'),
  reset: qs('#resetPwSection'),
};

const fields = {
  findNicknameLoginId: qs('#findNicknameLoginId'),
  findIdNickname: qs('#findIdNickname'),
  resetLoginId: qs('#resetPwLoginId'),
  resetNickname: qs('#resetPwNickname'),
  resetNewPassword: qs('#resetPwNewPassword'),
  resetNewPasswordConfirm: qs('#resetPwNewPasswordConfirm'),
  resetMatchMessage: qs('#resetPwMatchMessage'),
  findNicknameResult: qs('#findNicknameResult'),
  findIdResult: qs('#findIdResult'),
  resetResult: qs('#resetPwResult'),
};

let lastFocus = null;
let alertResolver = null;

function normalizeLoginId(value = '') {
  return String(value || '').trim().toLowerCase();
}
function normalizeText(value = '') {
  return String(value || '').trim();
}
function setResult(el, message = '', type = 'info') {
  if (!el) return;
  el.className = `sheet-result ${type}`;
  el.textContent = message;
}
function setButtonLoading(btn, loading, text) {
  if (!btn) return;
  if (loading) {
    if (!btn.dataset.originalText || !btn.disabled) {
      btn.dataset.originalText = btn.textContent;
    }
    btn.disabled = true;
    btn.textContent = text || '처리 중...';
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || btn.textContent;
    delete btn.dataset.originalText;
  }
}
async function postJson(url, body) {
  if (!url) throw new Error('요청 주소가 설정되지 않았습니다.');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok || data.ok === false) {
    const error = new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
    error.data = data;
    error.status = res.status;
    throw error;
  }
  return data;
}
function openSheet(mode) {
  if (!modal) return;

  const nextMode = mode || 'nickname';
  lastFocus = document.activeElement;

  // display:none 상태에서 show를 바로 붙이면 시작 프레임이 생략되어 정적으로 보일 수 있습니다.
  // 먼저 렌더링 가능한 상태로 만든 뒤, 다음 프레임에 show를 붙여 아래→위 애니메이션을 확실히 실행합니다.
  modal.classList.remove('show', 'closing');
  modal.classList.add('ready');
  modal.setAttribute('aria-hidden', 'false');
  switchTab(nextMode);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add('show');
      window.setTimeout(() => {
        const first = sections[nextMode]?.querySelector('input, button');
        first?.focus?.();
      }, 160);
    });
  });
}

function closeSheet() {
  if (!modal) return;

  modal.classList.remove('show');
  modal.classList.add('closing');
  modal.setAttribute('aria-hidden', 'true');

  window.setTimeout(() => {
    modal.classList.remove('ready', 'closing');
    lastFocus?.focus?.();
  }, 360);
}
function getSheetBody() {
  return modal?.querySelector('.sheet-body') || null;
}

function animateSheetBodyHeight(nextSection) {
  const body = getSheetBody();
  if (!body || !nextSection) return;

  const previousHeight = body.getBoundingClientRect().height;
  body.style.height = `${previousHeight}px`;
  body.classList.add('is-height-animating');

  requestAnimationFrame(() => {
    const nextHeight = nextSection.scrollHeight;
    body.style.height = `${nextHeight}px`;

    window.setTimeout(() => {
      body.style.height = '';
      body.classList.remove('is-height-animating');
    }, 340);
  });
}

function switchTab(mode) {
  const nextSection = sections[mode];
  const currentSection = Object.values(sections).find(section => section?.classList.contains('active'));

  Object.entries(tabs).forEach(([key, tab]) => {
    const active = key === mode;
    tab?.classList.toggle('active', active);
    tab?.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  if (currentSection && nextSection && currentSection !== nextSection && modal?.classList.contains('show')) {
    const body = getSheetBody();
    const previousHeight = body?.getBoundingClientRect().height || 0;
    if (body && previousHeight) {
      body.style.height = `${previousHeight}px`;
      body.classList.add('is-height-animating');
    }

    Object.entries(sections).forEach(([key, section]) => {
      section?.classList.toggle('active', key === mode);
    });

    requestAnimationFrame(() => {
      if (!body) return;
      body.style.height = `${nextSection.scrollHeight}px`;
      window.setTimeout(() => {
        body.style.height = '';
        body.classList.remove('is-height-animating');
      }, 360);
    });
  } else {
    Object.entries(sections).forEach(([key, section]) => {
      section?.classList.toggle('active', key === mode);
    });
  }

  const currentLoginId = normalizeLoginId(loginIdEl?.value || '');
  if (mode === 'nickname' && fields.findNicknameLoginId && !fields.findNicknameLoginId.value) fields.findNicknameLoginId.value = currentLoginId;
  if (mode === 'reset' && fields.resetLoginId && !fields.resetLoginId.value) fields.resetLoginId.value = currentLoginId;
}
function showAppAlert({ title = '안내', message = '', confirmText = '확인', cancelText = '', closeSheetOnConfirm = false }) {
  if (!alertEl || !alertTitleEl || !alertMsgEl || !alertConfirmEl || !alertCancelEl) {
    window.alert(message);
    if (closeSheetOnConfirm) closeSheet();
    return Promise.resolve(true);
  }
  // 바텀시트/로딩바 내부 stacking context에 밀리지 않도록 항상 body 최상단 레이어로 이동
  if (alertEl.parentElement !== document.body) {
    document.body.appendChild(alertEl);
  } else {
    document.body.appendChild(alertEl);
  }
  alertTitleEl.textContent = title;
  alertMsgEl.textContent = message;
  alertConfirmEl.textContent = confirmText;
  alertCancelEl.textContent = cancelText || '취소';
  alertCancelEl.classList.toggle('hidden', !cancelText);
  alertEl.classList.add('show');
  alertEl.setAttribute('aria-hidden', 'false');
  alertConfirmEl.focus();
  return new Promise((resolve) => {
    alertResolver = (value) => {
      alertEl.classList.remove('show');
      alertEl.setAttribute('aria-hidden', 'true');
      alertResolver = null;
      if (value && closeSheetOnConfirm) {
        closeSheet();
      }
      resolve(value);
    };
  });
}
alertConfirmEl?.addEventListener('click', () => alertResolver?.(true));
alertCancelEl?.addEventListener('click', () => alertResolver?.(false));

function hydrateSavedLoginId() {
  const saved = localStorage.getItem(SAVE_LOGIN_ID_KEY) || '';
  if (saved && loginIdEl && !loginIdEl.value) {
    loginIdEl.value = saved;
    if (saveLoginIdEl) saveLoginIdEl.checked = true;
  }
}
function persistLoginIdPreference() {
  if (!loginIdEl || !saveLoginIdEl) return;
  const loginId = normalizeLoginId(loginIdEl.value);
  if (saveLoginIdEl.checked && loginId) localStorage.setItem(SAVE_LOGIN_ID_KEY, loginId);
  if (!saveLoginIdEl.checked) localStorage.removeItem(SAVE_LOGIN_ID_KEY);
}

hydrateSavedLoginId();
loginForm?.addEventListener('submit', persistLoginIdPreference, true);
saveLoginIdEl?.addEventListener('change', () => {
  if (!saveLoginIdEl.checked) localStorage.removeItem(SAVE_LOGIN_ID_KEY);
});
loginIdEl?.addEventListener('input', () => {
  if (saveLoginIdEl?.checked) localStorage.setItem(SAVE_LOGIN_ID_KEY, normalizeLoginId(loginIdEl.value));
});

qs('#openFindNicknameBtn')?.addEventListener('click', () => openSheet('nickname'));
qs('#openFindIdBtn')?.addEventListener('click', () => openSheet('id'));
qs('#openResetPwBtn')?.addEventListener('click', () => openSheet('reset'));
closeBtn?.addEventListener('click', closeSheet);
modal?.addEventListener('click', (event) => {
  if (event.target === modal) closeSheet();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal?.classList.contains('show')) closeSheet();
});
tabs.nickname?.addEventListener('click', () => switchTab('nickname'));
tabs.id?.addEventListener('click', () => switchTab('id'));
tabs.reset?.addEventListener('click', () => switchTab('reset'));

function updateResetPasswordMessage() {
  const pw = fields.resetNewPassword?.value || '';
  const confirm = fields.resetNewPasswordConfirm?.value || '';
  const msg = fields.resetMatchMessage;
  if (!msg) return;
  msg.className = 'password-live-message';
  if (!pw && !confirm) {
    msg.textContent = '';
    return;
  }
  if (pw.length > 0 && pw.length < 6) {
    msg.textContent = '비밀번호는 6자 이상 입력해주세요.';
    msg.classList.add('error');
    return;
  }
  if (!confirm) {
    msg.textContent = '새 비밀번호 확인란을 입력해주세요.';
    msg.classList.add('info');
    return;
  }
  if (pw === confirm) {
    msg.textContent = '새 비밀번호가 일치합니다.';
    msg.classList.add('success');
  } else {
    msg.textContent = '새 비밀번호가 일치하지 않습니다.';
    msg.classList.add('error');
  }
}
fields.resetNewPassword?.addEventListener('input', updateResetPasswordMessage);
fields.resetNewPasswordConfirm?.addEventListener('input', updateResetPasswordMessage);

qs('#findNicknameBtn')?.addEventListener('click', async (event) => {
  const btn = event.currentTarget;
  const loginId = normalizeLoginId(fields.findNicknameLoginId?.value || '');
  if (!loginId) {
    await showAppAlert({ message: '아이디를 입력해주세요.' });
    fields.findNicknameLoginId?.focus();
    return;
  }
  setButtonLoading(btn, true, '확인 중...');
  setResult(fields.findNicknameResult, '닉네임 정보를 확인하고 있어요.', 'info');
  try {
    const data = await postJson(API.findNicknameByLoginId, { loginId });
    setResult(fields.findNicknameResult, `확인된 닉네임: ${data.nicknameMasked || data.nickname || ''}`, 'success');
    setButtonLoading(btn, false);
    const showFull = await showAppAlert({
      title: '닉네임 찾기',
      message: `가입된 닉네임은 ${data.nicknameMasked || data.nickname} 입니다.\n전체 닉네임을 확인하시겠습니까?`,
      confirmText: '전체 보기',
      cancelText: '확인',
    });
    if (showFull) {
      await showAppAlert({ title: '닉네임 찾기', message: `전체 닉네임은 ${data.nickname} 입니다.`, closeSheetOnConfirm: true });
    } else {
      closeSheet();
    }
  } catch (error) {
    setButtonLoading(btn, false);
    setResult(fields.findNicknameResult, error.message, 'error');
    await showAppAlert({ message: error.message || '아이디를 확인해주세요.' });
    requestAnimationFrame(() => fields.findNicknameLoginId?.focus?.());
  } finally {
    setButtonLoading(btn, false);
  }
});

qs('#findIdBtn')?.addEventListener('click', async (event) => {
  const btn = event.currentTarget;
  const nickname = normalizeText(fields.findIdNickname?.value || '');
  if (!nickname) {
    await showAppAlert({ message: '닉네임을 입력해주세요.' });
    fields.findIdNickname?.focus();
    return;
  }
  setButtonLoading(btn, true, '확인 중...');
  setResult(fields.findIdResult, '아이디 정보를 확인하고 있어요.', 'info');
  try {
    const data = await postJson(API.findLoginIdByNickname, { nickname });
    setResult(fields.findIdResult, `확인된 아이디: ${data.loginIdMasked || data.loginId || ''}`, 'success');
    setButtonLoading(btn, false);
    const showFull = await showAppAlert({
      title: '아이디 찾기',
      message: `가입된 아이디는 ${data.loginIdMasked || data.loginId} 입니다.\n전체 아이디를 확인하시겠습니까?`,
      confirmText: '전체 보기',
      cancelText: '확인',
    });
    if (showFull) {
      if (loginIdEl && data.loginId) loginIdEl.value = data.loginId;
      await showAppAlert({ title: '아이디 찾기', message: `전체 아이디는 ${data.loginId} 입니다.`, closeSheetOnConfirm: true });
    } else {
      closeSheet();
    }
  } catch (error) {
    setButtonLoading(btn, false);
    setResult(fields.findIdResult, error.message, 'error');
    await showAppAlert({ message: error.message || '닉네임이 올바른지 확인해주세요.' });
    requestAnimationFrame(() => fields.findIdNickname?.focus?.());
  } finally {
    setButtonLoading(btn, false);
  }
});

qs('#resetPwSubmitBtn')?.addEventListener('click', async (event) => {
  const btn = event.currentTarget;
  const loginId = normalizeLoginId(fields.resetLoginId?.value || '');
  const nickname = normalizeText(fields.resetNickname?.value || '');
  const newPassword = fields.resetNewPassword?.value || '';
  const newPasswordConfirm = fields.resetNewPasswordConfirm?.value || '';

  if (!loginId && !nickname) return showAppAlert({ message: '아이디와 닉네임을 입력해주세요.' });
  if (!loginId) return showAppAlert({ message: '아이디를 입력해주세요.' });
  if (!nickname) return showAppAlert({ message: '닉네임을 입력해주세요.' });
  if (!newPassword || newPassword.length < 6) return showAppAlert({ message: '새 비밀번호는 6자 이상 입력해주세요.' });
  if (newPassword !== newPasswordConfirm) return showAppAlert({ message: '새 비밀번호가 일치하지 않습니다.' });

  setButtonLoading(btn, true, '재설정 중...');
  setResult(fields.resetResult, '비밀번호를 안전하게 재설정하고 있어요.', 'info');
  try {
    const data = await postJson(API.resetPasswordByLoginIdNickname, { loginId, nickname, newPassword, newPasswordConfirm });
    fields.resetNewPassword.value = '';
    fields.resetNewPasswordConfirm.value = '';
    updateResetPasswordMessage();
    setResult(fields.resetResult, data.message || '비밀번호 재설정이 완료되었습니다.', 'success');
    await showAppAlert({
      title: '비밀번호 재설정 완료',
      message: data.message || '비밀번호 재설정이 완료되었습니다. 재로그인 하시면 됩니다.',
      closeSheetOnConfirm: true,
    });
  } catch (error) {
    setResult(fields.resetResult, error.message, 'error');
    await showAppAlert({ message: error.message || '비밀번호 재설정에 실패했습니다.' });
  } finally {
    setButtonLoading(btn, false);
  }
});
