import { Request, Response } from "express";
import path from "path";
import { resolveInsideMedia } from "../helpers/path.helper";

export const getFile = (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  const subPath = req.params.subPath;
  const type = req.query.type;
  // Đường dẫn đến file
  const mediaPath = resolveInsideMedia(...(Array.isArray(subPath) ? subPath : [subPath]));
  if(!mediaPath) {
    res.status(400).send("Đường dẫn không hợp lệ!");
    return;
  }

  if (type == "download") {
    res.download(mediaPath);
  } else {
    res.sendFile(mediaPath);
  }
};
