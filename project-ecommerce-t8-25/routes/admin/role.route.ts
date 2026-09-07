
import { Router } from "express";
import * as roleController from "../../controllers/admin/role.controller";
import multer from "multer";
import * as roleValidate from "../../validates/admin/role.validate";
import { checkPermission } from "../../middlewares/admin/auth.middleware";

const router = Router();

const upload = multer();

router.get('/create',checkPermission("role-create"), roleController.create);

router.post(
  '/create', 
  upload.none(),
  checkPermission("role-create"), 
  roleValidate.createPost,
  roleController.createPost
);

router.get('/list',checkPermission("role-list"), roleController.list);
router.get('/edit/:id',checkPermission("role-edit"), roleController.edit);

router.patch(
  '/edit/:id', 
  upload.none(),
  checkPermission("role-edit"), 
  roleValidate.createPost,
  roleController.editPatch
);

router.patch('/delete/:id',checkPermission("role-delete"), roleController.deletePatch);

export default router;