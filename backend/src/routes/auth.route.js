import express from "express";
import { checkAuth, login, logout, signup, updateProfile, updateUserAvatar } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);


router.patch("/upload-avatar",
    protectRoute,
    upload.single("avatar"),
    updateUserAvatar
)

router.get("/check", protectRoute, checkAuth);

export default router;