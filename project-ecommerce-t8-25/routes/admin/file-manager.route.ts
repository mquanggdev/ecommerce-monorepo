
import { Router } from "express";
import * as fileManagerController from "../../controllers/admin/file-manager.controller";
import multer from "multer";
import { checkPermission } from "../../middlewares/admin/auth.middleware";

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


router.get('/',checkPermission("file-manager"), fileManagerController.fileManager);

router.post('/upload',checkPermission("file-manager"), upload.array('files'), fileManagerController.uploadPost);

router.patch(
  '/change-file-name/:id', 
  upload.none(),
  checkPermission("file-manager"), 
  fileManagerController.changeFileNamePatch
);

router.delete('/delete-file/:id',checkPermission("file-manager"), fileManagerController.deleteFileDel);

router.post(
  '/folder/create', 
  upload.none(),
  checkPermission("file-manager"), 
  fileManagerController.createFolderPost
);


router.delete('/folder/delete',checkPermission("file-manager"), fileManagerController.deleteFolderDel);


router.get('/iframe',checkPermission("file-manager"), fileManagerController.iframe);


export default router;