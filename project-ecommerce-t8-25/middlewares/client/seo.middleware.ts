import { Request, Response, NextFunction } from "express";
import { siteInfo } from "../../configs/variable.config";

export const canonical = (req: Request, res: Response, next: NextFunction) => {
  const protocol = req.protocol;
  const host = req.get("host");

  // Lấy path không có query string
  const path = req.originalUrl.split("?")[0];

  res.locals.canonicalUrl = `${protocol}://${host}${path}`;
  // Dùng để dựng URL tuyệt đối cho ảnh chia sẻ, dữ liệu cấu trúc
  res.locals.siteOrigin = `${protocol}://${host}`;
  res.locals.siteHost = host;
  res.locals.siteInfo = siteInfo;
  next();
};
