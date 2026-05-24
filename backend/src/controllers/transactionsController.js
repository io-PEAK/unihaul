import prisma from "../lib/prisma.js";
import { io } from "../../server.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import QRCode from "qrcode";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  resolvePaymentMethod,
  getSafetyTier,
} from "../lib/safetyTiers.js";

const razorpayClient =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;
const hasRazorpayConfigured = Boolean(razorpayClient);

const getUserId = (req) => parseInt(req.user?.id ?? req.user?.userId);

const hashPin = (pin) =>
  crypto.createHash("sha256").update(String(pin)).digest("hex");

const generatePin = () => String(crypto.randomInt(100000, 1000000));

const DELIVERY_OTP_DEFAULT_WINDOW_HOURS = 24;
const DELIVERY_OTP_MIN_WINDOW_HOURS = 1;
const DELIVERY_OTP_MAX_WINDOW_HOURS = 168;

const buildUpiIntent = ({ upiId, amount, txnId, itemTitle }) => {
  const normalizedUpiId = String(upiId || "")
    .trim()
    .replace(/\s+/g, "");
  if (!normalizedUpiId) return null;

  const safeTitle = String(itemTitle || "Purchase")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .slice(0, 40);

  const params = new URLSearchParams({
    pa: normalizedUpiId,
    pn: "UniHaul",
    am: Number(amount).toFixed(2),
    cu: "INR",
    tr: `SS${txnId}`,
    tn: safeTitle ? `Txn ${txnId} ${safeTitle}` : `Txn ${txnId}`,
  });

  return `upi://pay?${params.toString()}`;
};

