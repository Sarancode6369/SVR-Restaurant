/* =========================================================
   Tiffin Center — bill.js (bill.html only)
   ========================================================= */

function tcGetOrderById(orderId) {
  const orders = tcGet(TC.KEYS.ORDERS, []);
  return orders.find(o => o.orderId === orderId) || null;
}

function tcRenderBill() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order");
  const container = document.getElementById("bill-container");
  const order = orderId ? tcGetOrderById(orderId) : null;

  if (!order) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-receipt"></i>
        <p>No bill found. Please place an order first.</p>
        <a href="menu.html" class="btn btn-primary" style="margin-top:10px;">Browse Menu</a>
      </div>`;
    document.getElementById("bill-actions").style.display = "none";
    return;
  }

  const bills = tcGet(TC.KEYS.BILLS, []);
  const billRecord = bills.find(b => b.orderId === order.orderId);
  const billNumber = billRecord ? billRecord.billNumber : "BILL-" + order.orderId.replace("ORD-", "");

  const rowsHtml = order.items.map(i => `
    <tr>
      <td>${tcEscapeHtml(i.name)}</td>
      <td>${i.qty}</td>
      <td class="mono">${tcFormatCurrency(i.price * i.qty)}</td>
    </tr>
  `).join("");

  container.innerHTML = `
    <h2>${tcEscapeHtml(TC.RESTAURANT_NAME)}</h2>
    <div class="bill-sub">${tcEscapeHtml(TC.RESTAURANT_ADDRESS)}</div>
    <div class="bill-sub">${tcEscapeHtml(TC.RESTAURANT_PHONE)}</div>

    <div class="bill-meta">
      <div>
        Bill No: ${tcEscapeHtml(billNumber)}<br>
        Order ID: ${tcEscapeHtml(order.orderId)}
      </div>
      <div style="text-align:right;">
        ${tcFormatDateTime(order.dateTime)}<br>
        Table ${order.table}
      </div>
    </div>

    <table class="bill-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="bill-totals">
      <div class="row"><span>Subtotal</span><span>${tcFormatCurrency(order.subtotal)}</span></div>
      <div class="row"><span>GST (${(TC.GST_RATE * 100).toFixed(0)}%)</span><span>${tcFormatCurrency(order.gst)}</span></div>
      <div class="row grand"><span>TOTAL</span><span>${tcFormatCurrency(order.total)}</span></div>
    </div>

    <div class="text-center" style="margin-top:14px;">
      <span class="status-pill status-${order.status}">${order.status}</span>
    </div>

    <div class="bill-thanks">Thank you! Visit Again!</div>
  `;

  document.getElementById("bill-actions").style.display = "flex";

  document.getElementById("print-bill-btn").onclick = () => window.print();
  document.getElementById("new-order-btn").onclick = () => window.location.href = "menu.html";
  document.getElementById("download-pdf-btn").onclick = () => tcDownloadBillPdf(order, billNumber);
}

function tcDownloadBillPdf(order, billNumber) {
  if (!window.jspdf) {
    tcToast("PDF library failed to load.", "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: [280, 480] });
  let y = 30;
  const centerX = 140;

  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.text(TC.RESTAURANT_NAME, centerX, y, { align: "center" }); y += 16;
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(TC.RESTAURANT_ADDRESS, centerX, y, { align: "center" }); y += 12;
  doc.text(TC.RESTAURANT_PHONE, centerX, y, { align: "center" }); y += 18;

  doc.setFontSize(9);
  doc.text(`Bill No: ${billNumber}`, 20, y); y += 12;
  doc.text(`Order ID: ${order.orderId}`, 20, y); y += 12;
  doc.text(`Table: ${order.table}`, 20, y); y += 12;
  doc.text(`${tcFormatDateTime(order.dateTime)}`, 20, y); y += 16;

  doc.text("--------------------------------", 20, y); y += 12;
  doc.text("ITEM          QTY     PRICE", 20, y); y += 10;
  doc.text("--------------------------------", 20, y); y += 12;

  order.items.forEach(i => {
    const line = `${i.name.padEnd(14).slice(0,14)} ${String(i.qty).padStart(3)}   ${tcFormatCurrency(i.price * i.qty).padStart(8)}`;
    doc.text(line, 20, y); y += 12;
  });

  doc.text("--------------------------------", 20, y); y += 12;
  doc.text(`Subtotal: ${tcFormatCurrency(order.subtotal)}`, 20, y); y += 12;
  doc.text(`GST: ${tcFormatCurrency(order.gst)}`, 20, y); y += 12;
  doc.setFont("courier", "bold");
  doc.text(`TOTAL: ${tcFormatCurrency(order.total)}`, 20, y); y += 18;

  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text("Thank you! Visit Again!", centerX, y, { align: "center" });

  doc.save(`${order.orderId}.pdf`);
  tcToast("Bill downloaded as PDF", "success");
}

document.addEventListener("DOMContentLoaded", tcRenderBill);
