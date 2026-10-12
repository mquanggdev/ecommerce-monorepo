import axios from "axios";
import Order from "../models/order.model";
import Coupon from "../models/coupon.model";
import AccountUser from "../models/account-user.model";
import { increaseStock } from "./stock.helper";
import { getApiShipping } from "../configs/setting.config";

// Lý do khách được chọn khi hủy đơn
export const cancelReasonList = [
  "Đổi ý, không muốn mua nữa",
  "Muốn đổi sản phẩm / size / màu",
  "Đặt nhầm địa chỉ / số điện thoại",
  "Tìm được chỗ khác rẻ hơn",
  "Lý do khác"
];

// Trả lại mọi thứ đơn đã giữ khi đặt hàng: kho, điểm đã dùng, lượt mã giảm giá.
// Mỗi việc "giành quyền" bằng một mốc thời gian trên đơn, nên gọi lặp hay gọi đồng thời cũng chỉ trả đúng một lần.
export const releaseOrderResources = async (orderId: string): Promise<void> => {
  // Hoàn kho
  const stockClaimed: any = await Order.findOneAndUpdate(
    { _id: orderId, stockRestoredAt: { $exists: false } },
    { stockRestoredAt: new Date() }
  );
  if(stockClaimed) {
    for (const item of stockClaimed.items) {
      await increaseStock(item.productId, item.quantity, item.variantValue);
    }
  }

  // Trả điểm khách đã dùng cho đơn
  const pointClaimed: any = await Order.findOneAndUpdate(
    { _id: orderId, usedPoint: { $gt: 0 }, pointsReturnedAt: { $exists: false } },
    { pointsReturnedAt: new Date() }
  );
  if(pointClaimed && pointClaimed.userId) {
    await AccountUser.updateOne(
      { _id: pointClaimed.userId, usedPoint: { $gte: pointClaimed.usedPoint } },
      { $inc: { usedPoint: -pointClaimed.usedPoint } }
    );
  }

  // Trả lượt dùng mã giảm giá (đơn cũ chưa lưu couponId thì tìm theo mã)
  const couponClaimed: any = await Order.findOneAndUpdate(
    { _id: orderId, coupon: { $nin: [null, ""] }, couponReturnedAt: { $exists: false } },
    { couponReturnedAt: new Date() }
  );
  if(couponClaimed) {
    const couponFind = couponClaimed.couponId
      ? { _id: couponClaimed.couponId }
      : { code: `${couponClaimed.coupon}`.trim() };
    await Coupon.updateOne(
      { ...couponFind, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } }
    );
  }
}

// Hủy vận đơn GoShip đã tạo lúc đặt hàng. Lỗi chỉ ghi log, không chặn việc hủy đơn (shop xử lý tay)
export const cancelShipment = async (order: any): Promise<void> => {
  const goshipOrderId = order?.shipping?.goshipOrderId;
  if(!goshipOrderId) return;
  try {
    const apiShipping: any = await getApiShipping();
    await axios.delete(`https://sandbox.goship.io/api/v2/shipments/${goshipOrderId}`, {
      headers: { Authorization: `Bearer ${apiShipping.tokenGoShip}` },
      timeout: 15000
    });
  } catch (error: any) {
    console.error(`[GoShip] Không hủy được vận đơn ${goshipOrderId} của đơn ${order.code}:`, error.response?.status, JSON.stringify(error.response?.data || error.message));
  }
}

// Khách tự hủy: chỉ đơn của chính khách, đang "Chờ xác nhận" và chưa thanh toán.
// Lệnh cập nhật có điều kiện: nếu admin vừa xác nhận hoặc đơn vừa được thanh toán thì không khớp, không ghi đè.
export const cancelOrderByUser = async (orderId: string, userId: string, reason: string): Promise<any> => {
  const cancelled: any = await Order.findOneAndUpdate(
    {
      _id: orderId,
      userId: userId,
      deleted: false,
      orderStatus: "pending",
      paymentStatus: "unpaid"
    },
    {
      orderStatus: "cancelled",
      cancelReason: reason,
      cancelledBy: "user",
      cancelledAt: new Date()
    },
    { new: true }
  );
  if(!cancelled) return null;

  await releaseOrderResources(orderId);
  await cancelShipment(cancelled);
  return cancelled;
}
