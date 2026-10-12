import crypto from "crypto";
import axios from "axios";
import moment from "moment";
import Order from "../models/order.model";
import { getApiPayment } from "../configs/setting.config";
import { addPointAfterPayment, confirmOrderPaid } from "./point.helper";

// Link thanh toán VNPay/ZaloPay hết hạn sau 15 phút; quá 20 phút không có kết quả thì coi là khách bỏ thanh toán
export const PAYMENT_LINK_MINUTES = 15;
export const PAYMENT_TIMEOUT_MINUTES = 20;

const VNPAY_API_URL_DEFAULT = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

// Kết quả hỏi cổng: "paid" đã trả, "unpaid" chắc chắn chưa trả, "unknown" chưa biết (cổng lỗi, đang xử lý...)
type QueryResult = {
  status: "paid" | "unpaid" | "unknown",
  provider?: string,
  transactionId?: string,
  amount?: number,
  message?: string
};

const hmac = (algorithm: string, key: string, data: string) =>
  crypto.createHmac(algorithm, key).update(Buffer.from(data, "utf-8")).digest("hex");

// VNPay querydr: tra cứu một lần tạo link thanh toán
const queryVNPay = async (apiPayment: any, attempt: any, order: any): Promise<QueryResult> => {
  const now = moment().format("YYYYMMDDHHmmss");
  const data: any = {
    vnp_RequestId: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    vnp_Version: "2.1.0",
    vnp_Command: "querydr",
    vnp_TmnCode: `${apiPayment.vnPayTmnCode}`,
    vnp_TxnRef: attempt.ref,
    vnp_OrderInfo: `Tra cuu don ${order.code}`,
    vnp_TransactionDate: attempt.createDate,
    vnp_CreateDate: now,
    vnp_IpAddr: "127.0.0.1"
  };
  const signData = [
    data.vnp_RequestId, data.vnp_Version, data.vnp_Command, data.vnp_TmnCode, data.vnp_TxnRef,
    data.vnp_TransactionDate, data.vnp_CreateDate, data.vnp_IpAddr, data.vnp_OrderInfo
  ].join("|");
  data.vnp_SecureHash = hmac("sha512", `${apiPayment.vnPayHashSecret}`, signData);

  const response = await axios.post(apiPayment.vnPayApiUrl || VNPAY_API_URL_DEFAULT, data, { timeout: 15000 });
  const result = response.data || {};

  // Phản hồi có chữ ký: sai chữ ký thì không tin kết quả
  const responseSignData = [
    "vnp_ResponseId", "vnp_Command", "vnp_ResponseCode", "vnp_Message", "vnp_TmnCode", "vnp_TxnRef", "vnp_Amount",
    "vnp_BankCode", "vnp_PayDate", "vnp_TransactionNo", "vnp_TransactionType", "vnp_TransactionStatus",
    "vnp_OrderInfo", "vnp_PromotionCode", "vnp_PromotionAmount"
  ].map(key => result[key] ?? "").join("|");
  if(hmac("sha512", `${apiPayment.vnPayHashSecret}`, responseSignData) !== result.vnp_SecureHash) {
    return { status: "unknown", message: "VNPay: chữ ký phản hồi không hợp lệ" };
  }

  // 91: không tìm thấy giao dịch (khách chưa thanh toán)
  if(result.vnp_ResponseCode === "91") {
    return { status: "unpaid", message: "VNPay: không có giao dịch" };
  }
  if(result.vnp_ResponseCode !== "00") {
    return { status: "unknown", message: `VNPay: mã ${result.vnp_ResponseCode} ${result.vnp_Message || ""}` };
  }
  // 00: thanh toán thành công
  if(result.vnp_TransactionStatus === "00") {
    return {
      status: "paid",
      provider: "vnpay",
      transactionId: `${result.vnp_TransactionNo}`,
      amount: Number(result.vnp_Amount) / 100
    };
  }
  // Các trạng thái có thể khách đã bị trừ tiền thì chưa kết luận: 04 giao dịch đảo, 05/06 đang hoàn tiền,
  // 07 nghi ngờ gian lận, 09 hoàn trả bị từ chối. Còn lại (01 chưa hoàn tất, 02 lỗi, 11 khách hủy/hết hạn...) là chưa trả
  if(["04", "05", "06", "07", "09"].includes(result.vnp_TransactionStatus)) {
    return { status: "unknown", message: `VNPay: trạng thái ${result.vnp_TransactionStatus}` };
  }
  return { status: "unpaid", message: `VNPay: trạng thái ${result.vnp_TransactionStatus}` };
}

// ZaloPay /v2/query: tra cứu một lần tạo link thanh toán
const queryZaloPay = async (apiPayment: any, attempt: any): Promise<QueryResult> => {
  const appId = `${apiPayment.zaloPayAppId}`;
  const key1 = `${apiPayment.zaloPayKey1}`;
  const mac = hmac("sha256", key1, `${appId}|${attempt.ref}|${key1}`);

  const response = await axios.post(`${apiPayment.zaloPayDomain}/v2/query`, null, {
    params: { app_id: appId, app_trans_id: attempt.ref, mac: mac },
    timeout: 15000
  });
  const result = response.data || {};

  if(result.return_code === 1) {
    return {
      status: "paid",
      provider: "zalopay",
      transactionId: `${result.zp_trans_id}`,
      amount: Number(result.amount)
    };
  }
  // 2: thất bại / không tồn tại. Riêng -402 là sai chữ ký (lỗi cấu hình của mình), chưa kết luận được
  if(result.return_code === 2 && result.sub_return_code !== -402) {
    return { status: "unpaid", message: `ZaloPay: ${result.sub_return_message || result.return_message}` };
  }
  // 3: đang xử lý / chưa thanh toán. Đã quá hạn link thì không thể thanh toán được nữa
  const expired = Date.now() - new Date(attempt.createdAt).getTime() > PAYMENT_TIMEOUT_MINUTES * 60 * 1000;
  if(result.return_code === 3 && !result.is_processing && expired) {
    return { status: "unpaid", message: "ZaloPay: chưa thanh toán, link đã hết hạn" };
  }
  return { status: "unknown", message: `ZaloPay: ${result.return_code} ${result.sub_return_message || result.return_message || ""}` };
}

