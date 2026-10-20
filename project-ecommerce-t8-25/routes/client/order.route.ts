
import { Router } from "express";
import * as orderController from "../../controllers/client/order.controller";
import * as orderValidate from "../../validates/client/order.validate";
import * as authMiddleware from "../../middlewares/client/auth.middleware";
import { guestOrderLimiter, orderLookupLimiter } from "../../middlewares/rate-limit.middleware";
import * as dashboardValidate from "../../validates/client/dashboard.validate";

const router = Router();

router.post('/create', authMiddleware.verifyToken, guestOrderLimiter, orderValidate.createPost, orderController.createPost);
router.get('/success', orderController.success);

router.get('/payment-zalopay', orderController.paymentZaloPay);

router.post('/payment-zalopay-result', orderController.paymentZalopayResult);

router.get('/payment-vnpay', orderController.paymentVNPay);

router.get('/payment-vnpay-result', orderController.paymentVNPayResult);

router.get('/export-pdf', orderController.exportPdf);

// Tra cứu và hủy đơn bằng mã đơn + số điện thoại (khách vãng lai)
router.get('/lookup', orderController.lookup);
router.post('/lookup', orderLookupLimiter, orderValidate.lookupPost, orderController.lookupPost);
router.get('/lookup/detail', orderController.lookupDetail);
router.patch('/lookup/cancel', dashboardValidate.orderCancelPatch, orderController.lookupCancelPatch);



export default router;