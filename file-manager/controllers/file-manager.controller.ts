import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { isSafeName, mediaRoot, resolveInsideMedia, stripMediaPrefix } from "../helpers/path.helper";

export const upload = (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    // File bị chặn bởi fileFilter sẽ không có mặt trong req.files
    if(!files || files.length === 0) {
      res.json({
        code: "error",
        message: "Không có file hợp lệ để upload!"
      });
      return;
    }

    const saveLinks: {
      folder: string,
      filename: string,
      mimetype: string,
      size: number
    }[] = [];

    // Thêm folderPath (phải nằm trong thư mục media)
    const folderPath = req.body.folderPath;
    const mediaDir = resolveInsideMedia(folderPath || "");
    if(!mediaDir) {
      res.json({
        code: "error",
        message: "Đường dẫn không hợp lệ!"
      })
      return;
    }
    
    // Kiểm tra và tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    
    files.forEach(file => {
      // Chỉ lấy phần tên file, bỏ mọi thành phần thư mục do client gửi kèm
      const filename = `${Date.now()}-${path.basename(file.originalname.replace(/\\/g, "/"))}`;
      const savePath = path.join(mediaDir, filename);
      fs.writeFileSync(savePath, file.buffer);
      saveLinks.push({
        folder: "/media" + (folderPath ? `/${folderPath}` : ""),
        filename: filename,
        mimetype: file.mimetype,
        size: file.size
      });
    })

    res.json({
      code: "success",
      message: "Upload thành công!",
      saveLinks: saveLinks
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi upload!"
    });
  }
}

export const changeFileNamePatch = (req: Request, res: Response) => {
  try {
    const { folder, oldFileName, newFileName } = req.body;

    if(!folder || !oldFileName || !newFileName) {
      res.json({
        code: "error",
        message: "Thiếu thông tin cần thiết!"
      })
      return;
    }

    // Tạo đường dẫn đến file (thư mục phải nằm trong media, tên file không được chứa dấu phân cách)
    const relativeFolder = stripMediaPrefix(folder);
    const oldPath = relativeFolder !== null && isSafeName(oldFileName) ? resolveInsideMedia(relativeFolder, oldFileName) : null;
    const newPath = relativeFolder !== null && isSafeName(newFileName) ? resolveInsideMedia(relativeFolder, newFileName) : null;
    if(!oldPath || !newPath) {
      res.json({
        code: "error",
        message: "Đường dẫn không hợp lệ!"
      })
      return;
    }

    if(!fs.existsSync(oldPath)) {
      res.json({
        code: "error",
        message: "File không tồn tại!"
      })
      return;
    }

    if(fs.existsSync(newPath)) {
      res.json({
        code: "error",
        message: "Tên file mới đã tồn tại!"
      })
      return;
    }

    // Đổi tên file
    fs.renameSync(oldPath, newPath);

    res.json({
      code: "success",
      message: "Thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi đổi tên file!"
    })
  }
}

export const deleteFilePatch = (req: Request, res: Response) => {
  try {
    const { folder, fileName } = req.body;

    if(!folder || !fileName) {
      res.json({
        code: "error",
        message: "Thiếu thông tin cần thiết!"
      })
      return;
    }

    // Tạo đường dẫn đến file (thư mục phải nằm trong media, tên file không được chứa dấu phân cách)
    const relativeFolder = stripMediaPrefix(folder);
    const filePath = relativeFolder !== null && isSafeName(fileName) ? resolveInsideMedia(relativeFolder, fileName) : null;
    if(!filePath) {
      res.json({
        code: "error",
        message: "Đường dẫn không hợp lệ!"
      })
      return;
    }

    if(!fs.existsSync(filePath)) {
      res.json({
        code: "error",
        message: "File không tồn tại!"
      })
      return;
    }

    // Xóa file
    fs.unlinkSync(filePath);

    res.json({
      code: "success",
      message: "Thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi xóa file!"
    })
  }
}


export const createFolderPost = (req: Request, res: Response) => {
  try {
    const { folderName,folderPath  } = req.body;

    if(!isSafeName(folderName)) {
      res.json({
        code: "error",
        message: "Tên thư mục không hợp lệ!"
      })
      return;
    }

    const targetPath = resolveInsideMedia(folderPath || "", folderName);
    if(!targetPath) {
      res.json({
        code: "error",
        message: "Đường dẫn không hợp lệ!"
      })
      return;
    }

    if(fs.existsSync(targetPath)) {
      res.json({
        code: "error",
        message: "Folder đã tồn tại!"
      })
      return;
    }

    // Tạo folder
    fs.mkdirSync(targetPath);

    res.json({
      code: "success",
      message: "Thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi tạo folder!"
    })
  }
}

export const listFolder = (req: Request, res: Response) => {
  try {
    // const mediaPath = path.join(__dirname, "..", "media");
    
    const folderPath = req.query.folderPath;
    const mediaPath = resolveInsideMedia(typeof folderPath === "string" && folderPath !== "undefined" ? folderPath : "");
    if(!mediaPath) {
      res.json({
        code: "error",
        message: "Đường dẫn không hợp lệ!"
      })
      return;
    }
    // Đọc danh sách file/thư mục trong media
    const items = fs.readdirSync(mediaPath);
    
    const folders: {
      name: string,
      createdAt: Date
    }[] = [];

    items.forEach(item => {
      const itemPath = path.join(mediaPath, item);
      const itemInfo = fs.statSync(itemPath);
      if(itemInfo.isDirectory()) {
        folders.push({
          name: item,
          createdAt: itemInfo.birthtime
        })
      }
    })

    // Sắp xếp giảm dần theo ngày tạo
    folders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.json({
      code: "success",
      message: "Thành công!",
      folderList: folders
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lấy danh sách folder không thành công!"
    })
  }
}



export const deleteFolderPatch = (req: Request, res: Response) => {
  try {
    const { folderPath } = req.body;

    if(!folderPath) {
      res.json({
        code: "error",
        message: "Thiếu đường dẫn folder!"
      })
      return;
    }

    // Tạo đường dẫn đến folder (phải nằm trong media và không phải chính thư mục media)
    const relativeFolder = stripMediaPrefix(folderPath);
    const folderDir = relativeFolder ? resolveInsideMedia(relativeFolder) : null;
    if(!folderDir || folderDir === mediaRoot) {
      res.json({
        code: "error",
        message: "Không được phép xóa thư mục này!"
      })
      return;
    }

    if(!fs.existsSync(folderDir)) {
      res.json({
        code: "error",
        message: "Folder không tồn tại!"
      })
      return;
    }

    // Xóa folder
    fs.rmSync(folderDir, {
      recursive: true
    });
    // recursive: để xóa các folder và các file con bên trong

    res.json({
      code: "success",
      message: "Thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi xóa folder!"
    })
  }
}
