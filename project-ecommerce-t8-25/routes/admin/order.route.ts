
import { Router } from "express";
import * as orderController from "../../controllers/admin/order.controller";

import { checkPermission } from "../../middlewares/admin/auth.middleware";
const router = Router();

router.get('/list', checkPermission("order-list"), orderController.list);

router.get('/edit/:id', checkPermission("order-edit"), orderController.edit);

router.patch('/edit/:id', checkPermission("order-edit"), orderController.editPatch);

router.get('/export/csv', checkPermission("order-export"), orderController.exportCSV);

export default router;