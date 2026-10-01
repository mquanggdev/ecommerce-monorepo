import { NextFunction, Request, Response } from "express";
import { pathAdmin } from "../configs/variable.config";

// Bắt mọi lỗi chưa được xử lý (Express 5 tự chuyển lỗi của hàm async tới đây).
// Không để lộ stack trace cho người dùng; ghi log đầy đủ để tra cứu trên server.
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Lỗi do request của khách (JSON hỏng, body quá lớn...) đã có sẵn mã 4xx: giữ nguyên, không coi là lỗi server
  const status = Number(error?.status) >= 400 && Number(error?.status) < 500 ? Number(error.status) : 500;

  if(status === 500) {
    console.error(`Lỗi không xử lý được: ${req.method} ${req.originalUrl}`, error);
  }

  // Đã gửi một phần phản hồi thì chỉ còn cách để Express đóng kết nối
  if(res.headersSent) {
    next(error);
    return;
  }

  if(status !== 500) {
    res.status(status).json({
      code: "error",
      message: "Dữ liệu gửi lên không hợp lệ!"
    });
    return;
  }

  // Trình duyệt mở trang → trang lỗi 500. Lời gọi API (fetch) → JSON theo định dạng chung.
  if(`${req.headers.accept || ""}`.includes("text/html")) {
    res.status(500).render("errors/500", {
      homeUrl: req.path.startsWith(`/${pathAdmin}`) ? `/${pathAdmin}/dashboard` : "/"
    });
    return;
  }

  res.status(500).json({
    code: "error",
    message: "Đã có lỗi xảy ra, vui lòng thử lại sau!"
  });
}
