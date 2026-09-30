import { Request, Response } from "express";
import AccountUser from "../../models/account-user.model";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import VerifyOTP from "../../models/verify-otp.model";
import { sendMail } from "../../helpers/mail.helper";

export const register = async (req: Request, res: Response) => {
  res.render("client/pages/register", {
    pageTitle: "Đăng ký tài khoản"
  });
}

export const registerPost = async (req: Request, res: Response) => {
  try {
    const existEmail = await AccountUser.findOne({
      email: req.body.email
    })

    if(existEmail) {
      res.json({
        code: "error",
        message: "Email đã được sử dụng!"
      });
      return;
    }

    const existPhone = await AccountUser.findOne({
      phone: req.body.phone
    })

    if(existPhone) {
      res.json({
        code: "error",
        message: "Số điện thoại đã được sử dụng!"
      });
      return;
    }

    req.body.password = await bcrypt.hash(req.body.password, 10);

    req.body.status = "active";

    req.body.search = slugify(`${req.body.fullName} ${req.body.email} ${req.body.phone}`, {
      replacement: " ",
      lower: true
    });

    const newAccount = new AccountUser(req.body);
    await newAccount.save();

    const tokenUser = jwt.sign(
      {
        id: newAccount.id,
        email: newAccount.email
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "7d"
      }
    );

    res.cookie("tokenUser", tokenUser, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      sameSite: "strict"
    });

    res.json({
      code: "success",
      message: "Đăng ký tài khoản thành công!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    });
  }
}
export const login = async (req: Request, res: Response) => {
  res.render("client/pages/login", {
    pageTitle: "Đăng nhập tài khoản"
  });
}

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;

    const existAccount = await AccountUser.findOne({
      email: email,
      deleted: false
    })

    if(!existAccount) {
      res.json({
        code: "error",
        message: "Tài khoản không tồn tại!"
      });
      return;
    }

    const checkPassword = await bcrypt.compare(password, `${existAccount.password}`);

    if(!checkPassword) {
      res.json({
        code: "error",
        message: "Mật khẩu không đúng!"
      });
      return;
    }

    if(existAccount.status != "active") {
      res.json({
        code: "error",
        message: "Tài khoản không hoạt động!"
      });
      return;
    }

    const tokenUser = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: rememberPassword ? "7d" : "1d"
      }
    );

    res.cookie("tokenUser", tokenUser, {
      httpOnly: true,
      maxAge: rememberPassword ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 ngày, 1 ngày
      sameSite: "strict"
    });

    res.json({
      code: "success",
      message: "Đăng nhập thành công!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    });
  }
}


export const logout = async (req: Request, res: Response) => {
  res.clearCookie("tokenUser");
  res.redirect("/auth/login");
}


export const callbackGoogle = async (req: Request, res: Response) => {
  const user = req.user as any;

  const tokenUser = jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: "1d"
    }
  );

  res.cookie("tokenUser", tokenUser, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    sameSite: "lax"
  });

  res.redirect('/');
}

export const callbackFacebook = async (req: Request, res: Response) => {
  const user = req.user as any;

  const tokenUser = jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: "1d"
    }
  );

  res.cookie("tokenUser", tokenUser, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    sameSite: "lax"
  });

  res.redirect('/');
}


export const forgotPassword = async (req: Request, res: Response) => {
  res.render("client/pages/forgot-password", {
    pageTitle: "Quên mật khẩu"
  });
}