const generateUpiQrCode = async (upiIntent) => {
  if (!upiIntent) return null;
  return QRCode.toDataURL(upiIntent, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
};

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function getAvailableMethods(tier, razorpayEnabled = true) {
  if (tier.allowRazorpay && razorpayEnabled) {
    return [PAYMENT_METHODS.UPI_DIRECT, PAYMENT_METHODS.RAZORPAY];
  }
  return [PAYMENT_METHODS.UPI_DIRECT];
}

function buildCheckoutQuote({
  price,
  requestedMethod,
  razorpayEnabled = true,
}) {
  const subtotal = round2(price);
  const { tier, method: resolvedMethod } = resolvePaymentMethod({
    price: subtotal,
    requestedMethod,
  });

  const availableMethods = getAvailableMethods(tier, razorpayEnabled);
  const method = availableMethods.includes(resolvedMethod)
    ? resolvedMethod
    : availableMethods[0] || PAYMENT_METHODS.UPI_DIRECT;

  const platformFee = round2(subtotal * 0.02);
  const paymentGatewayFee =
    method === PAYMENT_METHODS.RAZORPAY ? round2(subtotal * 0.015) : 0;
  const gstOnFees = round2((platformFee + paymentGatewayFee) * 0.18);
  const totalPayable = round2(
    subtotal + platformFee + paymentGatewayFee + gstOnFees,
  );

  return {
    tier,
    method,
    availableMethods,
    pricing: {
      subtotal,
      platformFee,
      paymentGatewayFee,
      gstOnFees,
      totalPayable,
      currency: "INR",
    },
  };
}

const CHECKOUT_SESSION_STATUS = {
  INITIALIZED: "initialized",
  PAYMENT_PENDING: "payment_pending",
  PAID: "paid",
  COMPLETED: "completed",
  FAILED: "failed",
  EXPIRED: "expired",
};

const ACTIVE_SESSION_STATUSES = [
  CHECKOUT_SESSION_STATUS.INITIALIZED,
  CHECKOUT_SESSION_STATUS.PAYMENT_PENDING,
  CHECKOUT_SESSION_STATUS.PAID,
];

function buildSessionPayloadFromQuote({ quote, method }) {
  return {
    paymentMethod: method,
    subtotal: quote.pricing.subtotal,
    platformFee: quote.pricing.platformFee,
    paymentGatewayFee: quote.pricing.paymentGatewayFee,
    gstOnFees: quote.pricing.gstOnFees,
    totalPayable: quote.pricing.totalPayable,
    currency: quote.pricing.currency,
  };
}

function serializeSessionQuote({ item, quote, session }) {
  return {
    item: {
      id: item.id,
      title: item.title,
      price: item.price,
    },
    safetyTier: quote.tier.name,
    paymentMethod: quote.method,
    availableMethods: quote.availableMethods,
    pricing: quote.pricing,
    checkoutSession: {
      id: session.id,
      idempotencyKey: session.idempotencyKey,
      status: session.status,
      expiresAt: session.expiresAt,
    },
  };
}

const createAndEmitNotification = async ({
  userId,
  itemId,
  itemTitle,
  buyerName = "",
  price = 0,
  type = "sale",
  message = "",
}) => {
  const notification = await prisma.notification.create({
    data: {
      userId: parseInt(userId),
      itemId: itemId ? parseInt(itemId) : null,
      itemTitle: itemTitle || "",
      buyerName: buyerName || "",
      price: Number(price) || 0,
      type,
      message,
      seen: false,
    },
  });

  const onlineUsers = io?._onlineUsers;
  if (!onlineUsers) return notification;

  const sockets = onlineUsers.get(String(userId));
  sockets?.forEach((sid) => {
    io.to(sid).emit("new-sale", {
      notification,
      itemId: itemId ? parseInt(itemId) : null,
      itemTitle: itemTitle || "",
      buyerName: buyerName || "",
      price: Number(price) || 0,
      type,
      message,
    });
  });

  return notification;
};

const restoreItemToBuyerCart = async ({ buyerId, itemId }) => {
  if (!buyerId || !itemId) return;

  const item = await prisma.item.findUnique({
    where: { id: parseInt(itemId) },
    select: { id: true, status: true, quantity: true },
  });

  if (!item || item.status !== "available" || (item.quantity || 0) < 1) return;

  await prisma.cartItem.upsert({
    where: {
      userId_itemId: {
        userId: parseInt(buyerId),
        itemId: parseInt(itemId),
      },
    },
    update: { quantity: 1 },
    create: {
      userId: parseInt(buyerId),
      itemId: parseInt(itemId),
      quantity: 1,
    },
  });
};

const emitCheckoutFailedNotifications = async ({ txn, buyerMessage }) => {
  if (!txn?.buyerId || !txn?.sellerId) return;

  await Promise.all([
    createAndEmitNotification({
      userId: txn.buyerId,
      itemId: txn.itemId,
      itemTitle: txn.itemTitle,
      price: txn.price,
      type: "payment_failed",
      message: buyerMessage || "Payment failed. Item moved back to your cart.",
    }),
    createAndEmitNotification({
      userId: txn.sellerId,
      itemId: txn.itemId,
      itemTitle: txn.itemTitle,
      price: txn.price,
      type: "payment_failed",
      message: "Buyer payment failed. Item is still available.",
    }),
  ]);
};

// POST /transactions/quote — quote checkout totals and available methods
export const getCheckoutQuote = async (req, res) => {
  const buyerId = getUserId(req);
  const { itemId, paymentMethod, idempotencyKey } = req.body;

  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        seller: {
          select: {
            id: true,
            sellerIdVerified: true,
            sellerVideoVerified: true,
            sellerVerificationExpiresAt: true,
          },
        },
      },
    });

    if (!item) return res.status(404).json({ error: "Item not found." });

    const completedTxn = await prisma.transaction.findFirst({
      where: {
        itemId: item.id,
        status: PAYMENT_STATUS.COMPLETED,
      },
      select: { id: true },
    });
    if (completedTxn) {
      return res.status(400).json({ error: "Item has already been sold." });
    }

    if (item.status !== "available") {
      return res.status(400).json({ error: "Item is not available." });
    }
    if (item.sellerId === buyerId) {
      return res.status(400).json({ error: "You cannot buy your own item." });
    }

    const quote = buildCheckoutQuote({
      price: item.price,
      requestedMethod: paymentMethod,
      razorpayEnabled: hasRazorpayConfigured,
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const existingSession = await prisma.checkoutSession.findFirst({
      where: {
        userId: buyerId,
        itemId: item.id,
        status: { in: ACTIVE_SESSION_STATUSES },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    let session;
    if (existingSession) {
      session = await prisma.checkoutSession.update({
        where: { id: existingSession.id },
        data: {
          ...buildSessionPayloadFromQuote({ quote, method: quote.method }),
          status:
            existingSession.status === CHECKOUT_SESSION_STATUS.PAID
              ? CHECKOUT_SESSION_STATUS.PAID
              : CHECKOUT_SESSION_STATUS.INITIALIZED,
          expiresAt,
        },
      });
    } else {
      session = await prisma.checkoutSession.create({
        data: {
          userId: buyerId,
          itemId: item.id,
          idempotencyKey: idempotencyKey || crypto.randomUUID(),
          status: CHECKOUT_SESSION_STATUS.INITIALIZED,
          expiresAt,
          ...buildSessionPayloadFromQuote({ quote, method: quote.method }),
        },
      });
    }

    if (
      quote.tier.requires.idVerification &&
      (!item.seller?.sellerIdVerified ||
        !item.seller?.sellerVerificationExpiresAt ||
        new Date(item.seller.sellerVerificationExpiresAt) < new Date())
    ) {
      return res.status(403).json({
        error: "Seller must complete ID verification for this item price tier.",
      });
    }

    if (quote.method === PAYMENT_METHODS.RAZORPAY && !razorpayClient) {
      return res.status(503).json({
        error: "Razorpay is not configured on the server.",
      });
    }

    return res.json(serializeSessionQuote({ item, quote, session }));
  } catch (err) {
    console.error("[CHECKOUT_QUOTE] ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch checkout quote." });
  }
};

// POST /transactions/checkout — hybrid checkout (UPI direct / Razorpay)
export const initializeCheckout = async (req, res) => {
  const buyerId = getUserId(req);
  const { itemId, paymentMethod, checkoutSessionId, idempotencyKey } = req.body;
  let transaction = null;
  let session = null;

  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            upiId: true,
            sellerIdVerified: true,
            sellerVideoVerified: true,
            sellerVerificationExpiresAt: true,
          },
        },
      },
    });

    if (!item) return res.status(404).json({ error: "Item not found." });

    const completedTxn = await prisma.transaction.findFirst({
      where: {
        itemId: item.id,
        status: PAYMENT_STATUS.COMPLETED,
      },
      select: { id: true },
    });
    if (completedTxn) {
      return res.status(400).json({ error: "Item has already been sold." });
    }

    if (item.status !== "available")
      return res.status(400).json({ error: "Item is not available." });
    if (item.sellerId === buyerId)
      return res.status(400).json({ error: "You cannot buy your own item." });

    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { firstName: true, lastName: true },
    });
    const buyerName =
      `${buyer?.firstName || ""} ${buyer?.lastName || ""}`.trim();

    const quote = buildCheckoutQuote({
      price: item.price,
      requestedMethod: paymentMethod,
      razorpayEnabled: hasRazorpayConfigured,
    });
    const { tier, method } = quote;

    const sessionWhere = checkoutSessionId
      ? { id: parseInt(checkoutSessionId), userId: buyerId, itemId: item.id }
      : idempotencyKey
        ? { idempotencyKey, userId: buyerId, itemId: item.id }
        : null;

    session = sessionWhere
      ? await prisma.checkoutSession.findFirst({ where: sessionWhere })
      : await prisma.checkoutSession.findFirst({
          where: {
            userId: buyerId,
            itemId: item.id,
            status: { in: ACTIVE_SESSION_STATUSES },
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

    if (!session) {
      session = await prisma.checkoutSession.create({
        data: {
          userId: buyerId,
          itemId: item.id,
          idempotencyKey: idempotencyKey || crypto.randomUUID(),
          status: CHECKOUT_SESSION_STATUS.INITIALIZED,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          ...buildSessionPayloadFromQuote({ quote, method }),
        },
      });
    }

    if (session.expiresAt <= new Date()) {
      await prisma.checkoutSession.update({
        where: { id: session.id },
        data: { status: CHECKOUT_SESSION_STATUS.EXPIRED },
      });
      return res.status(409).json({
        error: "Checkout session expired. Please start checkout again.",
      });
    }

    const otherPendingTxn = await prisma.transaction.findFirst({
      where: {
        itemId: item.id,
        status: PAYMENT_STATUS.PENDING,
        buyerId: { not: buyerId },
      },
      orderBy: { createdAt: "desc" },
    });

    if (otherPendingTxn) {
      return res.status(409).json({
        error: "This item is currently in a pending checkout.",
      });
    }

    if (session.transactionId) {
      const existingTxn = await prisma.transaction.findUnique({
        where: { id: session.transactionId },
      });

      if (existingTxn && existingTxn.status === PAYMENT_STATUS.PENDING) {
        const existingQrCodeDataUrl =
          existingTxn.paymentMethod === PAYMENT_METHODS.UPI_DIRECT
            ? await generateUpiQrCode(session.upiIntent)
            : existingTxn.qrPayload;

        if (
          existingQrCodeDataUrl &&
          existingQrCodeDataUrl !== existingTxn.qrPayload
        ) {
          await prisma.transaction.update({
            where: { id: existingTxn.id },
            data: { qrPayload: existingQrCodeDataUrl },
          });
          await prisma.checkoutSession.update({
            where: { id: session.id },
            data: { qrPayload: existingQrCodeDataUrl },
          });
        }

        let existingRazorpayOrder = null;
        if (existingTxn.paymentMethod === PAYMENT_METHODS.RAZORPAY) {
          existingRazorpayOrder = {
            id: existingTxn.razorpayOrderId,
            amount: Math.round(
              (session.totalPayable || existingTxn.price) * 100,
            ),
            currency: session.currency || "INR",
          };
        }

        return res.status(200).json({
          transactionId: existingTxn.id,
          safetyTier: existingTxn.safetyTier,
          paymentMethod: existingTxn.paymentMethod,
          paymentStatus: existingTxn.paymentStatus,
          pricing: {
            subtotal: session.subtotal,
            platformFee: session.platformFee,
            paymentGatewayFee: session.paymentGatewayFee,
            gstOnFees: session.gstOnFees,
            totalPayable: session.totalPayable,
            currency: session.currency,
          },
          qrCodeDataUrl: existingQrCodeDataUrl,
          pinCode: null,
          upiIntent: session.upiIntent || null,
          razorpayOrder: existingRazorpayOrder,
          razorpayKeyId:
            existingTxn.paymentMethod === PAYMENT_METHODS.RAZORPAY
              ? (process.env.RAZORPAY_KEY_ID ?? null)
              : null,
          checkoutSession: {
            id: session.id,
            idempotencyKey: session.idempotencyKey,
            status: session.status,
            expiresAt: session.expiresAt,
          },
        });
      }
    }

    if (
      tier.requires.idVerification &&
      (!item.seller?.sellerIdVerified ||
        !item.seller?.sellerVerificationExpiresAt ||
        new Date(item.seller.sellerVerificationExpiresAt) < new Date())
    ) {
      return res.status(403).json({
        error: "Seller must complete ID verification for this item price tier.",
      });
    }

    if (method === PAYMENT_METHODS.RAZORPAY && !razorpayClient) {
      return res.status(503).json({
        error: "Razorpay is not configured on the server.",
      });
    }

    const pinCode = null;

    const created = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          itemId: item.id,
          buyerId,
          sellerId: item.sellerId,
          status: PAYMENT_STATUS.PENDING,
          paymentMethod: method,
          paymentStatus: PAYMENT_STATUS.PENDING,
          safetyTier: tier.name,
          pinCodeHash: pinCode ? hashPin(pinCode) : null,
          quantity: 1,
          price: quote.pricing.totalPayable,
          itemTitle: item.title,
          itemCategory: item.category,
        },
      }),
      prisma.cartItem.deleteMany({
        where: { userId: buyerId, itemId: item.id },
      }),
    ]);

    transaction = created[0];

    let razorpayOrder = null;
    if (method === PAYMENT_METHODS.RAZORPAY) {
      const createdOrder = await razorpayClient.orders.create({
        amount: Math.round(quote.pricing.totalPayable * 100),
        currency: "INR",
        receipt: `txn_${transaction.id}`,
        notes: {
          transactionId: String(transaction.id),
          itemId: String(item.id),
          buyerId: String(buyerId),
        },
      });

      razorpayOrder = {
        id: createdOrder.id,
        amount: createdOrder.amount,
        currency: createdOrder.currency,
      };

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { razorpayOrderId: createdOrder.id },
      });
    }

    if (method === PAYMENT_METHODS.UPI_DIRECT && !item.seller?.upiId) {
      return res.status(400).json({
        error:
          "Seller has not configured their UPI ID. Direct payment is unavailable for this item.",
      });
    }

    const upiIntent =
      method === PAYMENT_METHODS.UPI_DIRECT
        ? buildUpiIntent({
            upiId: item.seller.upiId,
            amount: quote.pricing.totalPayable,
            txnId: transaction.id,
            itemTitle: item.title,
          })
        : null;

    if (method === PAYMENT_METHODS.UPI_DIRECT && !upiIntent) {
      return res.status(503).json({
        error: "UPI payments are temporarily unavailable. Please try again.",
      });
    }

    const qrCodeDataUrl = await generateUpiQrCode(upiIntent);

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { qrPayload: qrCodeDataUrl },
    });

    await prisma.checkoutSession.update({
      where: { id: session.id },
      data: {
        status: CHECKOUT_SESSION_STATUS.PAYMENT_PENDING,
        paymentMethod: method,
        transactionId: transaction.id,
        displayPin: null,
        upiIntent,
        qrPayload: qrCodeDataUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        ...buildSessionPayloadFromQuote({ quote, method }),
      },
    });

    await createAndEmitNotification({
      userId: item.sellerId,
      itemId: item.id,
      itemTitle: item.title,
      buyerName,
      price: quote.pricing.totalPayable,
      type: "checkout_started",
      message: "Buyer started checkout.",
    });

    res.status(201).json({
      transactionId: transaction.id,
      safetyTier: tier.name,
      paymentMethod: method,
      paymentStatus: PAYMENT_STATUS.PENDING,
      pricing: quote.pricing,
      qrCodeDataUrl,
      pinCode: null,
      upiIntent,
      razorpayOrder,
      razorpayKeyId:
        method === PAYMENT_METHODS.RAZORPAY
          ? (process.env.RAZORPAY_KEY_ID ?? null)
          : null,
      checkoutSession: {
        id: session.id,
        idempotencyKey: session.idempotencyKey,
        status: CHECKOUT_SESSION_STATUS.PAYMENT_PENDING,
      },
    });
  } catch (err) {
    if (session?.id) {
      try {
        await prisma.checkoutSession.update({
          where: { id: session.id },
          data: { status: CHECKOUT_SESSION_STATUS.FAILED },
        });
      } catch (sessionErr) {
        console.error("[CHECKOUT] SESSION FAIL MARK ERROR:", sessionErr);
      }
    }

    if (transaction?.id) {
      try {
        const failedTxn = await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: PAYMENT_STATUS.FAILED,
            paymentStatus: PAYMENT_STATUS.FAILED,
          },
        });

        await restoreItemToBuyerCart({
          buyerId: failedTxn.buyerId,
          itemId: failedTxn.itemId,
        });

        await emitCheckoutFailedNotifications({
          txn: failedTxn,
          buyerMessage: "Checkout failed. Item moved back to your cart.",
        });
      } catch (rollbackErr) {
        console.error("[CHECKOUT] ROLLBACK ERROR:", rollbackErr);
      }
    }
    console.error("[CHECKOUT] ERROR:", err);
    res.status(500).json({ error: "Failed to initialize checkout." });
  }
};

