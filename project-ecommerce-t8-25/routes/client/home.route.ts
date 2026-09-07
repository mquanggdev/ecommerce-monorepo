import { Router } from "express";
import * as homeController from "../../controllers/client/home.controller";

const router = Router();

router.get('/', homeController.home);
router.get('/sitemap.xml', homeController.sitemap);
router.get('/robots.txt', homeController.robots); // HƯờng dẫn cho các web được tìm kiếm dữ liệu
export default router;
