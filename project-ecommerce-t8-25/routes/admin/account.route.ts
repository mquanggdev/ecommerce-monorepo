
import { Router } from "express";
import * as accountController from "../../controllers/admin/account.controller";
import multer from "multer";
import * as accountValidate from "../../validates/admin/account.validate";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";
import { adminLoginLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

const upload = multer();

router.get('/login', accountController.login);

router.post(
  '/login', 
  adminLoginLimiter, 
  upload.none(),
  accountValidate.loginPost,
  accountController.loginPost
);

router.get('/logout',authMiddleware.verifyToken,  accountController.logout);

export default router;