// Chụp các màn hình cốt lõi của trang quản trị cho README: đánh số lên ảnh + khung giải thích bên phải.
// Chạy khi app đang chạy ở localhost, dùng cookie tokenAdmin của một tài khoản admin (đăng nhập rồi copy cookie):
//   ADMIN_TOKEN=... node scripts/readme/admin-screenshots.mjs
// Biến tùy chọn: BASE_URL (mặc định http://localhost:3000), CHAT_ROOM_ID, ONLY=tên-ảnh, DEBUG=1 (in vị trí phần tử)
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TOKEN = process.env.ADMIN_TOKEN;
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../assets/readme");
const VIEW = { width: 1440, height: 900 };
const PANEL_WIDTH = 460;
const BRAND = "#1B4F8C";

if (!TOKEN) {
  console.error("Thiếu ADMIN_TOKEN (cookie tokenAdmin của tài khoản admin)");
  process.exit(1);
}

// Lấy href đầu tiên khớp mẫu trên một trang danh sách, để không phải ghi cứng id
const firstLink = async (page, listPath, pattern) => {
  await page.goto(BASE + listPath, { waitUntil: "networkidle2" });
  const href = await page.evaluate((src) => {
    const re = new RegExp(src);
    const a = [...document.querySelectorAll("a[href]")].find(el => re.test(el.getAttribute("href")));
    return a && a.getAttribute("href");
  }, pattern);
  if (!href) throw new Error(`Không tìm thấy link ${pattern} trên ${listPath}`);
  return href.replace(/^https?:\/\/[^/]+/, "");
};

