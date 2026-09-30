
import { Router } from "express";
import * as accountUserController from "../../controllers/admin/account-user.controller";

import { checkPermission } from "../../middlewares/admin/auth.middleware";
const router = Router();

router.get('/list', checkPermission("account-user-list"), accountUserController.list);

export default router;