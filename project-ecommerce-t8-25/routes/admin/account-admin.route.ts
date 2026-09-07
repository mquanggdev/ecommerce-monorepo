
import { Router } from "express";
import * as accountAdminController from "../../controllers/admin/account-admin.controller";
import multer from "multer";
import { checkPermission } from "../../middlewares/admin/auth.middleware";
import * as accountAdminValidate from "../../validates/admin/account-admin.validate";

const router = Router();

const upload = multer();

router.get('/create',checkPermission("account-admin-create"), accountAdminController.create);

router.post(
  '/create', 
  upload.none(),
  checkPermission("account-admin-create"),
  accountAdminValidate.createPost,
  accountAdminController.createPost
);

router.get('/list',checkPermission("account-admin-list"), accountAdminController.list);

router.get('/edit/:id',checkPermission("account-admin-edit"), accountAdminController.edit);

router.patch(
  '/edit/:id', 
  upload.none(),
  checkPermission("account-admin-edit"), 
  accountAdminValidate.editPatch,
  accountAdminController.editPatch
);

router.patch('/delete/:id',checkPermission("account-admin-edit"), accountAdminController.deletePatch);

router.get('/change-password/:id',checkPermission("account-admin-change-password"), accountAdminController.changePassword);

router.patch(
  '/change-password/:id', 
  upload.none(),
  checkPermission("account-admin-change-password"), 
  accountAdminValidate.changePasswordPatch,
  accountAdminController.changePasswordPatch
);



export default router;