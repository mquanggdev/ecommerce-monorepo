import rateLimit from "express-rate-limit";

// Tạo bộ giới hạn số lần gọi theo IP, trả lỗi theo đúng định dạng JSON của hệ thống
const createLimiter = (limit: number, message: string, skip?: (req: any, res: any) => boolean) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    limit: limit,
    skip: skip,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        code: "error",
        message: message
      });
    }
  });
}

// Đăng nhập: chống dò mật khẩu. Khách hàng và admin dùng bộ đếm riêng.
export const loginLimiter = createLimiter(10, "Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau 15 phút!");
export const adminLoginLimiter = createLimiter(10, "Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau 15 phút!");

// Yêu cầu gửi OTP: chống spam email
export const forgotPasswordLimiter = createLimiter(5, "Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau 15 phút!");

// Nhập OTP: chống dò mã
export const otpLimiter = createLimiter(10, "Bạn đã nhập mã OTP quá nhiều lần, vui lòng thử lại sau 15 phút!");

// Bản đồ đi qua server (dùng API key của shop): chặn việc lấy proxy làm nguồn bản đồ miễn phí
// Một lần xem/kéo bản đồ tải khoảng 15-30 ô ảnh nên giới hạn ô ảnh rộng hơn giới hạn tìm địa chỉ
export const mapTileLimiter = createLimiter(1500, "Bạn đã tải bản đồ quá nhiều lần, vui lòng thử lại sau 15 phút!");
export const mapGeocodeLimiter = createLimiter(120, "Bạn đã tìm địa chỉ quá nhiều lần, vui lòng thử lại sau 15 phút!");

// Khách vãng lai đặt hàng: chống đơn ảo giữ kho. Khách đã đăng nhập không bị giới hạn này
export const guestOrderLimiter = createLimiter(
  5,
  "Bạn đặt hàng quá nhiều lần, vui lòng thử lại sau 15 phút hoặc đăng nhập!",
  (req, res) => !!res.locals.accountUser
);

// Tra cứu đơn bằng mã đơn + số điện thoại: chống dò mã đơn
export const orderLookupLimiter = createLimiter(10, "Bạn đã tra cứu quá nhiều lần, vui lòng thử lại sau 15 phút!");
