import cron from "node-cron";
import Order from "../models/order.model";
import { PAYMENT_TIMEOUT_MINUTES, resolveUnpaidOnlineOrder } from "../helpers/payment-query.helper";

// Đơn VNPay/ZaloPay quá hạn mà chưa có kết quả thanh toán (khách đóng trình duyệt, link hết hạn...):
// hỏi lại cổng — đã trả thì ghi nhận thanh toán, chưa trả thì chuyển sang thanh toán khi nhận hàng.
export const processUnpaidOnlineOrders = async () => {
  const deadline = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
  const orderList = await Order
    .find({
      deleted: false,
      paymentStatus: "unpaid",
      paymentMethod: { $in: ["vnpay", "zalopay"] },
      orderStatus: { $nin: ["cancelled", "returned"] },
      createdAt: { $lt: deadline }
    })
    .sort({ createdAt: "asc" })
    .limit(50);

  const summary: Record<string, number> = { paid: 0, switched: 0, unknown: 0, skipped: 0 };
  for (const order of orderList) {
    try {
      const outcome = await resolveUnpaidOnlineOrder(order, "timeout");
      summary[outcome]++;
    } catch (error: any) {
      summary.unknown++;
      console.error(`[Thanh toán] Lỗi xử lý đơn ${order.code}:`, error.message);
    }
  }

  if(orderList.length > 0) {
    console.log(`[Thanh toán] Đơn online quá hạn: ${orderList.length} đơn — đã thanh toán ${summary.paid}, chuyển sang thanh toán khi nhận hàng ${summary.switched}, chưa rõ ${summary.unknown}`);
  }
  return summary;
}

export const autoResolveUnpaidOnlineOrders = () => {
  let isRunning = false;
  // 5 phút một lần; lần trước chưa xong thì bỏ qua lần này
  cron.schedule("*/5 * * * *", async () => {
    if(isRunning) return;
    isRunning = true;
    try {
      await processUnpaidOnlineOrders();
    } catch (error: any) {
      console.error("[Thanh toán] Job đơn online quá hạn lỗi:", error.message);
    } finally {
      isRunning = false;
    }
  });
}
