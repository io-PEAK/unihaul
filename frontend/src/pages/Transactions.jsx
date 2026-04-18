import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

// ── Transaction Detail Modal ──────────────────────────────────
function TxnDetailModal({ txn, onClose, onReviewed, onTxnUpdated }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isBuyer = txn.buyer_id === user.id;
  const isDeleted = !txn.item_id;
  const showListingRemoved = isDeleted && !isBuyer;
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [review, setReview] = useState(txn.review || null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  async function handleSubmitReview() {
    if (rating === 0) {
      setReviewError("Please select a rating");
      return;
    }
    setReviewLoading(true);
    setReviewError("");
    try {
      const res = await API.post("/reviews", {
        transactionId: txn.id,
        rating,
        comment: comment || null,
      });
      setReview(res.data);
      onReviewed && onReviewed(txn.id, res.data);
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  }

  const qty = txn.quantity || 1;
  const totalPrice = txn.price;
  const unitPrice = qty > 1 ? Math.round(totalPrice / qty) : totalPrice;
  const paymentStatus = (txn.payment_status || "pending").toLowerCase();
  const txnStatus = (txn.status || "pending").toLowerCase();
  const isFailedTxn = txnStatus === "failed" || paymentStatus === "failed";
  const paymentMethod = (txn.payment_method || "upi_direct").toLowerCase();
  const paymentMethodLabel =
    paymentMethod === "upi_direct" ? "UPI" : "Razorpay";
  const deliveryOtp = txn.delivery_otp || txn.deliveryOtp || null;
  const deliveryOtpExpiresAt =
    txn.delivery_otp_expires_at || txn.deliveryOtpExpiresAt || null;
  const deliveryScheduledAt =
    txn.delivery_scheduled_at || txn.deliveryScheduledAt || null;
  const hasDeliveryOtp = Boolean(txn.has_delivery_otp || deliveryOtp);
  const isPaymentConfirmed = paymentStatus === "completed";
  const isDeliveryConfirmed = Boolean(
    txn.pin_confirmed_at || txn.deliveryConfirmedAt,
  );

  function toDateTimeLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const defaultDeliveryAt = (() => {
    const fallback = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return toDateTimeLocal(deliveryScheduledAt || fallback.toISOString());
  })();

  const initialWindowHours = (() => {
    if (!deliveryScheduledAt || !deliveryOtpExpiresAt) return 24;
    const start = new Date(deliveryScheduledAt).getTime();
    const end = new Date(deliveryOtpExpiresAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
      return 24;
    return Math.max(1, Math.round((end - start) / (60 * 60 * 1000)));
  })();

  const [deliveryAt, setDeliveryAt] = useState(defaultDeliveryAt);
  const [deliveryWindowHours, setDeliveryWindowHours] = useState(
    String(initialWindowHours),
  );
  const canConfirmPin =
    !isBuyer &&
    isPaymentConfirmed &&
    !isFailedTxn &&
    !isDeliveryConfirmed &&
    hasDeliveryOtp;

  async function handleGenerateDeliveryOtp() {
    if (!deliveryAt) {
      setScheduleError("Select delivery date and time.");
      return;
    }

    try {
      setScheduleLoading(true);
      setScheduleError("");
      setScheduleSuccess("");

      const scheduledAtIso = new Date(deliveryAt).toISOString();
      const hours = Math.max(1, Number(deliveryWindowHours) || 24);
      const res = await API.post(`/transactions/${txn.id}/handoff-schedule`, {
        scheduledAt: scheduledAtIso,
        windowHours: hours,
      });

      const updatedTxn = {
        ...txn,
        has_delivery_otp: true,
        delivery_scheduled_at: res.data?.deliveryScheduledAt || scheduledAtIso,
        delivery_otp_expires_at: res.data?.deliveryOtpExpiresAt || null,
      };

      onTxnUpdated?.(updatedTxn);
      setScheduleSuccess("Delivery OTP generated and shared with buyer.");
      setPin("");
    } catch (err) {
      setScheduleError(err.response?.data?.error || "Failed to generate OTP.");
    } finally {
      setScheduleLoading(false);
    }
  }

  async function handleConfirmPin() {
    if (!pin.trim()) {
      setPinError("Enter the buyer OTP first.");
      return;
    }

    try {
      setPinLoading(true);
      setPinError("");
      setPinSuccess("");

      const res = await API.post(`/transactions/${txn.id}/confirm-pin`, {
        pin: pin.trim(),
      });

      const updatedTxn = {
        ...txn,
        status: res.data?.status || "completed",
        payment_status: res.data?.paymentStatus || "completed",
        pin_confirmed_at:
          res.data?.deliveryConfirmedAt || new Date().toISOString(),
        has_delivery_otp: false,
        delivery_otp: null,
      };

      onTxnUpdated?.(updatedTxn);
      setPinSuccess("Delivery OTP confirmed.");
      setPin("");
    } catch (err) {
      setPinError(err.response?.data?.error || "OTP confirmation failed.");
    } finally {
      setPinLoading(false);
    }
  }

  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const images = txn.images && txn.images.length > 0 ? txn.images : [];

  useEffect(() => {
    // Lock background scroll when modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      // Restore scroll when modal closes
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "1.5rem",
        overflow: "hidden",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="txn-detail-modal"
        style={{
          background: "var(--glass-bg-modal)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--glass-border)",
          borderRadius: "24px",
          padding: "2.5rem",
          maxWidth: "520px",
          width: "100%",
          position: "relative",
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          maxHeight: "88vh",
          scrollbarWidth: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "var(--glass-shimmer)",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-card-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-card)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          &times;
        </button>

        {/* Category badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "0.6rem",
          }}
        >
          {txn.category && (
            <span
              style={{
                fontSize: "0.6rem",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontWeight: "700",
              }}
            >
              {txn.category}
            </span>
          )}
          {showListingRemoved && (
            <span
              style={{
                fontSize: "0.6rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "rgba(255,107,107,0.7)",
                fontWeight: "700",
                background: "rgba(255,107,107,0.08)",
                border: "1px solid rgba(255,107,107,0.15)",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              Listing Removed
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "900",
            letterSpacing: "-1px",
            color: "var(--text-primary)",
            margin: "0 0 1.5rem 0",
            lineHeight: 1.1,
          }}
        >
          {txn.item_title || "Deleted Item"}
        </h2>

        {/* Images — slide animation, arrows, zoom */}
        {images.length > 0 && (
          <div
            style={{
              marginBottom: "1.5rem",
              position: "relative",
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "rgba(0,0,0,0.3)",
              height: "200px",
              cursor: "zoom-in",
            }}
            onClick={() => setZoomed(true)}
          >
            {/* Sliding track */}
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                transform: `translateX(-${activeImg * 100}%)`,
                transition:
                  "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              {images.map((img, i) => (
                <div
                  key={i}
                  style={{ minWidth: "100%", height: "100%", flexShrink: 0 }}
                >
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && activeImg > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg((i) => i - 1);
                }}
                style={{
                  position: "absolute",
                  left: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid var(--border-hover)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(6px)",
                  zIndex: 2,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            {images.length > 1 && activeImg < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg((i) => i + 1);
                }}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid var(--border-hover)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(6px)",
                  zIndex: 2,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
            {images.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "0.5rem",
                  right: "0.6rem",
                  fontSize: "0.65rem",
                  fontWeight: "800",
                  color: "white",
                  background: "rgba(0,0,0,0.65)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  zIndex: 2,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                {activeImg + 1} / {images.length}
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: "0.5rem",
                left: "0.6rem",
                display: "flex",
                alignItems: "center",
                color: "white",
                background: "rgba(var(--accent-rgb),0.75)",
                padding: "4px 8px",
                borderRadius: "20px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)",
                zIndex: 2,
                boxShadow: "0 2px 10px rgba(var(--accent-rgb),0.3)",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
          </div>
        )}
        {/* Zoom modal */}
        {zoomed &&
          images.length > 0 &&
          createPortal(
            <div
              onClick={() => setZoomed(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.92)",
                zIndex: 999999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "zoom-out",
              }}
            >
              {/* Close X button */}
              <button
                onClick={() => setZoomed(false)}
                style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                &times;
              </button>

              <img
                src={images[activeImg]}
                alt=""
                style={{
                  maxWidth: "92vw",
                  maxHeight: "88vh",
                  objectFit: "contain",
                  borderRadius: "10px",
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {images.length > 1 && activeImg > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((i) => i - 1);
                  }}
                  style={{
                    position: "absolute",
                    left: "1.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              {images.length > 1 && activeImg < images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((i) => i + 1);
                  }}
                  style={{
                    position: "absolute",
                    right: "1.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
              {images.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "1.5rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "rgba(255,255,255,0.7)",
                    background: "rgba(0,0,0,0.5)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                  }}
                >
                  {activeImg + 1} / {images.length}
                </div>
              )}
            </div>,
            document.body,
          )}

        {/* Price */}
        <div style={{ marginBottom: "1.75rem" }}>
          {qty > 1 ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.6rem",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    letterSpacing: "-1px",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "inline-block",
                  }}
                >
                  &#8377;{unitPrice}
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    fontWeight: "600",
                  }}
                >
                  per unit
                </span>
              </div>
              <div
                style={{
                  marginTop: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    fontWeight: "500",
                  }}
                >
                  &#8377;{unitPrice} &times; {qty} units
                </span>
                <span
                  style={{ color: "var(--text-ghost)", fontSize: "0.7rem" }}
                >
                  =
                </span>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    color: "var(--text-secondary)",
                  }}
                >
                  &#8377;{Number(totalPrice).toLocaleString("en-IN")} total
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "900",
                letterSpacing: "-1px",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
              }}
            >
              &#8377;{Number(totalPrice).toLocaleString("en-IN")}
            </div>
          )}
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--glass-divider)",
            marginBottom: "1.5rem",
          }}
        />

        {/* Info grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.65rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            {
              label: isBuyer ? "Seller" : "Buyer",
              value: isBuyer ? txn.seller_name : txn.buyer_name,
            },
            { label: "Category", value: txn.category || "—" },
            {
              label: "Role",
              value: isFailedTxn ? "Failed" : isBuyer ? "Bought" : "Sold",
              isRole: true,
            },
            { label: "Quantity", value: `${qty} unit${qty > 1 ? "s" : ""}` },
            {
              label: "Date",
              value: txn.created_at
                ? new Date(txn.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—",
              fullWidth: true,
            },
          ].map(({ label, value, isRole, fullWidth }) => (
            <div
              key={label}
              style={{
                gridColumn: fullWidth ? "1 / -1" : "auto",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "0.85rem 1rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background: "var(--glass-shimmer)",
                }}
              />
              <div
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--text-ghost)",
                  marginBottom: "0.35rem",
                  fontWeight: "700",
                }}
              >
                {label}
              </div>
              {isRole ? (
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    color: isFailedTxn
                      ? "#ff6b6b"
                      : isBuyer
                        ? "#74b9ff"
                        : "#51cf66",
                    background: isFailedTxn
                      ? "rgba(255,107,107,0.1)"
                      : isBuyer
                        ? "rgba(116,185,255,0.1)"
                        : "rgba(81,207,102,0.1)",
                    padding: "2px 10px",
                    borderRadius: "20px",
                    border: isFailedTxn
                      ? "1px solid rgba(255,107,107,0.2)"
                      : isBuyer
                        ? "1px solid rgba(116,185,255,0.15)"
                        : "1px solid rgba(81,207,102,0.15)",
                  }}
                >
                  {value}
                </span>
              ) : (
                <div
                  style={{
                    fontWeight: "600",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {value}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status bar */}
        <div
          style={{
            textAlign: "center",
            padding: "0.75rem",
            borderRadius: "12px",
            fontSize: "0.82rem",
            fontWeight: "600",
            letterSpacing: "0.3px",
            background: isFailedTxn
              ? "rgba(255,107,107,0.08)"
              : isBuyer
                ? "rgba(116,185,255,0.06)"
                : "rgba(81,207,102,0.06)",
            border: isFailedTxn
              ? "1px solid rgba(255,107,107,0.15)"
              : isBuyer
                ? "1px solid rgba(116,185,255,0.1)"
                : "1px solid rgba(81,207,102,0.1)",
            color: isFailedTxn
              ? "rgba(255,107,107,0.8)"
              : isBuyer
                ? "rgba(116,185,255,0.6)"
                : "rgba(81,207,102,0.6)",
          }}
        >
          {isFailedTxn
            ? "Payment failed"
            : txn.status === "completed"
              ? isBuyer
                ? "Purchase completed"
                : "Sale completed"
              : `Status: ${txn.status || "pending"}`}
        </div>

        <div
          style={{
            marginTop: "0.6rem",
            textAlign: "center",
            padding: "0.65rem",
            borderRadius: "10px",
            fontSize: "0.74rem",
            fontWeight: "700",
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
          }}
        >
          Payment: {paymentMethodLabel} · {paymentStatus}
        </div>

        {paymentMethod === "upi_direct" && (
          <div
            style={{
              marginTop: "0.55rem",
              textAlign: "center",
              padding: "0.55rem",
              borderRadius: "10px",
              fontSize: "0.72rem",
              fontWeight: "600",
              color: "rgba(255,171,0,0.85)",
              background: "rgba(255,171,0,0.08)",
              border: "1px solid rgba(255,171,0,0.2)",
            }}
          >
            Direct UPI is test mode and considered unreliable for payment truth.
          </div>
        )}

        {!isBuyer &&
          isPaymentConfirmed &&
          !isFailedTxn &&
          !isDeliveryConfirmed && (
            <div
              style={{
                marginTop: "0.8rem",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                background: "var(--bg-input)",
                padding: "0.85rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.74rem",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                Schedule Delivery OTP
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="datetime-local"
                  value={deliveryAt}
                  onChange={(e) => setDeliveryAt(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "210px",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                  }}
                />
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={deliveryWindowHours}
                  onChange={(e) => setDeliveryWindowHours(e.target.value)}
                  placeholder="Hours"
                  style={{
                    width: "96px",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={handleGenerateDeliveryOtp}
                  disabled={scheduleLoading}
                  style={{
                    padding: "0.65rem 0.85rem",
                    border: "none",
                    borderRadius: "10px",
                    cursor: scheduleLoading ? "not-allowed" : "pointer",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "0.74rem",
                    opacity: scheduleLoading ? 0.6 : 1,
                  }}
                >
                  {scheduleLoading
                    ? "Saving..."
                    : hasDeliveryOtp
                      ? "Update OTP"
                      : "Generate OTP"}
                </button>
              </div>
              {scheduleError && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.74rem",
                    color: "#ef4444",
                  }}
                >
                  {scheduleError}
                </div>
              )}
              {scheduleSuccess && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.74rem",
                    color: "#22c55e",
                  }}
                >
                  {scheduleSuccess}
                </div>
              )}
            </div>
          )}

        {isBuyer && deliveryOtp && !isDeliveryConfirmed && (
          <div
            style={{
              marginTop: "0.8rem",
              border: "1px solid rgba(var(--accent-rgb),0.2)",
              borderRadius: "12px",
              background: "rgba(var(--accent-rgb),0.08)",
              padding: "0.85rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "700",
              }}
            >
              Delivery OTP
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "1.2rem",
                letterSpacing: "0.25em",
                fontWeight: "800",
                color: "var(--text-primary)",
              }}
            >
              {deliveryOtp}
            </div>
            {deliveryScheduledAt && (
              <div
                style={{
                  marginTop: "0.45rem",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                }}
              >
                Scheduled:{" "}
                {new Date(deliveryScheduledAt).toLocaleString("en-IN")}
              </div>
            )}
            {deliveryOtpExpiresAt && (
              <div
                style={{
                  marginTop: "0.2rem",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                }}
              >
                Expires:{" "}
                {new Date(deliveryOtpExpiresAt).toLocaleString("en-IN")}
              </div>
            )}
          </div>
        )}

        {canConfirmPin && (
          <div
            style={{
              marginTop: "0.8rem",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              background: "var(--bg-input)",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.74rem",
                fontWeight: "700",
                color: "var(--text-muted)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              Confirm Delivery OTP
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                value={pin}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(next);
                  setPinError("");
                }}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                style={{
                  flex: 1,
                  padding: "0.65rem 0.75rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontFamily: "monospace",
                  fontWeight: "700",
                  letterSpacing: "0.2em",
                }}
              />
              <button
                onClick={handleConfirmPin}
                disabled={pinLoading || pin.length < 6}
                style={{
                  padding: "0.65rem 0.85rem",
                  border: "none",
                  borderRadius: "10px",
                  cursor:
                    pinLoading || pin.length < 6 ? "not-allowed" : "pointer",
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  color: "white",
                  fontWeight: "800",
                  fontSize: "0.74rem",
                  opacity: pinLoading || pin.length < 6 ? 0.6 : 1,
                }}
              >
                {pinLoading ? "Checking..." : "Confirm OTP"}
              </button>
            </div>
            {pinError && (
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.74rem",
                  color: "#ef4444",
                }}
              >
                {pinError}
              </div>
            )}
            {pinSuccess && (
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.74rem",
                  color: "#22c55e",
                }}
              >
                {pinSuccess}
              </div>
            )}
          </div>
        )}

        {showListingRemoved && (
          <div
            style={{
              marginTop: "0.65rem",
              textAlign: "center",
              padding: "0.6rem",
              borderRadius: "10px",
              fontSize: "0.75rem",
              fontWeight: "500",
              color: "rgba(255,107,107,0.45)",
              background: "rgba(255,107,107,0.04)",
              border: "1px solid rgba(255,107,107,0.08)",
            }}
          >
            You removed this listing after the sale
          </div>
        )}

        {/* Review section — only for buyers */}
        {isBuyer && (
          <div
            style={{
              marginTop: "1rem",
              borderTop: "1px solid var(--border)",
              paddingTop: "1rem",
            }}
          >
            {review ? (
              <div>
                <div
                  style={{
                    fontSize: "0.62rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                    marginBottom: "0.6rem",
                  }}
                >
                  Your Review
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.2rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={s <= review.rating ? "var(--accent)" : "none"}
                      stroke={
                        s <= review.rating
                          ? "var(--accent)"
                          : "var(--text-ghost)"
                      }
                      strokeWidth="1.5"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      marginLeft: "0.4rem",
                      alignSelf: "center",
                    }}
                  >
                    {
                      ["", "Terrible", "Bad", "Okay", "Good", "Excellent"][
                        review.rating
                      ]
                    }
                  </span>
                </div>
                {review.comment && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      lineHeight: "1.6",
                      fontStyle: "italic",
                    }}
                  >
                    "{review.comment}"
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: "0.62rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                    marginBottom: "0.6rem",
                  }}
                >
                  Leave a Review
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.4rem",
                    marginBottom: "0.875rem",
                    alignItems: "center",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.2rem",
                        transition: "transform 0.15s",
                        transform:
                          (hoverRating || rating) >= star
                            ? "scale(1.2)"
                            : "scale(1)",
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={
                          (hoverRating || rating) >= star
                            ? "var(--accent)"
                            : "none"
                        }
                        stroke={
                          (hoverRating || rating) >= star
                            ? "var(--accent)"
                            : "var(--text-ghost)"
                        }
                        strokeWidth="1.5"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        marginLeft: "0.25rem",
                      }}
                    >
                      {
                        ["", "Terrible", "Bad", "Okay", "Good", "Excellent"][
                          rating
                        ]
                      }
                    </span>
                  )}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience (optional)..."
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.875rem",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-body)",
                    marginBottom: "0.75rem",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--accent-rgb),0.35)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                {reviewError && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#ef4444",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {reviewError}
                  </div>
                )}
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewLoading || rating === 0}
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    background:
                      rating === 0 || reviewLoading
                        ? "var(--bg-card-hover)"
                        : "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    color:
                      rating === 0 || reviewLoading
                        ? "var(--text-muted)"
                        : "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor:
                      rating === 0 || reviewLoading ? "not-allowed" : "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    fontFamily: "var(--font-body)",
                    boxShadow:
                      rating > 0 && !reviewLoading
                        ? "var(--shadow-accent)"
                        : "none",
                  }}
                >
                  {reviewLoading ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Transaction Row ───────────────────────────────────────────
function TransactionRow({
  txn,
  selectMode,
  selected,
  onToggle,
  onDelete,
  onOpen,
  gridSize = 1,
}) {
  const [hovered, setHovered] = useState(false);
  const [trashHovered, setTrashHovered] = useState(false);
  const review = txn.review || null;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isBuyer = txn.buyer_id === user.id;
  const paymentStatus = (txn.payment_status || "pending").toLowerCase();
  const txnStatus = (txn.status || "pending").toLowerCase();
  const isFailedTxn = txnStatus === "failed" || paymentStatus === "failed";
  const role = isFailedTxn ? "Failed" : isBuyer ? "Bought" : "Sold";
  const otherParty = isBuyer
    ? txn.seller_name || "Seller"
    : txn.buyer_name || "Buyer";
  const qty = txn.quantity || 1;

  function handleClick() {
    if (selectMode) {
      onToggle();
      return;
    }
    onOpen();
  }

  const showCheckbox = hovered || selectMode;
  const showTrash = selected;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        display: "flex",
        flexDirection: gridSize === 1 ? "row" : "column",
        alignItems: gridSize === 1 ? "center" : "stretch",
        gap: gridSize === 1 ? "1rem" : "0",
        background: selected
          ? "linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)"
          : hovered
            ? "var(--bg-card-hover)"
            : "var(--bg-surface)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: selected
          ? "1px solid rgba(var(--accent-rgb),0.3)"
          : hovered
            ? "1px solid var(--border-hover)"
            : "1px solid var(--border)",
        borderRadius: "16px",
        padding: gridSize === 1 ? "1.25rem 1.5rem" : "0",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        boxShadow: selected
          ? "0 4px 20px rgba(var(--accent-rgb),0.1)"
          : hovered
            ? "var(--shadow-card)"
            : "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--border)",
        transform: hovered && gridSize > 1 ? "translateY(-4px)" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "var(--glass-shimmer)",
        }}
      />

      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "6px",
          flexShrink: 0,
          border: selected ? "none" : "1.5px solid var(--border-hover)",
          background: selected
            ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
            : "var(--bg-input)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: selected
            ? "0 2px 10px rgba(var(--accent-rgb),0.45)"
            : "none",
          opacity: showCheckbox ? 1 : 0,
          transform: showCheckbox ? "scale(1)" : "scale(0.7)",
          pointerEvents: showCheckbox ? "auto" : "none",
          position: gridSize === 1 ? "static" : "absolute",
          top: gridSize === 1 ? "auto" : "0.75rem",
          left: gridSize === 1 ? "auto" : "0.75rem",
          zIndex: 10,
        }}
      >
        {selected && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <polyline
              points="2,6 5,9 10,3"
              stroke="white"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Image Preview */}
      <div
        style={{
          width: gridSize === 1 ? "48px" : "100%",
          height: gridSize === 1 ? "48px" : gridSize === 2 ? "180px" : "160px",
          borderRadius: gridSize === 1 ? "10px" : "0",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--bg-surface)",
          border: gridSize === 1 ? "1px solid var(--border)" : "none",
          borderBottom: gridSize > 1 ? "1px solid var(--border)" : "none",
          position: "relative",
        }}
      >
        {txn.images?.[0] ? (
          <img
            src={txn.images[0]}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease",
              transform: hovered ? "scale(1.1)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-ghost)",
              opacity: 0.3,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: gridSize === 1 ? "0" : "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {txn.item_title || "Deleted Item"}
          </h3>
          {qty > 1 && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: "800",
                letterSpacing: "0.5px",
                background: "rgba(var(--accent-rgb),0.15)",
                color: "var(--accent)",
                border: "1px solid rgba(var(--accent-rgb),0.3)",
                padding: "2px 8px",
                borderRadius: "20px",
                flexShrink: 0,
              }}
            >
              &times;{qty}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "0.45rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: "800",
              fontSize: "0.95rem",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-alt))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            &#8377;{Number(txn.price).toLocaleString("en-IN")}
          </span>
          <span
            style={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "var(--border-hover)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              fontWeight: "600",
            }}
          >
            {otherParty}
          </span>
          <span
            style={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "var(--border-hover)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: "700",
              color: isFailedTxn ? "#ff6b6b" : isBuyer ? "#74b9ff" : "#51cf66",
              background: isFailedTxn
                ? "rgba(255,107,107,0.1)"
                : isBuyer
                  ? "rgba(116,185,255,0.1)"
                  : "rgba(81,207,102,0.1)",
              padding: "2px 10px",
              borderRadius: "20px",
              border: isFailedTxn
                ? "1px solid rgba(255,107,107,0.2)"
                : isBuyer
                  ? "1px solid rgba(116,185,255,0.15)"
                  : "1px solid rgba(81,207,102,0.15)",
            }}
          >
            {role}
          </span>
          {txn.created_at && (
            <span style={{ fontSize: "0.7rem", color: "var(--text-ghost)" }}>
              {new Date(txn.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Right — trash or arrow */}
      <div
        style={{
          flexShrink: 0,
          width: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showTrash ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onMouseEnter={() => setTrashHovered(true)}
            onMouseLeave={() => setTrashHovered(false)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: trashHovered
                ? "rgba(255,77,77,0.18)"
                : "rgba(255,107,107,0.08)",
              border: trashHovered
                ? "1px solid rgba(255,77,77,0.35)"
                : "1px solid rgba(255,107,107,0.12)",
              transition: "all 0.2s ease",
              boxShadow: trashHovered
                ? "0 0 14px rgba(255,77,77,0.25)"
                : "none",
              transform: trashHovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            <svg width="14" height="15" viewBox="0 0 16 17" fill="none">
              <path
                d="M2 4h12"
                stroke={trashHovered ? "#ff4d4d" : "rgba(255,107,107,0.7)"}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4"
                stroke={trashHovered ? "#ff4d4d" : "rgba(255,107,107,0.7)"}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5"
                stroke={trashHovered ? "#ff4d4d" : "rgba(255,107,107,0.7)"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 7.5v4M9.5 7.5v4"
                stroke={trashHovered ? "#ff4d4d" : "rgba(255,107,107,0.5)"}
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ) : gridSize === 1 ? (
          <span
            style={{
              color: hovered ? "var(--text-muted)" : "var(--text-ghost)",
              transition: "color 0.2s ease",
              fontSize: "1rem",
            }}
          >
            &#8594;
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────
function ConfirmModal({ count, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel]);

  return createPortal(
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "cdFadeIn 0.18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--glass-bg-modal)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--border-hover)",
          borderRadius: "20px",
          padding: "2rem",
          width: "380px",
          maxWidth: "90vw",
          boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
          position: "relative",
          overflow: "hidden",
          animation: "cdSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
      >
        {/* Red shimmer line at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,107,107,0.4), transparent)",
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            margin: "0 auto 1.25rem",
            background: "rgba(255,107,107,0.1)",
            border: "1px solid rgba(255,107,107,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff6b6b"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
              letterSpacing: "-0.3px",
            }}
          >
            Delete {count > 1 ? `${count} transactions` : "this transaction"}?
          </div>
          <div
            style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              lineHeight: "1.5",
            }}
          >
            This action cannot be undone.
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "700",
              color: "var(--text-muted)",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.75rem",
              background:
                "linear-gradient(135deg, rgba(255,107,107,0.9), rgba(220,53,69,0.9))",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "700",
              color: "white",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 15px rgba(255,107,107,0.25)",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(255,107,107,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(255,107,107,0.25)";
            }}
          >
            Delete
          </button>
        </div>

        <style>{`
          @keyframes cdFadeIn  { from{opacity:0} to{opacity:1} }
          @keyframes cdSlideUp { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}

// ── Main ──────────────────────────────────────────────────────
function Transactions() {
  const navigate = useNavigate();
  // ── Draggable back button ──────────────────────────────────
  const [draggable, setDraggable] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("floatingDraggable") ?? "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const sync = () => {
      try {
        setDraggable(
          JSON.parse(localStorage.getItem("floatingDraggable") ?? "false"),
        );
      } catch {}
    };
    window.addEventListener("floatingDraggableChanged", sync);
    return () => window.removeEventListener("floatingDraggableChanged", sync);
  }, []);
  const backRef = useRef(null);
  useEffect(() => {
    if (!backRef.current) return;
    if (!draggable) {
      backRef.current.style.transform = "";
      backRef.current.style.transition = "";
      backRef.current.style.zIndex = "";
      backRef.current.style.cursor = "";
      localStorage.removeItem("drag_backbtn_txn");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("drag_backbtn_txn"));
        if (saved)
          backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
      } catch {}
    }
  }, [draggable]);
  useEffect(() => {
    if (!draggable || !backRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem("drag_backbtn_txn"));
      if (saved)
        backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
    } catch {}
  }, []);
  const startBackDrag = useCallback(
    (clientX, clientY) => {
      if (!draggable || !backRef.current) return;
      const el = backRef.current;
      const match = el.style.transform.match(
        /translate\(([-.0-9]+)px,\s*([-.0-9]+)px\)/,
      );
      const baseDx = match ? parseFloat(match[1]) : 0;
      const baseDy = match ? parseFloat(match[2]) : 0;
      let dx = baseDx,
        dy = baseDy;
      let hasDragged = false;
      let rafId = null;
      el.style.transition = "none";
      el.style.zIndex = "9999";
      el.style.cursor = "grabbing";
      const onMove = (cx, cy) => {
        dx = baseDx + (cx - clientX);
        dy = baseDy + (cy - clientY);
        if (Math.abs(cx - clientX) > 4 || Math.abs(cy - clientY) > 4)
          hasDragged = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      };
      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        el.style.cursor = "grab";
        el.style.transition = "";
        el.style.zIndex = "";
        if (hasDragged) {
          localStorage.setItem("drag_backbtn_txn", JSON.stringify({ dx, dy }));
          const kill = (ce) => {
            ce.stopPropagation();
            ce.preventDefault();
            window.removeEventListener("click", kill, true);
          };
          window.addEventListener("click", kill, true);
        }
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onUp);
      };
      const onMouseMove = (e) => onMove(e.clientX, e.clientY);
      const onTouchMove = (e) => {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onUp);
    },
    [draggable],
  );
  const onBackMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      startBackDrag(e.clientX, e.clientY);
    },
    [startBackDrag],
  );
  const onBackTouchStart = useCallback(
    (e) => {
      startBackDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    [startBackDrag],
  );
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grid Size state
  const [gridSize, setGridSizeState] = useState(() => {
    try {
      return parseInt(localStorage.getItem("gridSize_transactions") || "1", 10);
    } catch {
      return 1;
    }
  });
  useEffect(() => {
    window.__homeGridBridge = {
      set: (val) => setGridSizeState(val),
    };
    function onGridSize(e) {
      setGridSizeState(e.detail.val);
    }
    window.addEventListener("home-grid-size", onGridSize);
    return () => {
      window.removeEventListener("home-grid-size", onGridSize);
      window.__homeGridBridge = null;
    };
  }, []);

  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [confirmIds, setConfirmIds] = useState(null);
  const [search, setSearch] = useState("");
  const [openTxn, setOpenTxn] = useState(null);

  useEffect(() => {
    API.get("/transactions")
      .then((r) =>
        setTransactions(
          (r.data || []).filter((t) => {
            const status = (t.status || "").toLowerCase();
            const paymentStatus = (t.payment_status || "").toLowerCase();
            const paymentMethod = (t.payment_method || "").toLowerCase();
            const isPendingPinFlow =
              status === "pending" &&
              paymentMethod === "upi_direct" &&
              (paymentStatus === "requires_pin" || paymentStatus === "pending");

            return status !== "pending" || isPendingPinFlow;
          }),
        ),
      )
      .catch(() => setError("Failed to load transactions."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setSelectMode(false);
        setSelected(new Set());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isFailedTxn = (t) => {
    const txnStatus = (t.status || "").toLowerCase();
    const paymentStatus = (t.payment_status || "").toLowerCase();
    return txnStatus === "failed" || paymentStatus === "failed";
  };

  const boughtTxns = transactions.filter(
    (t) => t.buyer_id === user.id && !isFailedTxn(t),
  );
  const soldTxns = transactions.filter(
    (t) => t.seller_id === user.id && !isFailedTxn(t),
  );
  const failedTxns = transactions.filter((t) => isFailedTxn(t));

  const baseFiltered =
    filter === "All"
      ? transactions
      : filter === "Bought"
        ? boughtTxns
        : filter === "Sold"
          ? soldTxns
          : failedTxns;

  const filtered = search.trim()
    ? baseFiltered.filter((t) => {
        const q = search.toLowerCase();
        return (
          (t.item_title || "").toLowerCase().includes(q) ||
          (t.buyer_name || "").toLowerCase().includes(q) ||
          (t.seller_name || "").toLowerCase().includes(q)
        );
      })
    : baseFiltered;

  function toggleSelect(id) {
    if (!selectMode) setSelectMode(true);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  }

  async function confirmDelete(ids) {
    setConfirmIds(null);
    for (const id of ids) {
      try {
        await API.delete(`/transactions/${id}`);
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } catch {}
    }
    setSelectMode(false);
    setSelected(new Set());
  }

  return (
    <div
      className="txn-page"
      style={{
        padding: "5rem 4rem 3rem",
        maxWidth:
          gridSize === 1 ? "900px" : gridSize === 2 ? "1100px" : "1300px",
        margin: "0 auto",
        transition: "max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <style>{`
        /* ── Tablet: 769px – 1024px ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .txn-page { padding: 4rem 2rem 3rem !important; }
          .txn-back-btn { left: -36px !important; }
          .txn-header h1 { font-size: 2.2rem !important; letter-spacing: -1.2px !important; }
          .txn-detail-modal { padding: 2rem !important; max-width: 92vw !important; }
        }

        /* ── Wide: > 1280px ── */
        @media (min-width: 1280px) {
          .txn-page { padding: 6rem 5rem 3rem !important; }
          .txn-back-btn { left: -60px !important; }
        }

        /* ── Mobile: < 768px ── */
        @media (max-width: 768px) {
          .txn-page { padding: 3.5rem 1.25rem 3rem !important; }
          .txn-back-btn { position: relative !important; left: 0 !important; top: 0 !important; margin-bottom: 1rem !important; }
          .txn-header { padding-left: 0 !important; }
          .txn-header h1 { font-size: 2rem !important; letter-spacing: -1px !important; }
          .txn-filter-row { flex-wrap: wrap !important; }
          .txn-detail-modal { padding: 1.5rem !important; }
        }
        @media (max-width: 480px) {
          .txn-page { padding: 3rem 0.875rem 3rem !important; }
          .txn-header h1 { font-size: 1.6rem !important; }
        }
      `}</style>

      {openTxn && (
        <TxnDetailModal
          txn={openTxn}
          onClose={() => setOpenTxn(null)}
          onTxnUpdated={(updatedTxn) => {
            setOpenTxn(updatedTxn);
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === updatedTxn.id ? { ...t, ...updatedTxn } : t,
              ),
            );
          }}
          onReviewed={(txnId, r) =>
            setTransactions((prev) =>
              prev.map((t) => (t.id === txnId ? { ...t, review: r } : t)),
            )
          }
        />
      )}

      {confirmIds && (
        <ConfirmModal
          count={confirmIds.length}
          onConfirm={() => confirmDelete(confirmIds)}
          onCancel={() => setConfirmIds(null)}
        />
      )}

      {/* Header */}
      <div
        className="txn-header"
        style={{ marginBottom: "2.5rem", position: "relative" }}
      >
        <button
          ref={backRef}
          onClick={() => navigate(-1)}
          onMouseDown={onBackMouseDown}
          onTouchStart={onBackTouchStart}
          className="txn-back-btn back-btn-circle"
          style={{
            position: "absolute",
            left: "-50px",
            top: "6px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "var(--bg-surface)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: draggable ? "grab" : "pointer",
            flexShrink: 0,
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
            e.currentTarget.style.boxShadow =
              "0 0 8px 2px rgba(var(--accent-rgb),0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: "900",
            letterSpacing: "-2px",
            lineHeight: "1.05",
            marginBottom: "0.6rem",
            color: "var(--text-primary)",
          }}
        >
          My
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-alt))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Transactions.
          </span>
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            fontWeight: "400",
          }}
        >
          All your purchases and sales in one place.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.25rem" }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-ghost)"
          strokeWidth="2.2"
          strokeLinecap="round"
          style={{
            position: "absolute",
            left: "1rem",
            top: "50%",
            transform: "translateY(-30%)",
            pointerEvents: "none",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item, buyer, or seller..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "0.65rem 1rem 0.65rem 2.75rem",
            background: "var(--bg-card-hover)",
            border: search
              ? "1px solid rgba(var(--accent-rgb),0.35)"
              : "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            outline: "none",
            fontFamily: "inherit",
            transition: "border 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "none",
          }}
          onFocus={(e) => {
            e.target.style.border = "1px solid rgba(var(--accent-rgb),0.4)";
            e.target.style.boxShadow = "0 0 0 3px rgba(var(--accent-rgb),0.12)";
          }}
          onBlur={(e) => {
            e.target.style.border = search
              ? "1px solid rgba(var(--accent-rgb),0.35)"
              : "1px solid var(--border)";
            e.target.style.boxShadow = "none";
          }}
        />
        {search && (
          <div
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            &times;
          </div>
        )}
      </div>

      {/* Filter + Select row */}
      <div
        className="txn-filter-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["All", "Bought", "Sold", "Failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "10px",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border:
                  filter === f
                    ? "1px solid transparent"
                    : "1px solid var(--border)",
                background:
                  filter === f
                    ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                    : "var(--bg-card-hover)",
                color: filter === f ? "white" : "var(--text-secondary)",
                boxShadow: filter === f ? "var(--shadow-accent)" : "none",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        {filtered.length > 0 && (
          <button
            onClick={() => {
              setSelectMode((v) => !v);
              setSelected(new Set());
            }}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "10px",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: selectMode
                ? "rgba(var(--accent-rgb),0.1)"
                : "var(--bg-card)",
              border: selectMode
                ? "1px solid rgba(var(--accent-rgb),0.3)"
                : "1px solid var(--border)",
              color: selectMode ? "var(--accent)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {selectMode ? "Cancel" : "Select"}
          </button>
        )}
      </div>

      {/* Select toolbar */}
      {selectMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg, rgba(var(--accent-rgb),0.07) 0%, rgba(var(--accent-rgb),0.02) 100%)",
            border: "1px solid rgba(var(--accent-rgb),0.18)",
            borderRadius: "14px",
            padding: "0.75rem 1.25rem",
            marginBottom: "1rem",
            animation: "fadeSlideIn 0.2s ease",
          }}
        >
          <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-5px) } to { opacity:1; transform:translateY(0) } }
        .txn-detail-modal::-webkit-scrollbar { display: none; }`}</style>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: "600",
              }}
            >
              {selected.size} selected
            </span>
            <button
              onClick={() => {
                if (selected.size === filtered.length) {
                  setSelected(new Set());
                  setSelectMode(false);
                } else setSelected(new Set(filtered.map((t) => t.id)));
              }}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.background = "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.background = "var(--bg-card)";
              }}
            >
              {selected.size === filtered.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          <button
            disabled={selected.size === 0}
            onClick={() => selected.size > 0 && setConfirmIds([...selected])}
            style={{
              padding: "0.35rem 1rem",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: "700",
              cursor: selected.size === 0 ? "not-allowed" : "pointer",
              background:
                selected.size > 0
                  ? "rgba(255,77,77,0.1)"
                  : "rgba(255,255,255,0.03)",
              border:
                selected.size > 0
                  ? "1px solid rgba(255,77,77,0.22)"
                  : "1px solid var(--border)",
              color: selected.size > 0 ? "#ff6b6b" : "var(--text-ghost)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.2s ease",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 17" fill="none">
              <path
                d="M2 4h12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Delete{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          {
            label: "Bought",
            value: boughtTxns.length,
          },
          {
            label: "Sold",
            value: soldTxns.length,
          },
          {
            label: "Total",
            value: transactions.length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "0.85rem 1.25rem",
              minWidth: "80px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--border)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "1px",
                background: "var(--glass-shimmer)",
              }}
            />
            <div
              style={{
                fontSize: "0.55rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontWeight: "700",
                marginBottom: "0.25rem",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: "800",
                color: "var(--text-secondary)",
                letterSpacing: "-0.5px",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          height: "1px",
          background: "var(--glass-divider)",
          marginBottom: "1.5rem",
        }}
      />
      <p
        style={{
          color: "var(--text-ghost)",
          fontSize: "0.7rem",
          marginBottom: "1rem",
          fontWeight: "700",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
        }}
      >
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
      </p>

      {loading && (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--border)",
              borderTop: "3px solid var(--accent)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Loading transactions...
          </p>
        </div>
      )}
      {!loading && error && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 2rem",
            background: "rgba(255,107,107,0.08)",
            border: "1px solid rgba(255,107,107,0.15)",
            borderRadius: "20px",
            color: "#ff6b6b",
          }}
        >
          <p style={{ fontSize: "0.95rem", fontWeight: "500" }}>{error}</p>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            border: "1px solid var(--border-hover)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.4 }}
          >
            &#8709;
          </div>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "var(--text-muted)",
            }}
          >
            No transactions yet.
          </p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <>
          <style>{`
            @keyframes gridSwitchScale {
              0% { opacity: 0; transform: scale(0.98) translateY(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div
            key={gridSize}
            style={{
              display: "grid",
              animation:
                "gridSwitchScale 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards",
              gridTemplateColumns:
                gridSize === 1
                  ? "1fr"
                  : gridSize === 2
                    ? "repeat(auto-fill, minmax(360px, 1fr))"
                    : "repeat(auto-fill, minmax(300px, 1fr))",
              gap: gridSize === 1 ? "0.75rem" : "1.5rem",
            }}
          >
            {filtered.map((txn) => (
              <TransactionRow
                key={txn.id}
                txn={txn}
                selectMode={selectMode}
                selected={selected.has(txn.id)}
                onToggle={() => toggleSelect(txn.id)}
                onDelete={() => setConfirmIds([txn.id])}
                onOpen={() => setOpenTxn(txn)}
                gridSize={gridSize}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Transactions;