// POST /transactions/razorpay/verify — verify payment signature and mark completed
export const verifyRazorpayPayment = async (req, res) => {
  const userId = getUserId(req);
  const {
    transactionId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !transactionId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res
      .status(400)
      .json({ error: "Missing Razorpay verification fields." });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res
      .status(503)
      .json({ error: "Razorpay key secret not configured." });
  }

  try {
    const txn = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) },
    });
    if (!txn) return res.status(404).json({ error: "Transaction not found." });
    if (txn.buyerId !== userId)
      return res.status(403).json({ error: "Not authorised." });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid Razorpay signature." });
    }

    if (
      txn.status === PAYMENT_STATUS.COMPLETED &&
      txn.paymentStatus === PAYMENT_STATUS.COMPLETED
    ) {
      return res.json({
        message: "Payment already verified.",
        transactionId: txn.id,
        paymentStatus: txn.paymentStatus,
        status: txn.status,
      });
    }

    const updateData = {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: PAYMENT_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      pinCodeHash: null,
      pinAttempts: 0,
      pinConfirmedAt: null,
      paidAt: new Date(),
    };

    const [updated] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: txn.id },
        data: updateData,
      }),
      prisma.checkoutSession.updateMany({
        where: { transactionId: txn.id },
        data: {
          status: CHECKOUT_SESSION_STATUS.COMPLETED,
          displayPin: null,
          upiIntent: null,
        },
      }),
      ...(txn.itemId
        ? [
            prisma.item.update({
              where: { id: txn.itemId },
              data: { status: "sold" },
            }),
            prisma.watchedItem.deleteMany({
              where: { itemId: txn.itemId },
            }),
          ]
        : []),
    ]);

    await Promise.all([
      createAndEmitNotification({
        userId: updated.sellerId,
        itemId: updated.itemId,
        itemTitle: updated.itemTitle,
        buyerName: "",
        price: updated.price,
        type: "payment_received",
        message: "Payment confirmed. Item marked as sold.",
      }),
      createAndEmitNotification({
        userId: updated.buyerId,
        itemId: updated.itemId,
        itemTitle: updated.itemTitle,
        buyerName: "",
        price: updated.price,
        type: "order_confirmed",
        message: "Payment confirmed and order completed.",
      }),
    ]);

    res.json({
      message: "Payment verified.",
      transactionId: updated.id,
      paymentStatus: updated.paymentStatus,
      status: updated.status,
    });
  } catch (err) {
    console.error("[RAZORPAY_VERIFY] ERROR:", err);
    res.status(500).json({ error: "Failed to verify payment." });
  }
};