// Hỏi cổng về mọi lần tạo link của đơn: có một lần đã trả là "paid"; còn lần nào chưa rõ là "unknown".
// failedRefs: các giao dịch cổng đã xác nhận thất bại qua dữ liệu có chữ ký (VD ZaloPay đưa khách về với status khác 1);
// ZaloPay sandbox vẫn trả "chưa thực hiện" cho giao dịch khách vừa hủy, nên tra cứu một mình không kết luận được.
export const queryOrderPayment = async (order: any, failedRefs: string[] = []): Promise<QueryResult> => {
  const attempts: any[] = order.paymentAttempts || [];
  if(attempts.length === 0) {
    // Chưa từng tạo link thanh toán thì không thể có giao dịch
    return { status: "unpaid", message: "Chưa tạo link thanh toán" };
  }

  const apiPayment: any = await getApiPayment();
  if(!apiPayment) {
    return { status: "unknown", message: "Chưa cấu hình cổng thanh toán" };
  }

  let hasUnknown = false;
  const messages: string[] = [];
  for (const attempt of attempts) {
    if(failedRefs.includes(attempt.ref)) {
      messages.push(`${attempt.provider}: giao dịch ${attempt.ref} đã bị hủy/thất bại`);
      continue;
    }
    try {
      const result = attempt.provider === "vnpay"
        ? await queryVNPay(apiPayment, attempt, order)
        : await queryZaloPay(apiPayment, attempt);
      if(result.status === "paid") return result;
      if(result.status === "unknown") hasUnknown = true;
      if(result.message) messages.push(result.message);
    } catch (error: any) {
      hasUnknown = true;
      messages.push(`${attempt.provider}: ${error.message}`);
    }
  }
  return { status: hasUnknown ? "unknown" : "unpaid", message: messages.join("; ") };
}

// Chuyển đơn online chưa thanh toán sang thanh toán khi nhận hàng (chỉ khớp khi đơn vẫn đang chờ thanh toán online)
export const switchToCashOnDelivery = async (orderId: string, reason: "failed" | "timeout"): Promise<boolean> => {
  const order: any = await Order.findOne({ _id: orderId }).select("paymentMethod").lean();
  if(!order || !["vnpay", "zalopay"].includes(order.paymentMethod)) return false;

  const result = await Order.updateOne(
    {
      _id: orderId,
      deleted: false,
      paymentStatus: "unpaid",
      paymentMethod: order.paymentMethod,
      orderStatus: { $nin: ["cancelled", "returned"] }
    },
    {
      paymentMethod: "money",
      paymentSwitch: {
        from: order.paymentMethod,
        reason: reason,
        at: new Date()
      }
    }
  );
  return result.modifiedCount === 1;
}

// Cổng xác nhận đơn đã trả tiền: ghi nhận thanh toán (đúng một lần) và cộng điểm như callback.
// Trả false nếu số tiền cổng xác nhận không khớp tổng đơn.
export const recordGatewayPayment = async (order: any, result: QueryResult): Promise<boolean> => {
  if(Math.round(result.amount || 0) !== Math.round(order.total || 0)) {
    console.error(`[Thanh toán] Đơn ${order.code}: số tiền cổng xác nhận (${result.amount}) khác tổng đơn (${order.total})`);
    return false;
  }
  const isConfirmed = await confirmOrderPaid(order.code, order.phone, {
    provider: `${result.provider}`,
    transactionId: `${result.transactionId}`,
    responseCode: "query",
    amount: Number(result.amount)
  });
  if(isConfirmed) {
    await addPointAfterPayment(order.code);
  }
  return true;
}

// Đơn online chưa thanh toán: hỏi lại cổng rồi ghi nhận đã trả, hoặc chuyển sang thanh toán khi nhận hàng.
// Cổng chưa trả lời chắc chắn thì không làm gì (lần sau hỏi lại) — tránh chuyển đơn đã trả tiền khiến khách bị thu hai lần.
export const resolveUnpaidOnlineOrder = async (
  order: any,
  reason: "failed" | "timeout",
  failedRefs: string[] = []
): Promise<"paid" | "switched" | "unknown" | "skipped"> => {
  const result = await queryOrderPayment(order, failedRefs);

  if(result.status === "paid") {
    return await recordGatewayPayment(order, result) ? "paid" : "unknown";
  }

  if(result.status === "unpaid") {
    const isSwitched = await switchToCashOnDelivery(`${order._id}`, reason);
    return isSwitched ? "switched" : "skipped";
  }

  console.warn(`[Thanh toán] Đơn ${order.code}: chưa xác định được trạng thái thanh toán — ${result.message}`);
  return "unknown";
}
