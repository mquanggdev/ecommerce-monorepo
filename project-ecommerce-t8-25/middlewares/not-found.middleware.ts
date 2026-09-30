import { Request, Response } from "express";
import { pathAdmin } from "../configs/variable.config";

// Đặt SAU tất cả route: request nào tới được đây nghĩa là không route nào khớp
export const notFound = (req: Request, res: Response) => {
  // Trình duyệt mở trang → hiện trang 404. Lời gọi API (fetch) → trả JSON theo định dạng chung.
  if(`${req.headers.accept || ""}`.includes("text/html")) {
    res.status(404).render("errors/404", {
      homeUrl: req.path.startsWith(`/${pathAdmin}`) ? `/${pathAdmin}/dashboard` : "/"
    });
    return;
  }

  res.status(404).json({
    code: "error",
    message: "Không tìm thấy!"
  });
}