// POST /transactions/razorpay/webhook — server-to-server Razorpay confirmation
export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res
      .status(400)
      .json({ error: "Missing webhook signature or secret." });
  }

  try {
    const bodyString = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);
    const expected = crypto
      .createHmac("sha256", secret)
      .update(bodyString)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ error: "Invalid webhook signature." });
    }

    const parsedBody = Buffer.isBuffer(req.body)
      ? JSON.parse(bodyString)
      : req.body;

    const event = parsedBody?.event;
    const payload = parsedBody?.payload;

    if (event !== "payment.captured") {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const payment = payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    if (!orderId || !paymentId) {
      return res
        .status(400)
        .json({ error: "Invalid webhook payment payload." });
    }

    const txn = await prisma.transaction.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!txn)
      return res
        .status(404)
        .json({ error: "Transaction not found for order." });

    if (
      txn.status === PAYMENT_STATUS.COMPLETED &&
      txn.paymentStatus === PAYMENT_STATUS.COMPLETED
    ) {
      return res.status(200).json({ ok: true, alreadyProcessed: true });
    }

    const updateData = {
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      status: PAYMENT_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      pinCodeHash: null,
      pinAttempts: 0,
      pinConfirmedAt: null,
      paidAt: new Date(),
    };

    await prisma.$transaction([
      prisma.transaction.update({ where: { id: txn.id }, data: updateData }),
      prisma.checkoutSession.updateMany({
        where: { transactionId: txn.id },
        data: {
          status: CHECKOUT_SESSION_STATUS.COMPLETED,
          displayPin: null,
          upiIntent: null,
        },
      }),
      ...(txn.itemId
        ? [
            prisma.item.update({
              where: { id: txn.itemId },
              data: { status: "sold" },
            }),
            prisma.watchedItem.deleteMany({
              where: { itemId: txn.itemId },
            }),
          ]
        : []),
    ]);

    await Promise.all([
      createAndEmitNotification({
        userId: txn.sellerId,
        itemId: txn.itemId,
        itemTitle: txn.itemTitle,
        buyerName: "",
        price: txn.price,
        type: "payment_received",
        message: "Payment confirmed. Item marked as sold.",
      }),
      createAndEmitNotification({
        userId: txn.buyerId,
        itemId: txn.itemId,
        itemTitle: txn.itemTitle,
        buyerName: "",
        price: txn.price,
        type: "order_confirmed",
        message: "Payment confirmed and order completed.",
      }),
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[RAZORPAY_WEBHOOK] ERROR:", err);
    return res.status(500).json({ error: "Webhook processing failed." });
  }
};

