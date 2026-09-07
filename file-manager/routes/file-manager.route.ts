
import { Router } from "express";
import * as fileManagerController from "../controllers/file-manager.controller";
import multer from "multer";

const router = Router();

// const upload = multer();

// Dùng memoryStorage để giữ file trong buffer
const storage = multer.memoryStorage();

// Fix lỗi font tiếng Việt trong tên file (multer mặc định Latin1)
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Ép originalname về UTF-8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, true);
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