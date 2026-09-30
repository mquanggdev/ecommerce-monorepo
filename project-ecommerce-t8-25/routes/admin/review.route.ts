
import { Router } from "express";
import * as reviewController from "../../controllers/admin/review.controller";

import { checkPermission } from "../../middlewares/admin/auth.middleware";
const router = Router();

router.get('/list', checkPermission("review-list"), reviewController.list);

router.patch('/change-status/:id/:status', checkPermission("review-edit"), reviewController.changeStatusPatch);

export default router;