// POST /transactions/:id/handoff-schedule — seller sets delivery schedule and generates handoff OTP
export const scheduleDeliveryHandoff = async (req, res) => {
  const userId = getUserId(req);
  const txnId = parseInt(req.params.id);
  const { scheduledAt, windowHours } = req.body || {};

  if (!scheduledAt) {
    return res.status(400).json({ error: "Delivery date/time is required." });
  }

  const scheduleDate = new Date(scheduledAt);
  if (Number.isNaN(scheduleDate.getTime())) {
    return res.status(400).json({ error: "Invalid delivery date/time." });
  }
  if (scheduleDate <= new Date()) {
    return res
      .status(400)
      .json({ error: "Delivery date/time must be in the future." });
  }

  const parsedWindow = Number(windowHours);
  const otpWindowHours = Number.isFinite(parsedWindow)
    ? Math.min(
        DELIVERY_OTP_MAX_WINDOW_HOURS,
        Math.max(DELIVERY_OTP_MIN_WINDOW_HOURS, Math.round(parsedWindow)),
      )
    : DELIVERY_OTP_DEFAULT_WINDOW_HOURS;

  const otpExpiry = new Date(
    scheduleDate.getTime() + otpWindowHours * 60 * 60 * 1000,
  );

  try {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return res.status(404).json({ error: "Transaction not found." });
    if (txn.sellerId !== userId) {
      return res
        .status(403)
        .json({ error: "Only seller can set delivery schedule." });
    }

    if (
      txn.status !== PAYMENT_STATUS.COMPLETED ||
      txn.paymentStatus !== PAYMENT_STATUS.COMPLETED
    ) {
      return res.status(409).json({
        error: "Delivery OTP can only be generated after payment confirmation.",
      });
    }

    const session = await prisma.checkoutSession.findFirst({
      where: { transactionId: txn.id },
    });

    if (!session) {
      return res.status(400).json({
        error: "Checkout session not found for this transaction.",
      });
    }

    const otp = generatePin();

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: txn.id },
        data: {
          pinCodeHash: hashPin(otp),
          pinAttempts: 0,
          pinConfirmedAt: null,
        },
      }),
      prisma.checkoutSession.update({
        where: { id: session.id },
        data: {
          displayPin: otp,
          upiIntent: scheduleDate.toISOString(),
          expiresAt: otpExpiry,
        },
      }),
    ]);

    await createAndEmitNotification({
      userId: txn.buyerId,
      itemId: txn.itemId,
      itemTitle: txn.itemTitle,
      price: txn.price,
      type: "handoff_otp_ready",
      message: `Delivery OTP generated for ${scheduleDate.toLocaleString("en-IN")}.`,
    });

    return res.json({
      message: "Delivery OTP generated.",
      deliveryScheduledAt: scheduleDate.toISOString(),
      deliveryOtpExpiresAt: otpExpiry.toISOString(),
      otpWindowHours,
    });
  } catch (err) {
    console.error("[DELIVERY_OTP_SCHEDULE] ERROR:", err);
    return res.status(500).json({ error: "Failed to schedule delivery OTP." });
  }
};

