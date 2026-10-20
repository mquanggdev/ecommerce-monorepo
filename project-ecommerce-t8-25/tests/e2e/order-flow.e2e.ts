// Kiểm thử e2e luồng mua hàng + hủy đơn của khách vãng lai và khách có tài khoản, chạy trên trình duyệt thật (puppeteer).
// Chạy: npm run test:e2e   (server phải đang chạy; đổi địa chỉ bằng E2E_BASE_URL, mặc định http://localhost:3000)
// Bài test tự tạo tài khoản tạm, kiểm tra kho trừ/hoàn đúng một lần, rồi dọn sạch đơn + tài khoản tạm khi xong.
import "dotenv/config";
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import puppeteer, { Browser, BrowserContext, Page } from "puppeteer";
import { connectDB } from "../../configs/database.config";
import Order from "../../models/order.model";
import Product from "../../models/product.model";
import AccountUser from "../../models/account-user.model";
import { cancelOrderByUser } from "../../helpers/order-cancel.helper";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const PRODUCT_SLUG = "ao-khoac-gio-hai-lop";
const PHONE = "0918079395";
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

if(BASE.includes("quangtm.site")) {
  throw new Error("Không chạy e2e trên production (tạo đơn thật)");
}

let browser: Browser;
const createdCodes: string[] = [];
const testEmail = `e2e-${Date.now()}@example.com`;
const testPassword = crypto.randomBytes(12).toString("hex");
let testUserId = "";

const getStock = async (): Promise<number> => {
  const product = await Product.findOne({ slug: PRODUCT_SLUG }).select("stock").lean();
  return Number(product?.stock);
}

const newPage = async (context: BrowserContext): Promise<Page> => {
  const page = await context.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  return page;
}

// Thêm 1 sản phẩm vào giỏ qua trang chi tiết, điền địa chỉ ở trang thanh toán và đặt hàng khi nhận hàng. Trả về mã đơn.
const placeOrder = async (page: Page, onCheckout?: (page: Page) => Promise<void>): Promise<string> => {
  await page.goto(`${BASE}/product/detail/${PRODUCT_SLUG}`, { waitUntil: "networkidle2" });
  // Hàm chạy trong trình duyệt không dùng async/await: TypeScript (target ES6) biên dịch thành __awaiter không có ở trình duyệt
  await page.evaluate(() => {
    localStorage.setItem("cart", "[]");
    (document.querySelector(".details_variant_color li") as HTMLElement).click();
    (document.querySelector(".details_variant_size li[variant='m']") as HTMLElement).click();
  });
  await sleep(300);
  await page.evaluate(() => (document.querySelector("[button-add-cart]") as HTMLElement).click());
  await sleep(700);

  await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle2" });
  if(onCheckout) await onCheckout(page);
  await page.evaluate((phone) => {
    const form = document.querySelector("#checkoutAddressForm") as any;
    form.querySelector("input[name=userAddress]").checked = true;
    form.fullName.value = "Khách Kiểm Thử E2E";
    form.phone.value = phone;
    form.address.value = "Hồ Hoàn Kiếm, Hàng Trống, Hoàn Kiếm, Hà Nội";
    form.longitude.value = "105.8524";
    form.latitude.value = "21.0287";
  }, PHONE);
  // drawCart là hàm toàn cục của main.js (khai báo bằng const, không nằm trên window)
  await page.evaluate("drawCart()");
  await page.waitForSelector("input[name=shippingMethod]", { timeout: 60000 });
  await page.evaluate(() => {
    (document.querySelector("input[name=shippingMethod]") as HTMLInputElement).checked = true;
    (document.querySelector("#paymentMethodMoney") as HTMLInputElement).checked = true;
    (document.querySelector("[button-order]") as HTMLElement).click();
  });

  // Đặt xong thì chuyển sang trang thành công có mã đơn trên đường dẫn
  const start = Date.now();
  while(Date.now() - start < 60000) {
    const match = page.url().match(/orderCode=([A-Z0-9]+)/);
    if(match) {
      await page.waitForSelector(".payment_success_text");
      createdCodes.push(match[1]);
      return match[1];
    }
    await sleep(300);
  }
  throw new Error("Đặt hàng không thành công");
}

