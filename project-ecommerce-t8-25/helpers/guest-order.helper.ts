import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Đơn của khách vãng lai được xem/hủy bằng 2 loại cookie JWT có chữ ký (sửa tay là mất hiệu lực, JS không đọc được):
// - "guestOrders": danh sách đơn đã đặt/tra cứu trên thiết bị này, nhớ 90 ngày, tối đa 20 đơn
// - "orderLookup": đơn vừa tra cứu đúng bằng mã đơn + số điện thoại, hiệu lực 30 phút
const DEVICE_COOKIE = "guestOrders";
const DEVICE_DAYS = 90;
const DEVICE_MAX_ORDERS = 20;
const LOOKUP_COOKIE = "orderLookup";
const LOOKUP_MINUTES = 30;

const readToken = (req: Request, name: string, purpose: string): jwt.JwtPayload | null => {
  try {
    const decoded = jwt.verify(`${req.cookies[name]}`, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    return decoded.purpose === purpose ? decoded : null;
  } catch (error) {
    return null;
  }
}

// Id các đơn đã ghi nhớ trên thiết bị (mới nhất trước)
export const getDeviceOrderIds = (req: Request): string[] => {
  const decoded = readToken(req, DEVICE_COOKIE, "guest-orders");
  return Array.isArray(decoded?.orders) ? decoded!.orders.map((id: any) => `${id}`) : [];
}

// Ghi lại danh sách đơn trên thiết bị (gia hạn 90 ngày mỗi lần ghi)
export const saveDeviceOrderIds = (res: Response, orderIds: string[]) => {
  const orders = [...new Set(orderIds)].slice(0, DEVICE_MAX_ORDERS);
  const token = jwt.sign({ purpose: "guest-orders", orders: orders }, `${process.env.JWT_SECRET}`, { expiresIn: `${DEVICE_DAYS}d` });
  res.cookie(DEVICE_COOKIE, token, {
    httpOnly: true,
    maxAge: DEVICE_DAYS * 24 * 60 * 60 * 1000,
    sameSite: "lax"
  });
}

// Thêm một đơn vãng lai vào đầu danh sách trên thiết bị
export const rememberGuestOrder = (req: Request, res: Response, orderId: string) => {
  saveDeviceOrderIds(res, [orderId, ...getDeviceOrderIds(req).filter(id => id !== orderId)]);
}

export const forgetDeviceOrders = (res: Response) => {
  res.clearCookie(DEVICE_COOKIE);
}

// Đơn vừa tra cứu đúng bằng mã đơn + số điện thoại
export const getLookupOrderId = (req: Request): string | null => {
  const decoded = readToken(req, LOOKUP_COOKIE, "order-lookup");
  return decoded ? `${decoded.orderId}` : null;
}

export const setLookupOrder = (res: Response, orderId: string) => {
  const token = jwt.sign({ orderId: orderId, purpose: "order-lookup" }, `${process.env.JWT_SECRET}`, { expiresIn: `${LOOKUP_MINUTES}m` });
  res.cookie(LOOKUP_COOKIE, token, {
    httpOnly: true,
    maxAge: LOOKUP_MINUTES * 60 * 1000,
    sameSite: "strict"
  });
}

// Được xem/hủy đơn khi đơn nằm trong danh sách trên thiết bị hoặc vừa được tra cứu đúng
export const canAccessGuestOrder = (req: Request, orderId: string): boolean => {
  if(!mongoose.isValidObjectId(orderId)) return false;
  return getDeviceOrderIds(req).includes(orderId) || getLookupOrderId(req) === orderId;
}