// POST /transactions/:id/confirm-pin — seller confirms delivery handoff OTP
export const confirmTransactionPin = async (req, res) => {
  const userId = getUserId(req);
  const txnId = parseInt(req.params.id);
  const { pin } = req.body;

  if (!pin) return res.status(400).json({ error: "OTP is required." });

  try {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return res.status(404).json({ error: "Transaction not found." });
    if (txn.sellerId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the seller can confirm this OTP." });
    }

    if (txn.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
      return res.status(409).json({
        error: "Payment is not confirmed yet for this transaction.",
      });
    }

    if (!txn.pinCodeHash) {
      return res.status(400).json({
        error: "Delivery OTP has not been generated yet.",
      });
    }

    const session = await prisma.checkoutSession.findFirst({
      where: { transactionId: txn.id },
    });
    if (session?.expiresAt && session.expiresAt <= new Date()) {
      return res.status(410).json({
        error: "Delivery OTP expired. Generate a new OTP.",
      });
    }

    if (txn.pinAttempts >= 3) {
      return res.status(423).json({
        error:
          "Delivery OTP locked after too many failed attempts. Generate a new OTP.",
      });
    }

    const valid = hashPin(pin) === txn.pinCodeHash;
    if (!valid) {
      const attempts = txn.pinAttempts + 1;
      await prisma.transaction.update({
        where: { id: txnId },
        data: { pinAttempts: attempts },
      });

      return res.status(400).json({
        error:
          attempts >= 3
            ? "Delivery OTP locked after too many failed attempts. Generate a new OTP."
            : "Invalid OTP.",
        attemptsLeft: Math.max(0, 3 - attempts),
      });
    }

    const [updated] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: txnId },
        data: {
          pinConfirmedAt: new Date(),
          pinAttempts: 0,
          pinCodeHash: null,
        },
      }),
      prisma.checkoutSession.updateMany({
        where: { transactionId: txnId },
        data: { displayPin: null },
      }),
    ]);

    await Promise.all([
      createAndEmitNotification({
        userId: updated.sellerId,
        itemId: updated.itemId,
        itemTitle: updated.itemTitle,
        buyerName: "",
        price: updated.price,
        type: "delivery_confirmed",
        message: "Delivery confirmed successfully.",
      }),
      createAndEmitNotification({
        userId: updated.buyerId,
        itemId: updated.itemId,
        itemTitle: updated.itemTitle,
        buyerName: "",
        price: updated.price,
        type: "delivery_confirmed",
        message: "Delivery confirmed. Enjoy your purchase.",
      }),
    ]);

    res.json({
      message: "Delivery OTP verified.",
      transactionId: updated.id,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      deliveryConfirmedAt: updated.pinConfirmedAt,
    });
  } catch (err) {
    console.error("[PIN_CONFIRM] ERROR:", err);
    res.status(500).json({ error: "Failed to confirm OTP." });
  }
};