// Mỗi ảnh: trang, vùng chụp, phần tử cần làm mờ (thông tin cá nhân), các điểm đánh số kèm giải thích.
// Định vị phần tử: { css } hoặc { text, css? } (phần tử nhỏ nhất chứa chữ), có thể gộp nhiều phần tử bằng { union: [...] }.
const shots = [
  {
    name: "admin-1-dashboard",
    title: "Tổng quan kinh doanh",
    url: async () => "/admin/dashboard/",
    callouts: [
      { at: { css: "#startbar, .startbar, .app-sidebar, aside" }, title: "Menu theo quyền",
        text: "Mỗi mục menu chỉ hiện khi tài khoản có quyền tương ứng; route phía server cũng kiểm tra lại quyền (403 nếu thiếu)." },
      { at: { text: "Doanh thu", css: "h4,h5,h6,.card-title" , box: ".card" }, title: "Doanh thu",
        text: "Chỉ tính đơn đã thanh toán. So sánh hôm nay với hôm qua, tháng này với tháng trước." },
      { at: { text: "Tất cả đơn hàng", css: "h4,h5,h6", next: ".row" }, title: "Đơn hàng theo trạng thái",
        text: "Đếm số đơn theo từng trạng thái (chờ xác nhận, đang giao, hoàn thành, hủy, trả hàng) để biết việc cần xử lý." },
    ],
  },
  {
    name: "admin-2-product-list",
    title: "Quản lý sản phẩm",
    url: async () => "/admin/product/list",
    callouts: [
      { at: { css: "form input[name=keyword], input[placeholder*='khóa']", box: "form" }, title: "Tìm kiếm",
        text: "Tìm theo tên sản phẩm (không dấu), có phân trang." },
      { at: [{ text: "Xuất Excel", css: "a,button" }, { css: "#formImportExcel" }], title: "Xuất / nhập hàng loạt",
        text: "Xuất danh sách ra CSV và nhập nhiều sản phẩm một lúc từ file CSV (mở, sửa được bằng Excel)." },
      { at: { text: "Còn lại", css: "th" }, title: "Tồn kho",
        text: "Với sản phẩm có biến thể, tồn kho chung luôn bằng tổng tồn kho các biến thể đang bật." },
      { at: { text: "Số biến thể", css: "th" }, title: "Biến thể",
        text: "Số tổ hợp thuộc tính (màu × size...) của sản phẩm, mỗi tổ hợp có giá và kho riêng." },
      { at: { text: "Sửa SEO", css: "a,button" }, title: "SEO riêng từng sản phẩm",
        text: "Title, description, keywords, robots (index/follow) và Open Graph (ảnh, tiêu đề khi chia sẻ) cho từng sản phẩm." },
    ],
  },
  {
    name: "admin-3-product-variants",
    title: "Sản phẩm có biến thể",
    url: async (page) => firstLink(page, "/admin/product/list", "/admin/product/edit/[0-9a-f]{24}"),
    clipFrom: { text: "Giá mới", css: "label" },
    callouts: [
      { at: { union: [{ text: "Danh sách thuộc tính", css: "label" }, { css: "[checkbox-list=attributes]" }] }, title: "Chọn thuộc tính",
        text: "Thuộc tính (màu sắc, kích cỡ...) quản lý riêng; chọn thuộc tính nào thì sinh tổ hợp từ các giá trị của nó." },
      { at: { css: "[button-render-variant]" }, title: "Sinh biến thể",
        text: "Tạo đủ các tổ hợp, mỗi dòng có công tắc bật/tắt, giá cũ, giá mới và tồn kho riêng." },
      { at: { css: "[variant-table]" }, title: "Bảng biến thể",
        text: "Khi đặt hàng, kho được trừ đúng biến thể bằng lệnh cập nhật có điều kiện (không bán quá số còn lại)." },
      { at: { css: "#stock", box: ".mb-3" }, title: "Kho chung",
        text: "Tự tính lại bằng tổng kho các biến thể đang bật khi lưu sản phẩm, khi đặt hàng và khi hoàn kho." },
    ],
  },
  {
    name: "admin-4-order-list",
    title: "Quản lý đơn hàng",
    url: async () => "/admin/order/list",
    blur: ["td small.text-muted"], // số điện thoại khách
    callouts: [
      { at: { text: "Thanh toán", css: "th" }, title: "Phương thức thanh toán",
        text: "Tiền mặt, VNPay, ZaloPay. Callback của cổng thanh toán chỉ đổi trạng thái một lần (idempotent), gọi lặp không cộng điểm hai lần." },
      { at: { text: "TT thanh toán", css: "th" }, title: "Trạng thái thanh toán",
        text: "Chưa thanh toán / đã thanh toán / hoàn tiền. Doanh thu trên dashboard chỉ tính đơn đã thanh toán." },
      { at: { text: "TT đơn hàng", css: "th" }, title: "Trạng thái đơn",
        text: "Chờ xác nhận → đã xác nhận → đang giao → giao thành công, hoặc hủy / trả hàng." },
      { at: { text: "Xuất Excel", css: "a,button" }, title: "Xuất file",
        text: "Xuất toàn bộ đơn hàng ra CSV (UTF-8 có BOM, mở được bằng Excel)." },
    ],
  },
  {
    name: "admin-5-order-detail",
    title: "Xử lý một đơn hàng",
    url: async (page) => firstLink(page, "/admin/order/list", "/admin/order/edit/[0-9a-f]{24}"),
    clipHeight: 1290,
    blur: ["label:Họ tên", "label:Số điện thoại", "label:Địa chỉ"],
    callouts: [
      { at: { text: "Sản phẩm trong đơn", css: "h4,h5,h6", next: "*" }, title: "Ảnh chụp đơn hàng",
        text: "Tên, giá, biến thể được lưu lại lúc đặt; sửa sản phẩm sau này không làm thay đổi đơn cũ." },
      { at: { text: "Thanh toán & vận chuyển", css: "h4,h5,h6", widthOf: ".card-body", untilText: "Trạng thái đơn hàng" }, title: "Tiền và vận chuyển",
        text: "Tạm tính, mã giảm giá, điểm tích lũy đã dùng, phí ship tính theo đơn vị vận chuyển, tổng thanh toán." },
      { at: { text: "Trạng thái đơn hàng", css: "h4,h5,h6", next: "*" }, title: "Đổi trạng thái có ràng buộc",
        text: "Không quay lại từ đơn đã hoàn thành, đã hủy/trả; không chuyển đã thanh toán về chưa. Hủy hoặc trả hàng thì hoàn kho đúng một lần." },
    ],
  },
  {
    name: "admin-6-role",
    title: "Phân quyền (RBAC)",
    url: async (page) => firstLink(page, "/admin/role/list", "/admin/role/edit/[0-9a-f]{24}"),
    clipHeight: 640,
    callouts: [
      { at: { text: "Tên nhóm quyền", css: "label", box: "div" }, title: "Nhóm quyền",
        text: "Gán một hoặc nhiều nhóm cho mỗi tài khoản quản trị; quyền được cộng dồn." },
      { at: { text: "Phân quyền", css: "label", next: "*" }, title: "55 quyền chi tiết",
        text: "Theo từng chức năng và hành động (xem, tạo, sửa, xóa...). Route của mọi chức năng quản trị đều đi qua middleware checkPermission." },
      { at: { text: "Trạng thái", css: "label", box: "div" }, title: "Tạm dừng nhóm",
        text: "Nhóm ở trạng thái tạm dừng thì các quyền của nó không còn hiệu lực ngay ở request kế tiếp." },
    ],
  },
  {
    name: "admin-7-template",
    title: "Dựng trang bằng khối giao diện",
    url: async (page) => firstLink(page, "/admin/template/list", "/admin/template/edit/[0-9a-f]{24}"),
    callouts: [
      { at: { text: "Đường dẫn áp dụng", css: "label", box: "div" }, title: "Trang áp dụng",
        text: "Mỗi template gắn với một đường dẫn của website (\"/\" là trang chủ)." },
      { at: { text: "Sắp xếp khối giao diện", css: "label", next: "*" }, title: "Kéo thả thứ tự",
        text: "Trang được render lần lượt theo thứ tự khối ở đây; khối đang tạm dừng sẽ tự bỏ qua." },
      { at: { text: "Danh sách khối giao diện", css: "label", next: "*" }, title: "Kho khối",
        text: "Mỗi khối là một file Pug (banner, sản phẩm bán chạy, flash sale...) nhận dữ liệu riêng; thêm khối mới không cần sửa trang." },
    ],
  },
  {
    name: "admin-8-chat-ai",
    title: "Chat với khách + trợ lý AI",
    url: async (page) => process.env.CHAT_ROOM_ID
      ? `/admin/chat/detail/${process.env.CHAT_ROOM_ID}`
      : firstLink(page, "/admin/chat/list/my-chat", "/admin/chat/detail/[0-9a-f]{24}"),
    prepare: async (page) => {
      await page.click("#button-ai-suggest-reply");
      // Đưa chuột vào vùng tin nhắn và đóng tooltip của nút vừa bấm (để chuột ở mép trái sẽ bung menu)
      const body = await page.$eval(".chat-body", el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.move(body.x, body.y);
      await page.evaluate(() => { document.activeElement?.blur(); document.querySelectorAll(".tooltip").forEach(el => el.remove()); });
      await page.waitForFunction(() => {
        const box = document.querySelector("#chat-ai-suggest-reply .inner-content");
        return box && box.textContent && box.textContent !== "AI đang xử lý...";
      }, { timeout: 30000 });
    },
    callouts: [
      { at: { css: ".chat-body" }, title: "Chat thời gian thực",
        text: "Socket.IO, mỗi phòng chat được giao cho một admin; admin chỉ đọc được phòng của mình." },
      { at: { css: "#button-ai-customer-emotions", union2: "#button-ai-chat-summary" }, title: "AI phân tích",
        text: "Tóm tắt hội thoại và phân tích cảm xúc khách từ 10 tin nhắn gần nhất (Groq API)." },
      { at: { css: "#chat-ai-suggest-reply" }, title: "AI gợi ý trả lời",
        text: "Gợi ý 3 câu trả lời, hoặc sửa câu admin đang soạn cho hay hơn; admin vẫn là người quyết định gửi." },
    ],
  },
];

// Chạy trong trang: trả về khung chữ nhật (tọa độ tài liệu) của phần tử theo mô tả định vị
const locate = (spec) => {
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  };
  const union = (rs) => {
    const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y));
    return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y };
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const find = (s) => {
    if (s.union) return union(s.union.map(find).filter(Boolean));
    let list = [...document.querySelectorAll(s.css || "*")].filter(visible);
    if (s.text) {
      list = list.filter(el => el.textContent.trim().replace(/\s+/g, " ").startsWith(s.text));
      list.sort((a, b) => a.textContent.length - b.textContent.length);
    }
    let el = list[s.nth || 0];
    if (!el) return null;
    if (s.box) el = el.closest(s.box) || el;
    let rect = rectOf(el);
    if (s.next) {
      let sib = el.nextElementSibling;
      while (sib && !visible(sib)) sib = sib.nextElementSibling;
      if (sib) rect = union([rect, rectOf(sib)]);
    }
    if (s.widthOf) {
      const parent = el.closest(s.widthOf);
      if (parent) { const p = rectOf(parent); rect.x = p.x + 24; rect.w = p.w - 48; }
    }
    if (s.untilText) {
      const stop = [...document.querySelectorAll("h4,h5,h6,label")].find(e => e.textContent.trim().startsWith(s.untilText));
      if (stop) rect.h = rectOf(stop).y - rect.y - 12;
    }
    if (s.union2) {
      const other = document.querySelector(s.union2);
      if (other) rect = union([rect, rectOf(other)]);
    }
    return rect;
  };
  return find(spec);
};