// Bấm nút hủy, chọn lý do đầu tiên trong popup và xác nhận
const cancelViaModal = async (page: Page) => {
  await page.evaluate(() => (document.querySelector("[button-cancel-order]") as HTMLElement).click());
  await page.waitForSelector("#modalCancelOrder.show");
  await page.evaluate(() => (document.querySelector("#cancelReason0") as HTMLElement).click());
  const navigation = page.waitForNavigation({ waitUntil: "networkidle2" });
  await page.evaluate(() => (document.querySelector("[button-submit-cancel]") as HTMLElement).click());
  await navigation;
}

const patchJson = (page: Page, url: string) => page.evaluate((url) => {
  return fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Đổi ý, không muốn mua nữa", note: "" })
  }).then(res => res.json().catch(() => ({ code: "error", status: res.status })));
}, url);

before(async () => {
  await connectDB();
  const user = await AccountUser.create({
    fullName: "Khách Kiểm Thử E2E",
    email: testEmail,
    phone: PHONE,
    password: await bcrypt.hash(testPassword, 10),
    status: "active"
  });
  testUserId = `${user._id}`;
  browser = await puppeteer.launch();
});

after(async () => {
  // Đơn còn chờ (khi test hỏng giữa chừng) thì hủy để hoàn kho, sau đó xóa mềm toàn bộ đơn test và xóa tài khoản tạm
  const orders = await Order.find({ code: { $in: createdCodes } });
  for(const order of orders) {
    if(order.orderStatus === "pending") {
      await cancelOrderByUser(order.id, { userId: `${order.userId}` }, "Dọn dữ liệu kiểm thử e2e");
    }
  }
  await Order.updateMany({ code: { $in: createdCodes } }, { deleted: true, deletedAt: new Date() });
  await AccountUser.deleteOne({ _id: testUserId });
  await browser?.close();
  await mongoose.disconnect();
});

describe("Khách vãng lai: mua hàng và tự hủy đơn", () => {
  let context: BrowserContext;
  let page: Page;
  let code = "";
  let detailUrl = "";
  let stockBefore = 0;

  before(async () => {
    context = await browser.createBrowserContext();
    page = await newPage(context);
  });

  test("trang thanh toán chỉ cho thanh toán khi nhận hàng", async () => {
    stockBefore = await getStock();
    code = await placeOrder(page, async (page) => {
      const methods = await page.$$eval("input[name=paymentMethod]", inputs => inputs.map(input => (input as HTMLInputElement).value));
      assert.deepEqual(methods, ["money"]);
    });
  });

  test("đơn được lưu đúng: không gắn tài khoản, chờ xác nhận, kho trừ 1", async () => {
    const order = await Order.findOne({ code }).lean();
    assert.ok(order);
    assert.equal(order.userId, "");
    assert.equal(order.paymentMethod, "money");
    assert.equal(order.orderStatus, "pending");
    assert.equal(await getStock(), stockBefore - 1);
  });

  test("trang tra cứu hiện đơn trong danh sách trên thiết bị", async () => {
    await page.goto(`${BASE}/order/lookup`, { waitUntil: "networkidle2" });
    const codes = await page.$$eval(".device_orders tbody tr td:first-child", tds => tds.map(td => td.textContent?.trim()));
    assert.ok(codes.includes(code));
  });

  test("trình duyệt khác không xem/hủy được đơn này", async () => {
    const order = await Order.findOne({ code }).select("_id").lean();
    detailUrl = `/order/lookup/detail/${order!._id}`;
    const otherContext = await browser.createBrowserContext();
    const other = await newPage(otherContext);
    await other.goto(`${BASE}${detailUrl}`, { waitUntil: "networkidle2" });
    assert.equal(new URL(other.url()).pathname, "/order/lookup");
    const result = await patchJson(other, detailUrl.replace("detail", "cancel"));
    assert.notEqual(result.code, "success");
    await otherContext.close();
  });

  test("tự hủy từ trang chi tiết: đơn Đã hủy, kho hoàn lại", async () => {
    await page.goto(`${BASE}${detailUrl}`, { waitUntil: "networkidle2" });
    await cancelViaModal(page);
    const invoice = await page.$eval(".dashboard_order_invoice_area", el => (el as HTMLElement).innerText);
    assert.ok(invoice.includes("Đã hủy"));
    const order = await Order.findOne({ code }).lean();
    assert.equal(order!.orderStatus, "cancelled");
    assert.equal(await getStock(), stockBefore);
  });

  test("hủy lần nữa bị từ chối, kho không hoàn hai lần", async () => {
    const result = await patchJson(page, detailUrl.replace("detail", "cancel"));
    assert.notEqual(result.code, "success");
    assert.equal(await getStock(), stockBefore);
  });

  after(async () => {
    await context?.close();
  });
});