export const expireCheckoutSessions = async () => {
  try {
    if (!prisma?.checkoutSession?.findMany) {
      console.warn(
        "[CHECKOUT_EXPIRY] checkoutSession model is unavailable on Prisma client; skipping expiry run.",
      );
      return;
    }

    const now = new Date();
    const sessions = await prisma.checkoutSession.findMany({
      where: {
        status: { in: ACTIVE_SESSION_STATUSES },
        expiresAt: { lte: now },
      },
      include: {
        transaction: true,
      },
      take: 200,
    });

    for (const session of sessions) {
      await prisma.checkoutSession.update({
        where: { id: session.id },
        data: { status: CHECKOUT_SESSION_STATUS.EXPIRED },
      });

      if (!session.transactionId) continue;

      const failed = await prisma.transaction.updateMany({
        where: {
          id: session.transactionId,
          status: PAYMENT_STATUS.PENDING,
        },
        data: {
          status: PAYMENT_STATUS.FAILED,
          paymentStatus: PAYMENT_STATUS.FAILED,
        },
      });

      if (failed.count > 0 && session.transaction) {
        await restoreItemToBuyerCart({
          buyerId: session.transaction.buyerId,
          itemId: session.transaction.itemId,
        });

        await emitCheckoutFailedNotifications({
          txn: session.transaction,
          buyerMessage:
            "Checkout expired. Payment failed and item moved back to your cart.",
        });
      }
    }

    if (sessions.length > 0) {
      console.log(`[CHECKOUT_EXPIRY] Expired sessions: ${sessions.length}`);
    }
  } catch (err) {
    console.error("[CHECKOUT_EXPIRY] ERROR:", err);
  }
};

