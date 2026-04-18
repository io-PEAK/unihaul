import express from "express";
import {
  getMe,
  updateProfile,
  completeProfile,
  deleteAccount,
  createPassword,
  searchUsers,
  getUserProfile,
  searchUsersByItem,
  getSellerVerificationStatus,
  submitSellerVerification,
} from "../controllers/usersController.js";
import {
  sendOtp,
  changeEmail,
  changePassword,
  resetPasswordWithOtp,
} from "../controllers/otpController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Search (no auth — must be before /:id routes!)
router.get("/search", searchUsers);
router.get("/search-by-item", searchUsersByItem);

// Profile (protected)
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.put("/complete-profile", authMiddleware, completeProfile);
router.delete("/account", authMiddleware, deleteAccount);

// OTP / email / password
router.post("/send-otp", authMiddleware, sendOtp);
router.post("/change-email", authMiddleware, changeEmail);
router.post("/change-password", authMiddleware, changePassword);
router.post("/reset-password", authMiddleware, resetPasswordWithOtp);
router.post("/create-password", authMiddleware, createPassword);
router.get(
  "/seller-verification/status",
  authMiddleware,
  getSellerVerificationStatus,
);
router.post("/seller-verification", authMiddleware, submitSellerVerification);

// Public profile (must be last — catches /:id)
router.get("/:id/profile", getUserProfile);

export default router;
