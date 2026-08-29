/* =========================================================
   Tiffin Center — qr.js
   Generates per-table QR codes using the QRCode.js CDN library.
   The QR always encodes the CURRENT deployed origin, so it works
   automatically after deploying to GitHub Pages / Netlify —
   no hardcoded localhost URL.
   ========================================================= */

// Build the absolute URL a customer's phone should open for a given table.
// window.location.origin + the site's base path (works whether the site
// lives at the domain root or in a sub-folder) + index.html?table=N
function tcBuildTableUrl(tableNumber) {
  const path = window.location.pathname; // e.g. /tiffin-center/admin/tables.html
  const basePath = path.substring(0, path.indexOf("/admin/") > -1 ? path.indexOf("/admin/") + 1 : path.lastIndexOf("/") + 1);
  return `${window.location.origin}${basePath}index.html?table=${tableNumber}`;
}

// Renders a QR code into the element with the given id.
function tcGenerateQrInto(elementId, url, size = 150) {
  const el = document.getElementById(elementId);
  if (!el || typeof QRCode === "undefined") return;
  el.innerHTML = "";
  new QRCode(el, {
    text: url,
    width: size,
    height: size,
    colorDark: "#1F4D36",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

function tcDownloadQr(elementId, filename) {
  const el = document.getElementById(elementId);
  const canvas = el?.querySelector("canvas");
  const img = el?.querySelector("img");
  const src = canvas ? canvas.toDataURL("image/png") : (img ? img.src : null);
  if (!src) {
    tcToast("QR code not ready yet.", "error");
    return;
  }
  const link = document.createElement("a");
  link.href = src;
  link.download = filename;
  link.click();
  tcToast("QR code downloaded", "success");
}

/* =========================================================
   QR CODES PAGE (admin/qr-codes.html)
   ========================================================= */

function tcRenderQrCodesPage() {
  const grid = document.getElementById("qr-codes-grid");
  if (!grid) return;
  const tables = tcGet(TC.KEYS.TABLES, []);

  grid.innerHTML = tables.map(t => `
    <div class="qr-card" id="table-${t.number}">
      <div class="qr-brand">${tcEscapeHtml(TC.RESTAURANT_NAME)}</div>
      <div class="qr-biz-details">${tcEscapeHtml(TC.RESTAURANT_ADDRESS)}<br>${tcEscapeHtml(TC.RESTAURANT_PHONE)}</div>
      <div class="qr-table-num">TABLE ${t.number}</div>
      <div class="qr-box" id="qr-code-${t.number}"></div>
      <div class="qr-scan-label">Scan to Order</div>
      <div class="qr-card-actions no-print">
        <button class="btn btn-ghost btn-sm" data-action="download" data-num="${t.number}"><i class="fa-solid fa-download"></i> Download</button>
        <button class="btn btn-ghost btn-sm" data-action="print" data-num="${t.number}"><i class="fa-solid fa-print"></i> Print</button>
      </div>
    </div>
  `).join("");

  tables.forEach(t => tcGenerateQrInto(`qr-code-${t.number}`, tcBuildTableUrl(t.number), 150));

  grid.querySelectorAll('[data-action="download"]').forEach(btn => {
    btn.addEventListener("click", () => tcDownloadQr(`qr-code-${btn.dataset.num}`, `Table-${btn.dataset.num}-QR.png`));
  });
  grid.querySelectorAll('[data-action="print"]').forEach(btn => {
    btn.addEventListener("click", () => tcPrintSingleQr(btn.dataset.num));
  });

  // Scroll to a specific table if linked via #table-N (from tables.html "View QR")
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function tcPrintSingleQr(num) {
  document.querySelectorAll(".qr-card").forEach(c => c.classList.add("qr-print-hide"));
  const card = document.getElementById(`table-${num}`);
  if (card) card.classList.remove("qr-print-hide");
  const style = document.createElement("style");
  style.id = "qr-single-print-style";
  style.textContent = ".qr-print-hide{display:none !important;}";
  document.head.appendChild(style);
  window.print();
  setTimeout(() => {
    document.querySelectorAll(".qr-card").forEach(c => c.classList.remove("qr-print-hide"));
    document.getElementById("qr-single-print-style")?.remove();
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  tcRenderQrCodesPage();
  const printAllBtn = document.getElementById("print-all-qr-btn");
  if (printAllBtn) printAllBtn.addEventListener("click", () => window.print());
});
