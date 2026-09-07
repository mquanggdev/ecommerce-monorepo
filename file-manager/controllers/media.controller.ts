import { Request, Response } from "express";
import path from "path";

export const getFile = (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  const subPath = req.params.subPath;
  const type = req.query.type;
  // Đường dẫn đến file
  const mediaPath = path.join(__dirname, "../media", ...subPath);

  if (type == "download") {
    res.download(mediaPath);
  } else {
    res.sendFile(mediaPath);
  }
};
