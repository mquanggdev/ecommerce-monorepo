import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AccountUser from "../../models/account-user.model";
import UserAddress from "../../models/user-address.model";
import { demoUserEmail } from "../../configs/variable.config";

const paths = [
  "/.well-known",
  "/client"
];


export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    if(paths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const token = req.cookies.tokenUser;
    
    if(token) {
      const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as JwtPayload;
      
      const existAccount = await AccountUser.findOne({
        _id: decoded.id,
        email: decoded.email,
        deleted: false,
        status: "active"
      });

      if(existAccount) {
        const addressList = await UserAddress
          .find({
            userId: existAccount.id
          })
          .sort({
            createdAt: "desc"
          })

        res.locals.accountUser = {
          id: existAccount.id,
          fullName: existAccount.fullName,
          email: existAccount.email,
          phone: existAccount.phone,
          avatar: existAccount.avatar,
          addressList: addressList,
          totalPoint: existAccount.totalPoint,
          usedPoint: existAccount.usedPoint
        };
      }
    }

    next();
  } catch (error) {
    console.log(error);
    next();
  }
}


export const loggedIn = async (req: Request, res: Response, next: NextFunction) => {
  if(!res.locals.accountUser) {
    if(req.method == "GET") {
      res.redirect("/auth/login");
    } else {
      res.json({
        code: "error",
        message: "Vui lòng đăng nhập!"
      })
    }
    return;
  }
  next();
}

// Mật khẩu tài khoản dùng thử được công khai, chặn các thao tác làm hỏng tài khoản cho người xem sau
export const blockDemoAccount = (req: Request, res: Response, next: NextFunction) => {
  if(res.locals.accountUser?.email === demoUserEmail) {
    res.json({
      code: "error",
      message: "Tài khoản dùng thử không được đổi mật khẩu, thông tin cá nhân hay ảnh đại diện!"
    });
    return;
  }
  next();
}
