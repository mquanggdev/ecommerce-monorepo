
import { pointConfig } from "../configs/variable.config";
import AccountUser from "../models/account-user.model";
import Order from "../models/order.model";

// Chuyển đơn từ unpaid sang paid ĐÚNG MỘT LẦN.
// Trả về true nếu lần gọi này thực sự đổi trạng thái, false nếu đơn đã thanh toán từ trước hoặc không tồn tại.
export const confirmOrderPaid = async (
  orderCode: string,
  phone: string,
  payment: {
    provider: string,
    transactionId: string,
    responseCode: string,
    amount: number
  }
): Promise<boolean> => {
  const result = await Order.updateOne(
    {
      code: orderCode,
      phone: phone,
      deleted: false,
      paymentStatus: "unpaid" // Điều kiện then chốt: chỉ khớp khi CHƯA thanh toán
    },
    {
      paymentStatus: "paid",
      paidAt: new Date(),
      payment: {
        ...payment,
        confirmedAt: new Date()
      }
    }
  );
  return result.modifiedCount === 1;
}

export const addPointAfterPayment = async (orderCode: string) => {
  // "Giành quyền" cộng điểm: chỉ một lời gọi đặt được pointsAwardedAt
  const order: any = await Order.findOneAndUpdate(
    {
      code: orderCode,
      deleted: false,
      paymentStatus: "paid",
      pointsAwardedAt: { $exists: false }
    },
    {
      pointsAwardedAt: new Date()
    }
  );
  if(!order || !order.userId) return;

  const pointEarned = Math.floor(order.total / pointConfig.MONEY_PER_POINT); // Số điểm được tích
  if (pointEarned > 0) {
    await AccountUser.updateOne(
      {
        _id: order.userId,
        deleted: false,
        status: "active"
      },
      {
        $inc: {
          totalPoint: pointEarned
        }
      }
    );
  }
}
