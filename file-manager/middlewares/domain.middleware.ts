import { NextFunction, Request, Response } from "express";

export const checkDomain = (req: Request, res: Response, next: NextFunction) => {
  const referer: string = req.headers.referer || "";
  const allowedOrigin: string = process.env.DOMAIN || "";

  if (allowedOrigin && !referer.startsWith(allowedOrigin)) {
    res.status(403).send("Truy cập không hợp lệ!");
    return;
  }

  next();
};