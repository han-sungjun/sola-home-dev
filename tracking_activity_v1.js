// tracking_activity_v1.js
console.log("tracking_activity_v1 loaded");

// 날짜 포맷 함수
function formatDate(timestamp) {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

// 최근 활동 렌더링
function renderRecentActivities(logs) {
  const container = document.getElementById("recent-logs");
  if (!container) return;

  container.innerHTML = "";

  logs.forEach(log => {
    const el = document.createElement("div");
    el.className = "log-card";

    el.innerHTML = `
      <div><strong>${log.type}</strong></div>
      <div>${log.message}</div>
      <div style="font-size:12px; color:#888; margin-top:5px;">
        📅 ${formatDate(log.timestamp)}
      </div>
    `;

    container.appendChild(el);
  });
}