const escapeHtml = (s) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));

// Ghép ảnh chụp + khung, số thứ tự + panel giải thích thành một trang HTML rồi chụp lại
const composeHtml = (shot, imageBase64, clip, marks) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Segoe UI", Roboto, Arial, sans-serif; background: #E8EEF5; }
  .wrap { display: flex; width: ${clip.width + PANEL_WIDTH}px; }
  .shot { position: relative; width: ${clip.width}px; height: ${clip.height}px; flex: none; }
  .shot img { display: block; width: 100%; height: 100%; }
  .box { position: absolute; border: 3px solid ${BRAND}; border-radius: 8px; box-shadow: 0 0 0 4px rgba(27,79,140,.18); }
  .num, .item .n { width: 34px; height: 34px; border-radius: 50%; background: ${BRAND}; color: #fff;
    font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center; flex: none;
    border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.25); }
  .num { position: absolute; }
  .panel { width: ${PANEL_WIDTH}px; padding: 32px 28px; background: #fff; border-left: 4px solid ${BRAND}; }
  .brand { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #64748B; font-weight: 600; }
  h1 { font-size: 26px; color: ${BRAND}; margin: 6px 0 24px; line-height: 1.25; }
  .item { display: flex; gap: 14px; margin-bottom: 20px; }
  .item h2 { font-size: 17px; color: #0F172A; margin: 4px 0 4px; }
  .item p { font-size: 15px; color: #334155; line-height: 1.5; }
</style></head><body><div class="wrap">
  <div class="shot"><img src="data:image/png;base64,${imageBase64}">
    ${marks.map((m) => `
      <div class="box" style="left:${m.x}px;top:${m.y}px;width:${m.w}px;height:${m.h}px"></div>
      ${m.label ? `<div class="num" style="left:${Math.max(2, m.x - 17)}px;top:${Math.max(2, m.y - 17)}px">${m.label}</div>` : ""}`).join("")}
  </div>
  <div class="panel">
    <div class="brand">Questa · Trang quản trị</div>
    <h1>${escapeHtml(shot.title)}</h1>
    ${shot.callouts.map((c, i) => `
      <div class="item"><div class="n">${i + 1}</div>
        <div><h2>${escapeHtml(c.title)}</h2><p>${escapeHtml(c.text)}</p></div></div>`).join("")}
  </div>
</div></body></html>`;

const run = async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setViewport(VIEW);
    await page.setCookie({ name: "tokenAdmin", value: TOKEN, url: BASE });
    // Tắt hiệu ứng để biểu đồ, modal vẽ xong ngay khi chụp
    await page.evaluateOnNewDocument(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "*,*::before,*::after{transition:none!important;animation:none!important}";
        document.head.appendChild(style);
      });
    });

    for (const shot of shots) {
      if (process.env.ONLY && !shot.name.includes(process.env.ONLY)) continue;
      const url = await shot.url(page);
      // Ảnh cao hơn màn hình thì mở rộng cửa sổ, để menu cố định bên trái kéo dài hết ảnh
      await page.setViewport({ ...VIEW, height: Math.max(VIEW.height, shot.clipHeight || 0) });
      await page.goto(BASE + url, { waitUntil: "networkidle2" });
      if (page.url().includes("/account/login")) throw new Error("ADMIN_TOKEN không hợp lệ hoặc đã hết hạn");
      if (shot.prepare) await shot.prepare(page);
      await new Promise(r => setTimeout(r, 800));

      // Vùng chụp: mặc định là màn hình đầu; clipFrom thì bắt đầu ngay trên phần tử đó
      let top = 0;
      if (shot.clipFrom) {
        const r = await page.evaluate(locate, shot.clipFrom);
        if (r) top = Math.max(0, Math.round(r.y - 24));
      }
      const height = shot.clipHeight || VIEW.height;
      // Thanh trên cùng đang dính (sticky/fixed) sẽ che nội dung khi cuộn, cho nó nằm yên ở đầu trang
      if (top > 0) {
        await page.evaluate(() => {
          for (const el of document.querySelectorAll("body *")) {
            const st = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if ((st.position === "fixed" || st.position === "sticky") && r.top <= 0 && r.width > 500) el.style.position = "absolute";
          }
        });
      }
      await page.evaluate((y) => window.scrollTo(0, y), top);
      await new Promise(r => setTimeout(r, 300));

      // Làm mờ thông tin cá nhân (tên, số điện thoại, địa chỉ khách). "label:Chữ" = ô nhập ngay sau nhãn đó.
      // Mẫu nào không khớp phần tử nào thì dừng, tránh lọt thông tin cá nhân vào ảnh khi giao diện đổi.
      if (shot.blur) {
        const missing = await page.evaluate((selectors) => {
          const missing = [];
          for (const sel of selectors) {
            const list = sel.startsWith("label:")
              ? [...document.querySelectorAll("label")]
                  .filter(l => l.textContent.trim() === sel.slice(6))
                  .map(l => l.nextElementSibling).filter(Boolean)
              : [...document.querySelectorAll(sel)];
            list.forEach(el => { el.style.filter = "blur(6px)"; });
            if (!list.length) missing.push(sel);
          }
          return missing;
        }, shot.blur);
        if (missing.length) throw new Error(`${shot.name}: không tìm thấy phần tử cần làm mờ: ${missing.join(", ")}`);
      }

      // Mỗi điểm giải thích có thể khoanh nhiều khung (at là mảng), số thứ tự đặt ở khung đầu
      const marks = [];
      for (const [index, c] of shot.callouts.entries()) {
        for (const [k, spec] of [].concat(c.at).entries()) {
          const r = await page.evaluate(locate, spec);
          if (process.env.DEBUG) console.log(shot.name, c.title, r ? `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)}` : "KHÔNG THẤY");
          if (!r) throw new Error(`${shot.name}: không tìm thấy phần tử cho "${c.title}"`);
          // Đổi sang tọa độ trong ảnh và cắt theo vùng chụp
          const pad = 6;
          const y = Math.max(4, r.y - top - pad);
          const bottom = Math.min(height - 4, r.y - top + r.h + pad);
          marks.push({ x: Math.max(4, r.x - pad), y, w: Math.min(VIEW.width - 8, r.w + pad * 2), h: Math.max(20, bottom - y),
            label: k === 0 ? index + 1 : null });
        }
      }

      const clip = { x: 0, y: top, width: VIEW.width, height };
      const imageBase64 = await page.screenshot({ clip, encoding: "base64", captureBeyondViewport: true });

      const composer = await browser.newPage();
      await composer.setViewport({ width: VIEW.width + PANEL_WIDTH, height, deviceScaleFactor: 1 });
      await composer.setContent(composeHtml(shot, imageBase64, clip, marks), { waitUntil: "load" });
      const wrap = await composer.$(".wrap");
      const file = path.join(OUT_DIR, `${shot.name}.png`);
      await wrap.screenshot({ path: file });
      await composer.close();
      console.log("Đã lưu", path.relative(process.cwd(), file));
    }
  } finally {
    await browser.close();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