// GET /transactions/:id — detail view with role-safe fields
export const getTransactionById = async (req, res) => {
  const userId = getUserId(req);
  const txnId = parseInt(req.params.id);

  try {
    const txn = await prisma.transaction.findUnique({
      where: { id: txnId },
      include: {
        buyer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        item: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            condition: true,
          },
        },
        checkoutSession: {
          select: {
            displayPin: true,
            expiresAt: true,
            upiIntent: true,
          },
        },
      },
    });

    if (!txn) return res.status(404).json({ error: "Transaction not found." });
    if (txn.buyerId !== userId && txn.sellerId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorised to view this transaction." });
    }

    const isBuyer = txn.buyerId === userId;
    res.json({
      id: txn.id,
      status: txn.status,
      paymentStatus: txn.paymentStatus,
      paymentMethod: txn.paymentMethod,
      safetyTier: txn.safetyTier,
      createdAt: txn.createdAt,
      paidAt: txn.paidAt,
      pinConfirmedAt: txn.pinConfirmedAt,
      pinAttempts: isBuyer ? undefined : txn.pinAttempts,
      razorpayOrderId: isBuyer ? txn.razorpayOrderId : undefined,
      razorpayPaymentId: isBuyer ? txn.razorpayPaymentId : undefined,
      qrCodeDataUrl: isBuyer ? txn.qrPayload : null,
      deliveryOtp: isBuyer ? (txn.checkoutSession?.displayPin ?? null) : null,
      deliveryOtpExpiresAt: txn.checkoutSession?.expiresAt ?? null,
      deliveryScheduledAt: txn.checkoutSession?.upiIntent || null,
      hasDeliveryOtp: !isBuyer ? Boolean(txn.pinCodeHash) : undefined,
      item: txn.item,
      buyer: txn.buyer,
      seller: txn.seller,
      amount: txn.price,
      quantity: txn.quantity,
    });
  } catch (err) {
    console.error("[TXN_DETAIL] ERROR:", err);
    res.status(500).json({ error: "Failed to fetch transaction details." });
  }
};

// GET /transactions — get all transactions for logged in user
export const getMyTransactions = async (req, res) => {
  const userId = getUserId(req);
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        buyer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        item: { select: { images: true, condition: true, description: true } },
        review: { select: { id: true, rating: true, comment: true } },
        checkoutSession: {
          select: {
            displayPin: true,
            expiresAt: true,
            upiIntent: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = transactions.map((t) => ({
      id: t.id,
      status: t.status,
      payment_status: t.paymentStatus,
      payment_method: t.paymentMethod,
      safety_tier: t.safetyTier,
      pin_confirmed_at: t.pinConfirmedAt,
      created_at: t.createdAt,
      item_id: t.itemId,
      item_title: t.itemTitle,
      price: t.price,
      quantity: t.quantity,
      category: t.itemCategory,
      buyer_id: t.buyerId,
      seller_id: t.sellerId,
      buyer_name: `${t.buyer.firstName} ${t.buyer.lastName}`.trim(),
      seller_name: `${t.seller.firstName} ${t.seller.lastName}`.trim(),
      images: t.item?.images ?? [],
      condition: t.item?.condition ?? null,
      description: t.item?.description ?? null,
      qr_code_data_url: t.buyerId === userId ? t.qrPayload : null,
      delivery_otp:
        t.buyerId === userId ? (t.checkoutSession?.displayPin ?? null) : null,
      delivery_otp_expires_at: t.checkoutSession?.expiresAt ?? null,
      delivery_scheduled_at: t.checkoutSession?.upiIntent || null,
      has_delivery_otp: t.sellerId === userId ? Boolean(t.pinCodeHash) : false,
      review: t.review ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
};

// DELETE /transactions/:id — delete a transaction (only buyer or seller can delete their own)
export const deleteTransaction = async (req, res) => {
  const userId = getUserId(req);
  const txnId = parseInt(req.params.id);
  try {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return res.status(404).json({ error: "Transaction not found." });

    if (txn.buyerId !== userId && txn.sellerId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorised to delete this transaction." });
    }

    await prisma.transaction.delete({ where: { id: txnId } });
    res.json({ message: "Transaction deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction." });
  }
};
