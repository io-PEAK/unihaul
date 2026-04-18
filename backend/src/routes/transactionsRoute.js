import express from "express";
import {
  getCheckoutQuote,
  getMyTransactions,
  deleteTransaction,
  initializeCheckout,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  scheduleDeliveryHandoff,
  confirmTransactionPin,
  getTransactionById,
} from "../controllers/transactionsController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/quote", authMiddleware, getCheckoutQuote);
router.post("/checkout", authMiddleware, initializeCheckout);
router.post("/razorpay/verify", authMiddleware, verifyRazorpayPayment);
router.post("/razorpay/webhook", handleRazorpayWebhook);
router.post("/:id/handoff-schedule", authMiddleware, scheduleDeliveryHandoff);
router.get("/", authMiddleware, getMyTransactions);
router.get("/:id", authMiddleware, getTransactionById);
router.post("/:id/confirm-pin", authMiddleware, confirmTransactionPin);
router.delete("/:id", authMiddleware, deleteTransaction);

export default router;