describe("Khách có tài khoản: mua hàng và tự hủy đơn", () => {
  let context: BrowserContext;
  let page: Page;
  let code = "";
  let stockBefore = 0;

  before(async () => {
    context = await browser.createBrowserContext();
    page = await newPage(context);
  });

  test("đăng nhập bằng form", async () => {
    await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle2" });
    await page.type("#email", testEmail);
    await page.type("#password", testPassword);
    await page.click("#loginForm button[type=submit]");
    await page.waitForFunction(() => location.pathname === "/", { timeout: 30000 });
    const cookies = await context.cookies();
    assert.ok(cookies.some(cookie => cookie.name === "tokenUser"));
  });

  test("trang thanh toán có cả thanh toán online, đặt hàng khi nhận hàng thành công", async () => {
    stockBefore = await getStock();
    code = await placeOrder(page, async (page) => {
      const methods = await page.$$eval("input[name=paymentMethod]", inputs => inputs.map(input => (input as HTMLInputElement).value));
      assert.deepEqual(methods.sort(), ["money", "vnpay", "zalopay"]);
    });
  });

  test("đơn gắn với tài khoản, kho trừ 1, không ghi vào danh sách khách vãng lai", async () => {
    const order = await Order.findOne({ code }).lean();
    assert.ok(order);
    assert.equal(order.userId, testUserId);
    assert.equal(order.orderStatus, "pending");
    assert.equal(await getStock(), stockBefore - 1);
    const cookies = await context.cookies();
    assert.ok(!cookies.some(cookie => cookie.name === "guestOrders"));
  });

  test("người chưa đăng nhập không hủy được đơn của tài khoản", async () => {
    const order = await Order.findOne({ code }).select("_id").lean();
    const otherContext = await browser.createBrowserContext();
    const other = await newPage(otherContext);
    await other.goto(`${BASE}/`, { waitUntil: "networkidle2" });
    const result = await patchJson(other, `/dashboard/order/cancel/${order!._id}`);
    assert.notEqual(result.code, "success");
    assert.equal((await Order.findOne({ code }).lean())!.orderStatus, "pending");
    await otherContext.close();
  });

  test("tự hủy từ \"Đơn hàng của tôi\": đơn Đã hủy, kho hoàn lại", async () => {
    await page.goto(`${BASE}/dashboard/order/list`, { waitUntil: "networkidle2" });
    const navigation = page.waitForNavigation({ waitUntil: "networkidle2" });
    const found = await page.evaluate((code) => {
      const row = [...document.querySelectorAll("tr")].find(tr => tr.textContent?.includes(code));
      const link = row?.querySelector("a[href^='/dashboard/order/detail/']") as HTMLElement | null;
      link?.click();
      return !!link;
    }, code);
    assert.ok(found, "Không thấy đơn trong danh sách đơn hàng của tôi");
    await navigation;
    await cancelViaModal(page);
    const order = await Order.findOne({ code }).lean();
    assert.equal(order!.orderStatus, "cancelled");
    assert.equal(await getStock(), stockBefore);
  });

  after(async () => {
    await context?.close();
  });
});
