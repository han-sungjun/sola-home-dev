(function () {
  console.log("route-guard active");

  const path = location.pathname;

  const PUBLIC_PAGES = [
    "/",
    "/index.html",
    "/signup.html",
    "/phone-verify.html",
    "/error.html"
  ];

  const ADMIN_PAGES = [
    "/sola-admin-x92ks.html",
    "/admin.html"
  ];

  function go(url) {
    if (location.pathname !== url) {
      location.replace(url);
    }
  }

  function getLoginUser() {
    try {
      return JSON.parse(localStorage.getItem("loginUser") || "null");
    } catch (e) {
      return null;
    }
  }

  const loginUser = getLoginUser();

  const isPublicPage = PUBLIC_PAGES.includes(path);
  const isAdminPage = ADMIN_PAGES.includes(path);

  if (!loginUser && !isPublicPage) {
    console.warn("비로그인 접근 차단:", path);

    sessionStorage.setItem("pendingDeepLink", location.href);

    go("/index.html");
    return;
  }

  if (loginUser && loginUser.phoneVerified === false && path !== "/phone-verify.html") {
    console.warn("휴대폰 인증 필요");
    go("/phone-verify.html");
    return;
  }

  if (
    loginUser &&
    loginUser.approvalStatus &&
    loginUser.approvalStatus !== "approved" &&
    !isPublicPage
  ) {
    console.warn("승인되지 않은 계정");
    go("/index.html");
    return;
  }

  if (loginUser && isAdminPage) {
    const role = loginUser.role || loginUser.userRole || "";

    const isAdmin =
      role === "root" ||
      role === "admin" ||
      role === "superAdmin";

    if (!isAdmin) {
      console.warn("관리자 권한 없음");
      go("/app.html");
      return;
    }
  }

  if (loginUser && (path === "/" || path === "/index.html")) {
    go("/app.html");
    return;
  }
})();