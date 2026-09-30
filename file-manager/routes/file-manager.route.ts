
import { Router } from "express";
import * as fileManagerController from "../controllers/file-manager.controller";
import multer from "multer";

const router = Router();

// const upload = multer();

// Dùng memoryStorage để giữ file trong buffer
const storage = multer.memoryStorage();

// Fix lỗi font tiếng Việt trong tên file (multer mặc định Latin1)
// Các loại file trình duyệt sẽ chạy như một trang web nếu mở trực tiếp → không cho upload
const blockedExtensions = [".html", ".htm", ".xhtml", ".svg", ".js", ".mjs", ".xml"];

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Tối đa 20MB mỗi file
    files: 10 // Tối đa 10 file mỗi lần upload
  },
  fileFilter: (req, file, cb) => {
    // Ép originalname về UTF-8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const extension = file.originalname.substring(file.originalname.lastIndexOf(".")).toLowerCase();
    cb(null, !blockedExtensions.includes(extension));
  }
});

router.post('/upload', upload.array("files"), fileManagerController.upload);
router.patch(
  '/change-file-name', 
  upload.none(), 
  fileManagerController.changeFileNamePatch
);

router.patch(
  '/delete-file', 
  upload.none(), 
  fileManagerController.deleteFilePatch
);


router.post(
  '/folder/create', 
  upload.none(), 
  fileManagerController.createFolderPost
);

router.get(
  '/folder/list', 
  fileManagerController.listFolder
);


router.patch(
  '/folder/delete', 
  upload.none(), 
  fileManagerController.deleteFolderPatch
);


export default router;