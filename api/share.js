const admin = require("firebase-admin");

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeType(type) {
  if (type === "benefit" || type === "benefits") return "benefit";
  if (type === "notice" || type === "notices") return "notice";
  return "";
}

function getCollectionName(type) {
  if (type === "benefit") return "benefits";
  if (type === "notice") return "announcements";
  return "";
}

function pickImage(data, defaultImage) {
  return (
    data.thumbnailUrl ||
    data.ogImage ||
    data.imageUrl ||
    data.mainImageUrl ||
    data.mapImageUrl ||
    defaultImage
  );
}

function pickTitle(type, data) {
  return (
    data.ogTitle ||
    data.title ||
    data.name ||
    data.storeName ||
    (type === "notice" ? "더운정 마이힐스 공지" : "더운정 마이힐스 입주민 혜택")
  );
}

function pickDescription(type, data) {
  return (
    data.ogDescription ||
    data.summary ||
    data.description ||
    data.content ||
    (type === "notice"
      ? "힐스테이트 더 운정 입주민 공지입니다."
      : "힐스테이트 더 운정 입주민 전용 혜택입니다.")
  );
}

module.exports = async function handler(req, res) {
  try {
    initFirebaseAdmin();

    const type = normalizeType(req.query.type);
    const id = req.query.id;

    const appUrl = process.env.PUBLIC_APP_URL || "https://www.sola-home.kr";
    const defaultImage = process.env.DEFAULT_OG_IMAGE || `${appUrl}/icons/icon-512.png`;

    if (!type || !id) {
      res.status(400).send("Invalid share link");
      return;
    }

    const collectionName = getCollectionName(type);
    const snap = await admin.firestore().collection(collectionName).doc(id).get();

    if (!snap.exists) {
      res.status(404).send("Not found");
      return;
    }

    const data = snap.data() || {};

    const title = escapeHtml(pickTitle(type, data));
    const description = escapeHtml(pickDescription(type, data).slice(0, 120));
    const imageUrl = escapeHtml(pickImage(data, defaultImage));

    const shareUrl = `${appUrl}/share/${type}/${encodeURIComponent(id)}`;
    const deepLinkUrl = `${appUrl}/app.html?open=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}&from=share`;

    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="더운정 마이힐스" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${shareUrl}" />

  <meta name="twitter:card" content="summary_large_image" />

  <script>
    location.replace(${JSON.stringify(deepLinkUrl)});
  </script>
</head>
<body>
  <p>더운정 마이힐스로 이동 중입니다.</p>
  <p><a href="${deepLinkUrl}">바로 열기</a></p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (error) {
    console.error("[share-og-error]", error);
    res.status(500).send("Share page error");
  }
};