export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Kiểm tra email có tồn tại trong CSDL không
    const existAccount = await AccountUser.findOne({
      email: email,
      deleted: false,
      status: "active"
    })

    if(!existAccount) {
      res.json({
        code: "error",
        message: "Email không tồn tại!"
      });
      return;
    }

    // Tạo mã OTP
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0"); // 6 chữ số, sinh bằng bộ sinh số ngẫu nhiên an toàn

    // Kiểm tra email đã tồn tại trong VerifyOTP chưa
    const existVerifyOTP = await VerifyOTP.findOne({
      email: email,
      type: "otp-password"
    });

    if(existVerifyOTP) {
      res.json({
        code: "error",
        message: "Vui lòng gửi lại yêu cầu sau 5 phút!"
      })
      return;
    }

    // Lưu vào CSDL trong 5 phút
    const newRecord = new VerifyOTP({
      email: email,
      otp: otp,
      type: "otp-password",
      expireAt: Date.now() + 5 * 60 * 1000 // 5 phút
    });
    await newRecord.save();

    // Gửi mail tự động
    const title = `Mã OTP lấy lại mật khẩu`;
    const content = `Mã OTP của bạn là ${otp}. Mã OTP này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã OTP cho bất kỳ ai.`;
    sendMail(email, title, content);

    res.json({
      code: "success",
      message: "Chúng tôi đã gửi mã OTP qua email. Vui lòng kiểm tra email của bạn!"
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

export const otpPassword = async (req: Request, res: Response) => {
  const { email } = req.query;

  res.render("client/pages/otp-password", {
    pageTitle: "Xác thực OTP",
    email: email
  });
}

export const otpPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const existAccount = await AccountUser.findOne({
      email: email,
      deleted: false,
      status: "active"
    })

    if(!existAccount) {
      res.json({
        code: "error",
        message: "Email không tồn tại!"
      })
      return;
    }

    // Mỗi lần nhập tính là một lần thử. Quá 5 lần thì mã bị khóa cho tới khi hết hạn.
    // Tăng bộ đếm bằng một lệnh update có điều kiện để nhiều request cùng lúc không vượt được giới hạn.
    const verifyOTP = await VerifyOTP.findOneAndUpdate({
      email: email,
      type: "otp-password",
      attempts: { $lt: 5 }
    }, {
      $inc: { attempts: 1 }
    });

    if(!verifyOTP) {
      res.json({
        code: "error",
        message: "Mã OTP đã hết hạn hoặc bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới!"
      })
      return;
    }

    if(verifyOTP.otp !== `${otp}`) {
      res.json({
        code: "error",
        message: "Mã OTP không đúng!"
      })
      return;
    }

    // Mã chỉ dùng được một lần
    await VerifyOTP.deleteOne({
      _id: verifyOTP.id
    });

    const tokenUser = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "1d"
      }
    );

    res.cookie("tokenUser", tokenUser, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      sameSite: "strict"
    });

    // Token ngắn hạn chứng minh người dùng vừa xác thực OTP, chỉ dùng để đặt lại mật khẩu
    const tokenResetPassword = jwt.sign(
      {
        id: existAccount.id,
        purpose: "reset-password"
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "10m"
      }
    );

    res.cookie("tokenResetPassword", tokenResetPassword, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 phút
      sameSite: "strict"
    });

    res.json({
      code: "success",
      message: "Xác thực mã OTP thành công. Vui lòng đổi mật khẩu mới!"
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}


export const resetPassword = async (req: Request, res: Response) => {
  res.render("client/pages/reset-password", {
    pageTitle: "Đổi mật khẩu mới"
  });
}

export const resetPasswordPost = async (req: Request, res: Response) => {
  try {
    const { password, currentPassword } = req.body;
    const userId = res.locals.accountUser.id;

    // Chỉ cho đổi mật khẩu khi: vừa xác thực OTP (có tokenResetPassword hợp lệ) HOẶC nhập đúng mật khẩu hiện tại
    let verifiedByOTP = false;
    try {
      const decoded = jwt.verify(req.cookies.tokenResetPassword, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
      verifiedByOTP = decoded.purpose === "reset-password" && decoded.id === userId;
    } catch (error) {
      verifiedByOTP = false;
    }

    if(!verifiedByOTP) {
      const account = await AccountUser.findOne({
        _id: userId,
        deleted: false
      });

      if(!account || !account.password) {
        res.json({
          code: "error",
          message: "Tài khoản chưa có mật khẩu. Vui lòng dùng chức năng Quên mật khẩu để đặt mật khẩu!"
        });
        return;
      }

      const isMatch = await bcrypt.compare(`${currentPassword || ""}`, `${account.password}`);
      if(!isMatch) {
        res.json({
          code: "error",
          message: "Mật khẩu hiện tại không đúng!"
        });
        return;
      }
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await AccountUser.updateOne({
      _id: userId
    }, {
      password: hashPassword
    })

    // Token đặt lại mật khẩu chỉ dùng được một lần
    res.clearCookie("tokenResetPassword");

    res.json({
      code: "success",
      message: "Đã đổi mật khẩu thành công!"
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}