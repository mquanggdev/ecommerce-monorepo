
import { Router } from "express";
import * as authController from "../../controllers/client/auth.controller";
import * as authValidate from "../../validates/client/auth.validate";
import passport from "passport";
import * as authMiddleware from "../../middlewares/client/auth.middleware";
import { forgotPasswordLimiter, loginLimiter, otpLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

router.get('/register', authController.register);

router.post(
  '/register', 
  authValidate.registerPost, 
  authController.registerPost
);

router.get('/login', authController.login);

router.post(
  '/login', 
  loginLimiter, 
  authValidate.loginPost, 
  authController.loginPost
);

router.get('/logout', authController.logout);

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/login',
}), authController.callbackGoogle);


router.get('/facebook', passport.authenticate('facebook', {
  scope: ['email'],
}));

router.get('/facebook/callback', passport.authenticate('facebook', {
  failureRedirect: '/auth/login',
}), authController.callbackFacebook);

router.get('/forgot-password', authController.forgotPassword);

router.post(
  '/forgot-password', 
  forgotPasswordLimiter, 
  authValidate.forgotPasswordPost, 
  authController.forgotPasswordPost
);

router.get('/otp-password', authController.otpPassword);

router.post(
  '/otp-password', 
  otpLimiter, 
  authValidate.otpPasswordPost, 
  authController.otpPasswordPost
);

router.get('/reset-password', authController.resetPassword);

router.post(
  '/reset-password', 
  authMiddleware.verifyToken,
  authMiddleware.blockDemoAccount,
  authValidate.resetPasswordPost, 
  authController.resetPasswordPost
);
export default router;