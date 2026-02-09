import express from "express";
import { checkAuth, login, logout, signup, updateProfile, updateUserAvatar, verifyOtp, resendOtp } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/resend-otp", authLimiter, resendOtp);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);


router.patch("/upload-avatar",
    protectRoute,
    upload.single("avatar"),
    updateUserAvatar
)

router.get("/check", protectRoute, checkAuth);

export default router;