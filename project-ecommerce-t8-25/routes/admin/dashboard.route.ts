
import { Router } from "express";
import * as dashboardController from "../../controllers/admin/dashboard.controller";
import { checkPermission } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.get('/',checkPermission("dashboard"), dashboardController.dashboard);
router.get('/revenue-by-time', checkPermission("dashboard"), dashboardController.revenueByTime);
router.get('/order-statistic', checkPermission("dashboard"), dashboardController.orderStatistic);
router.get('/top-selling-products', checkPermission("dashboard"), dashboardController.topSellingProducts);
router.get('/customer-statistic', checkPermission("dashboard"), dashboardController.customerStatistic);

export default router;