import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import {
  uploadItemImage,
  deleteItemImage,
  uploadAvatar,
  uploadMessageImage,
  uploadMessageVideo,
  uploadVerificationId,
  uploadVerificationVideo,
} from "../controllers/uploadController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG and WebP images are allowed."));
  },
});

const verificationDocUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP or PDF files are allowed."));
  },
});

const verificationVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only MP4, WEBM or MOV videos are allowed."));
  },
});

const messageVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only MP4, WEBM or MOV videos are allowed."));
  },
});

// POST /upload/item-image  — upload one image, returns { url, publicId }
router.post("/item-image", protect, upload.single("image"), uploadItemImage);

// DELETE /upload/item-image — delete orphaned image by publicId
router.delete("/item-image", protect, deleteItemImage);

// POST /upload/avatar
router.post("/avatar", protect, upload.single("image"), uploadAvatar);

// POST /upload/message-image
router.post(
  "/message-image",
  protect,
  upload.single("image"),
  uploadMessageImage,
);

router.post(
  "/message-video",
  protect,
  messageVideoUpload.single("video"),
  uploadMessageVideo,
);

router.post(
  "/verification-id",
  protect,
  verificationDocUpload.single("file"),
  uploadVerificationId,
);

router.post(
  "/verification-video",
  protect,
  verificationVideoUpload.single("file"),
  uploadVerificationVideo,
);

router.delete("/avatar", async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId)
      return res.status(400).json({ error: "publicId is required" });
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Multer error handler — catches LIMIT_FILE_SIZE and invalid type errors
// Must be AFTER all routes and have exactly 4 params to work as Express error middleware
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ error: "File too large. Maximum size is 5MB." });
  }
  if (err.message?.includes("Only JPEG")) {
    return res.status(400).json({ error: err.message });
  }
  if (
    err.message?.includes("Only MP4") ||
    err.message?.includes("Only JPEG, PNG, WebP or PDF")
  ) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
