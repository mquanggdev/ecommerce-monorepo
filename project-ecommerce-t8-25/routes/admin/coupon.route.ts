import { Router } from "express";
import * as couponController from "../../controllers/admin/coupon.controller";
import multer from "multer";
import * as couponValidate from "../../validates/admin/coupon.validate";

import { checkPermission } from "../../middlewares/admin/auth.middleware";
const router = Router();

const upload = multer();

router.get('/create', checkPermission("coupon-create"), couponController.create);

router.post(
  '/create', 
  checkPermission("coupon-create"), 
  upload.none(), 
  couponValidate.createPost,
  couponController.createPost
);
router.get('/list', checkPermission("coupon-list"), couponController.list);

router.get('/edit/:id', checkPermission("coupon-edit"), couponController.edit);

router.patch(
  '/edit/:id', 
  checkPermission("coupon-edit"), 
  upload.none(), 
  couponValidate.createPost,
  couponController.editPatch
);

router.patch(
  '/delete/:id', 
  checkPermission("coupon-delete"), 
  couponController.deletePatch
);


export default router;
