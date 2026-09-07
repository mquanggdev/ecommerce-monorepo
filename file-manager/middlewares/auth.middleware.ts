import { NextFunction, Request, Response } from "express";

export const verifySecret = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if(!authHeader || authHeader !== `Bearer ${process.env.FILE_MANAGER_SECRET}`) {
      res.json({
        code: "error",
        message: "Không được phép truy cập!"
      });
      return;
    }

    next();
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Không được phép truy cập!"
    });
  }
}
