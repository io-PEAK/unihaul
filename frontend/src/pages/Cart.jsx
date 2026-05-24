import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function ProtectedCheckoutModal({
  open,
  onClose,
  items,
  selectedItemId,
  setSelectedItemId,
  method,
  setMethod,
  quote,
  quoteLoading,
  onStart,
  loading,
  result,
  error,
  onPayRazorpay,
  verifyingPayment,
}) {
  if (!open) return null;

  const selectedItem =
    items.find((i) => Number(i.id) === Number(selectedItemId)) || items[0];
  const price = Number(selectedItem?.price || 0);
  const methodLabel = method === "razorpay" ? "Razorpay" : "UPI";
  const availableMethods = quote?.availableMethods || ["upi_direct"];

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.68)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "560px",
          borderRadius: "var(--radius-xl)",
          background: "var(--glass-bg-modal)",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          padding: "1.25rem",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.9rem",
          }}
        >
          <h3
            style={{
              color: "var(--text-primary)",
              fontSize: "1.05rem",
              fontWeight: 800,
            }}
          >
            Buy Now
          </h3>
          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            x
          </button>
        </div>

        {items.length > 1 && (
          <div style={{ marginBottom: "0.8rem" }}>
            <div
              style={{
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
                fontSize: "0.78rem",
              }}
            >
              Choose item
            </div>
            <select
              value={selectedItem?.id || ""}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                setSelectedItemId(nextId);
              }}
              style={{
                width: "100%",
                padding: "0.62rem 0.7rem",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "0.82rem",
              }}
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title} · Rs {Number(i.price).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{
            background: "var(--glass-bg-row)",
            border: "1px solid var(--glass-border-row)",
            borderRadius: "var(--radius-md)",
            padding: "0.8rem",
            marginBottom: "0.9rem",
          }}
        >
          <div
            style={{
              color: "var(--text-primary)",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            {selectedItem?.title}
          </div>
          <div
            style={{
              marginTop: "0.35rem",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
            }}
          >
            Price: Rs {price.toLocaleString("en-IN")}
          </div>
        </div>

        <div style={{ marginBottom: "0.9rem" }}>
          <div
            style={{
              color: "var(--text-secondary)",
              marginBottom: "0.45rem",
              fontSize: "0.78rem",
            }}
          >
            Payment route
          </div>
          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setMethod("upi_direct")}
              disabled={
                !availableMethods.includes("upi_direct") || loading || !!result
              }
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                border: `1px solid ${method === "upi_direct" ? "var(--border-accent)" : "var(--border)"}`,
                background:
                  method === "upi_direct"
                    ? "var(--accent-soft)"
                    : "var(--bg-card)",
                color:
                  method === "upi_direct"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                cursor: loading || result ? "not-allowed" : "pointer",
                opacity: availableMethods.includes("upi_direct") ? 1 : 0.45,
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              UPI
            </button>
            <button
              type="button"
              onClick={() => setMethod("razorpay")}
              disabled={
                !availableMethods.includes("razorpay") || loading || !!result
              }
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                border: `1px solid ${method === "razorpay" ? "var(--border-accent)" : "var(--border)"}`,
                background:
                  method === "razorpay"
                    ? "var(--accent-soft)"
                    : "var(--bg-card)",
                color:
                  method === "razorpay"
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                cursor: loading || result ? "not-allowed" : "pointer",
                opacity: availableMethods.includes("razorpay") ? 1 : 0.45,
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              Razorpay
            </button>
          </div>
        </div>

        <div
          style={{
            background: "var(--glass-bg-row)",
            border: "1px solid var(--glass-border-row)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem",
            marginBottom: "0.9rem",
            fontSize: "0.78rem",
          }}
        >
          {quoteLoading ? (
            <div style={{ color: "var(--text-muted)" }}>
              Calculating total...
            </div>
          ) : quote?.pricing ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Item subtotal</span>
                <span>
                  Rs{" "}
                  {Number(quote.pricing.subtotal || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Platform fee</span>
                <span>
                  Rs{" "}
                  {Number(quote.pricing.platformFee || 0).toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Payment fee</span>
                <span>
                  Rs{" "}
                  {Number(quote.pricing.paymentGatewayFee || 0).toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>GST on fees</span>
                <span>
                  Rs{" "}
                  {Number(quote.pricing.gstOnFees || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div
                style={{
                  marginTop: "0.45rem",
                  paddingTop: "0.45rem",
                  borderTop: "1px solid var(--glass-divider)",
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-primary)",
                  fontWeight: 800,
                }}
              >
                <span>Total payable</span>
                <span>
                  Rs{" "}
                  {Number(quote.pricing.totalPayable || 0).toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>
              <div
                style={{
                  marginTop: "0.35rem",
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                }}
              >
                Paying via: {methodLabel}
              </div>
            </>
          ) : (
            <div style={{ color: "var(--text-muted)" }}>
              Unable to load fee breakdown.
            </div>
          )}
        </div>

        <button
          onClick={onStart}
          disabled={loading || !!result}
          onMouseEnter={(e) => {
            if (!loading && !result) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-accent-lg)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              !loading && !result ? "var(--shadow-accent)" : "none";
          }}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-alt))",
            color: "white",
            fontWeight: 800,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            cursor: loading || result ? "not-allowed" : "pointer",
            boxShadow: !loading && !result ? "var(--shadow-accent)" : "none",
            opacity: loading || result ? 0.7 : 1,
            transform: "translateY(0)",
            transition: "all 0.3s ease",
          }}
        >
          {loading
            ? "Initializing..."
            : result
              ? "Checkout Started"
              : "Start Checkout"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.78rem",
              color: "var(--color-danger)",
              background: "var(--bg-danger)",
              border: "1px solid var(--bd-danger)",
              borderRadius: "10px",
              padding: "0.55rem 0.65rem",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "0.95rem",
              background: "var(--glass-bg-row)",
              border: "1px solid var(--glass-border-row)",
              borderRadius: "var(--radius-md)",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                color: "var(--text-primary)",
                fontWeight: 700,
                marginBottom: "0.5rem",
                fontSize: "0.84rem",
              }}
            >
              Checkout Initialized
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.76rem",
                marginBottom: "0.5rem",
              }}
            >
              Transaction #{result.transactionId} · Method:{" "}
              {result.paymentMethod === "upi_direct" ? "UPI" : "Razorpay"}
            </div>

            {result.qrCodeDataUrl && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "0.7rem",
                }}
              >
                <img
                  src={result.qrCodeDataUrl}
                  alt="Transaction QR"
                  style={{
                    width: "190px",
                    height: "190px",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            )}

            {!!result.pinCode && (
              <div
                style={{
                  color: "var(--text-primary)",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  letterSpacing: "2px",
                  marginBottom: "0.45rem",
                }}
              >
                PIN: {result.pinCode}
              </div>
            )}

            {result.upiIntent && (
              <a
                href={result.upiIntent}
                style={{
                  display: "inline-flex",
                  marginTop: "0.35rem",
                  color: "var(--accent-alt)",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                }}
              >
                Open UPI app
              </a>
            )}

            {result.paymentMethod === "razorpay" && result.razorpayOrder && (
              <button
                onClick={onPayRazorpay}
                disabled={verifyingPayment}
                onMouseEnter={(e) => {
                  if (!verifyingPayment) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-accent-lg)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = !verifyingPayment
                    ? "var(--shadow-accent)"
                    : "none";
                }}
                style={{
                  marginTop: "0.65rem",
                  width: "100%",
                  padding: "0.66rem",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  color: "white",
                  fontWeight: 800,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  cursor: verifyingPayment ? "not-allowed" : "pointer",
                  boxShadow: !verifyingPayment
                    ? "var(--shadow-accent)"
                    : "none",
                  opacity: verifyingPayment ? 0.7 : 1,
                  transform: "translateY(0)",
                  transition: "all 0.3s ease",
                }}
              >
                {verifyingPayment ? "Verifying..." : "Pay with Razorpay"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ──  Empty Cart Illustration ─────────────────────
function EmptyCartIllustration() {
  return (
    <>
      <style>{`
        @keyframes cartFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes cartGlow {
          0%, 100% { opacity: 0.5; transform: scaleX(1); }
          50%       { opacity: 1;   transform: scaleX(1.18); }
        }
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dashDrift {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -24; }
        }
        @keyframes orbitA {
          from { transform: rotate(0deg)   translateX(52px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
        }
        @keyframes orbitB {
          from { transform: rotate(180deg) translateX(40px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(40px) rotate(-540deg); }
        }
        @keyframes orbitC {
          from { transform: rotate(90deg)  translateX(62px) rotate(-90deg); }
          to   { transform: rotate(450deg) translateX(62px) rotate(-450deg); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes handleWiggle {
          0%,100% { transform: rotate(0deg); }
          20%  { transform: rotate(-8deg); }
          40%  { transform: rotate(6deg); }
          60%  { transform: rotate(-4deg); }
          80%  { transform: rotate(2deg); }
        }
      `}</style>

      {/* Outer wrapper — entrance fade */}
      <div
        style={{
          position: "relative",
          width: "160px",
          height: "160px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation:
            "fadeInScale 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both",
        }}
      >
        {/* Orbit particle A */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "orbitA 5s linear infinite",
            animationDelay: "0s",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-alt))",
              boxShadow: "0 0 8px rgba(var(--accent-rgb),0.7)",
            }}
          />
        </div>

        {/* Orbit particle B — smaller, slower */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "orbitB 7s linear infinite",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "rgba(var(--accent-rgb),0.55)",
              boxShadow: "0 0 5px rgba(var(--accent-rgb),0.4)",
            }}
          />
        </div>

        {/* Orbit particle C — tiny, fastest */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "orbitC 3.5s linear infinite",
          }}
        >
          <div
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "rgba(var(--accent-rgb),0.35)",
            }}
          />
        </div>

        {/* Floating cart group */}
        <div style={{ animation: "cartFloat 3s ease-in-out infinite" }}>
          {/* Glow shadow underneath */}
          <div
            style={{
              width: "72px",
              height: "10px",
              borderRadius: "50%",
              background: "rgba(var(--accent-rgb),0.25)",
              filter: "blur(8px)",
              margin: "0 auto",
              animation: "cartGlow 3s ease-in-out infinite",
              position: "relative",
              top: "4px",
            }}
          />

          <svg
            width="88"
            height="80"
            viewBox="0 0 88 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Handle with wiggle */}
            <g
              style={{
                transformOrigin: "56px 6px",
                animation: "handleWiggle 4s ease-in-out infinite",
              }}
            >
              <path
                d="M12 6H22L24 16"
                stroke="rgba(var(--accent-rgb),0.55)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Cart body */}
            <path
              d="M24 16H68L62 52H30L24 16Z"
              fill="rgba(var(--accent-rgb),0.06)"
              stroke="rgba(var(--accent-rgb),0.5)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Bottom rail */}
            <path
              d="M30 52H62"
              stroke="rgba(var(--accent-rgb),0.6)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Animated dashed empty lines inside cart */}
            <line
              x1="32"
              y1="28"
              x2="56"
              y2="28"
              stroke="rgba(var(--accent-rgb),0.22)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="5 4"
              style={{ animation: "dashDrift 1.8s linear infinite" }}
            />
            <line
              x1="33"
              y1="38"
              x2="54"
              y2="38"
              stroke="rgba(var(--accent-rgb),0.14)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="5 4"
              style={{
                animation: "dashDrift 1.8s linear infinite",
                animationDelay: "0.4s",
              }}
            />

            {/* Left wheel */}
            <g
              style={{
                transformOrigin: "34px 62px",
                animation: "wheelSpin 3s linear infinite",
              }}
            >
              <circle
                cx="34"
                cy="62"
                r="6"
                fill="rgba(var(--accent-rgb),0.08)"
                stroke="rgba(var(--accent-rgb),0.55)"
                strokeWidth="2"
              />
              <line
                x1="34"
                y1="58"
                x2="34"
                y2="66"
                stroke="rgba(var(--accent-rgb),0.4)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="30"
                y1="62"
                x2="38"
                y2="62"
                stroke="rgba(var(--accent-rgb),0.4)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>

            {/* Right wheel */}
            <g
              style={{
                transformOrigin: "58px 62px",
                animation: "wheelSpin 3s linear infinite",
                animationDirection: "reverse",
              }}
            >
              <circle
                cx="58"
                cy="62"
                r="6"
                fill="rgba(var(--accent-rgb),0.08)"
                stroke="rgba(var(--accent-rgb),0.55)"
                strokeWidth="2"
              />
              <line
                x1="58"
                y1="58"
                x2="58"
                y2="66"
                stroke="rgba(var(--accent-rgb),0.4)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="54"
                y1="62"
                x2="62"
                y2="62"
                stroke="rgba(var(--accent-rgb),0.4)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </g>

            {/* Sparkle top-right */}
            <g
              style={{
                animation: "handleWiggle 3s ease-in-out infinite",
                transformOrigin: "75px 10px",
              }}
            >
              <line
                x1="75"
                y1="7"
                x2="75"
                y2="13"
                stroke="rgba(var(--accent-rgb),0.55)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="72"
                y1="10"
                x2="78"
                y2="10"
                stroke="rgba(var(--accent-rgb),0.55)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}

function EmptyCartState({ onBrowse }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3.5rem 2rem",
        background: "var(--glass-bg)",
        borderRadius: "24px",
        border: "1px solid var(--border-hover)",
        position: "relative",
        overflow: "hidden",
        boxShadow:
          "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(var(--accent-rgb),0.2), transparent)",
        }}
      />
      <EmptyCartIllustration />
      <h3
        style={{
          margin: "0.5rem 0 0.35rem",
          fontSize: "1.05rem",
          fontWeight: "700",
          color: "var(--text-muted)",
          letterSpacing: "-0.3px",
          animation: "fadeInScale 0.5s ease 0.3s both",
        }}
      >
        Your cart is empty
      </h3>
      <p
        style={{
          margin: "0 0 1.75rem",
          fontSize: "0.8rem",
          color: "var(--text-ghost)",
          fontWeight: "500",
          animation: "fadeInScale 0.5s ease 0.45s both",
        }}
      >
        Find something you like and add it here
      </p>
      <button
        onClick={onBrowse}
        style={{
          padding: "0.62rem 1.6rem",
          background:
            "linear-gradient(135deg, var(--accent), var(--accent-alt))",
          color: "white",
          border: "none",
          borderRadius: "11px",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: "700",
          letterSpacing: "0.5px",
          boxShadow: "0 4px 16px rgba(var(--accent-rgb),0.28)",
          transition: "all 0.25s ease",
          animation: "fadeInScale 0.5s ease 0.6s both",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
          e.currentTarget.style.boxShadow =
            "0 8px 24px rgba(var(--accent-rgb),0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow =
            "0 4px 16px rgba(var(--accent-rgb),0.28)";
        }}
      >
        Browse Items →
      </button>
    </div>
  );
}

// ── Order Success Screen ──────────────────────────────────────
function OrderSuccessScreen({
  purchasedItems,
  totalPaid,
  onBrowse,
  onViewTransactions,
}) {
  const [show, setShow] = useState(false);
  const [ratings, setRatings] = useState({});
  const [hoverRatings, setHoverRatings] = useState({});
  const [comments, setComments] = useState({}); // comment text per itemId
  const [expanded, setExpanded] = useState({}); // whether the comment form is open
  const [submitted, setSubmitted] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    setTimeout(() => setShow(true), 80);
  }, []);

  async function submitReview(item) {
    const rating = ratings[item.itemId];
    if (!rating || !item.transactionId) return;
    setSubmitting((p) => ({ ...p, [item.itemId]: true }));
    try {
      const comment = comments[item.itemId]?.trim() || null;
      await API.post("/reviews", {
        transactionId: item.transactionId,
        rating,
        comment,
      });
      setSubmitted((p) => ({ ...p, [item.itemId]: rating }));
    } catch {
    } finally {
      setSubmitting((p) => ({ ...p, [item.itemId]: false }));
    }
  }

  const orderId = `ORD-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)",
      }}
    >
      <style>{`
        @keyframes checkPop { 0% { transform: scale(0) rotate(-15deg); opacity:0 } 60% { transform: scale(1.15) rotate(3deg); opacity:1 } 100% { transform: scale(1) rotate(0deg); opacity:1 } }
        @keyframes ringPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(81,207,102,0.4) } 50% { box-shadow: 0 0 0 16px rgba(81,207,102,0) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(81,207,102,0.2), rgba(64,192,87,0.1))",
            border: "2px solid rgba(81,207,102,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
            animation: show
              ? "checkPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both, ringPulse 2.5s ease 0.6s infinite"
              : "none",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#51cf66"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2
          style={{
            margin: "0 0 0.35rem",
            fontSize: "1.6rem",
            fontWeight: "900",
            letterSpacing: "-0.8px",
            color: "white",
            animation: show ? "fadeUp 0.4s ease 0.3s both" : "none",
          }}
        >
          Order Confirmed
        </h2>
        <p
          style={{
            margin: 0,
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            animation: show ? "fadeUp 0.4s ease 0.4s both" : "none",
          }}
        >
          Your purchase was successful
        </p>
      </div>

      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid var(--border-hover)",
          borderRadius: "20px",
          overflow: "hidden",
          marginBottom: "1.25rem",
          animation: show ? "fadeUp 0.4s ease 0.5s both" : "none",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(81,207,102,0.3), transparent)",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.1rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(81,207,102,0.04)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.58rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-ghost)",
                fontWeight: "700",
                marginBottom: "3px",
              }}
            >
              Order ID
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "700",
                color: "var(--text-secondary)",
                fontFamily: "monospace",
                letterSpacing: "1px",
              }}
            >
              {orderId}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.58rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-ghost)",
                fontWeight: "700",
                marginBottom: "3px",
              }}
            >
              Date
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                color: "var(--text-muted)",
              }}
            >
              {dateStr} · {timeStr}
            </div>
          </div>
        </div>
        <div style={{ padding: "0.75rem 1.5rem" }}>
          <div
            style={{
              fontSize: "0.58rem",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--text-ghost)",
              fontWeight: "700",
              marginBottom: "0.75rem",
            }}
          >
            {purchasedItems.length} Item{purchasedItems.length !== 1 ? "s" : ""}{" "}
            Purchased
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {purchasedItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.6rem 0.75rem",
                  background: "var(--bg-card)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background:
                        "linear-gradient(135deg, rgba(232,119,34,0.2), rgba(232,119,34,0.08))",
                      border: "1px solid rgba(232,119,34,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(232,119,34,0.8)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.83rem",
                        fontWeight: "600",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </div>
                    {item.category && (
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-ghost)",
                          marginTop: "1px",
                        }}
                      >
                        {item.category}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: "800",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    flexShrink: 0,
                    marginLeft: "0.75rem",
                  }}
                >
                  ₹{Number(item.price).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: "700",
              color: "var(--text-muted)",
              letterSpacing: "0.5px",
            }}
          >
            TOTAL PAID
          </span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "900",
              letterSpacing: "-0.5px",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-alt))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ₹{Number(totalPaid).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.75rem 1.1rem",
          background: "rgba(81,207,102,0.07)",
          border: "1px solid rgba(81,207,102,0.15)",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          animation: show ? "fadeUp 0.4s ease 0.65s both" : "none",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#51cf66",
            boxShadow: "0 0 8px rgba(81,207,102,0.6)",
            flexShrink: 0,
            animation: "ringPulse 2s ease infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            fontWeight: "500",
          }}
        >
          Payment confirmed · Check your transaction history for details
        </span>
      </div>

      {purchasedItems.some((i) => i.transactionId) && (
        <div
          style={{
            marginBottom: "1.25rem",
            animation: show ? "fadeUp 0.4s ease 0.7s both" : "none",
          }}
        >
          <div
            style={{
              fontSize: "0.62rem",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              fontWeight: "700",
              marginBottom: "0.75rem",
            }}
          >
            Rate your purchases
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            {purchasedItems
              .filter((i) => i.transactionId)
              .map((item) => (
                <div
                  key={item.itemId}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {/* ── Top row: title + stars ── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.65rem 1rem",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "600",
                        color: "var(--text-secondary)",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    {submitted[item.itemId] ? (
                      /* ── Submitted state ── */
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          flexShrink: 0,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={
                              s <= submitted[item.itemId]
                                ? "var(--accent)"
                                : "none"
                            }
                            stroke={
                              s <= submitted[item.itemId]
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
                            fontSize: "0.7rem",
                            color: "var(--accent)",
                            fontWeight: "700",
                            marginLeft: "0.25rem",
                          }}
                        >
                          Reviewed
                        </span>
                      </div>
                    ) : (
                      /* ── Interactive review form ── */
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          flexShrink: 0,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setRatings((p) => ({ ...p, [item.itemId]: s }));
                              setExpanded((p) => ({
                                ...p,
                                [item.itemId]: true,
                              }));
                            }}
                            onMouseEnter={() =>
                              setHoverRatings((p) => ({
                                ...p,
                                [item.itemId]: s,
                              }))
                            }
                            onMouseLeave={() =>
                              setHoverRatings((p) => ({
                                ...p,
                                [item.itemId]: 0,
                              }))
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "1px",
                              transition: "transform 0.1s",
                              transform:
                                (hoverRatings[item.itemId] ||
                                  ratings[item.itemId] ||
                                  0) >= s
                                  ? "scale(1.2)"
                                  : "scale(1)",
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill={
                                (hoverRatings[item.itemId] ||
                                  ratings[item.itemId] ||
                                  0) >= s
                                  ? "var(--accent)"
                                  : "none"
                              }
                              stroke={
                                (hoverRatings[item.itemId] ||
                                  ratings[item.itemId] ||
                                  0) >= s
                                  ? "var(--accent)"
                                  : "var(--text-ghost)"
                              }
                              strokeWidth="1.5"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* end top row */}
                  {/* ── Expanded comment form ── */}
                  {!submitted[item.itemId] && expanded[item.itemId] && (
                    <div
                      style={{
                        padding: "0 1rem 0.85rem",
                        borderTop: "1px solid var(--border)",
                        paddingTop: "0.75rem",
                      }}
                    >
                      {/* Rating recap + change stars */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          marginBottom: "0.6rem",
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setRatings((p) => ({ ...p, [item.itemId]: s }))
                            }
                            onMouseEnter={() =>
                              setHoverRatings((p) => ({
                                ...p,
                                [item.itemId]: s,
                              }))
                            }
                            onMouseLeave={() =>
                              setHoverRatings((p) => ({
                                ...p,
                                [item.itemId]: 0,
                              }))
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "1px",
                              transition: "transform 0.1s",
                              transform:
                                (hoverRatings[item.itemId] ||
                                  ratings[item.itemId] ||
                                  0) >= s
                                  ? "scale(1.15)"
                                  : "scale(1)",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill={
                                (hoverRatings[item.itemId] ||
                                  ratings[item.itemId] ||
                                  0) >= s
                                  ? "var(--accent)"
                                  : "none"
                              }
                              stroke={
                                (hoverRatings[item.itemId] ||
                                  ratings[item.itemId] ||
                                  0) >= s
                                  ? "var(--accent)"
                                  : "var(--text-ghost)"
                              }
                              strokeWidth="1.5"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                        ))}
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            marginLeft: "0.25rem",
                          }}
                        >
                          {
                            ["", "Poor", "Fair", "Good", "Great", "Excellent"][
                              ratings[item.itemId] || 0
                            ]
                          }
                        </span>
                      </div>
                      {/* Comment textarea */}
                      <textarea
                        value={comments[item.itemId] || ""}
                        onChange={(e) =>
                          setComments((p) => ({
                            ...p,
                            [item.itemId]: e.target.value,
                          }))
                        }
                        placeholder="Share your experience with this item... (optional)"
                        rows={3}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "0.6rem 0.75rem",
                          background: "var(--bg-input)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                          fontSize: "0.8rem",
                          fontFamily: "inherit",
                          resize: "vertical",
                          outline: "none",
                          lineHeight: "1.5",
                          transition: "border 0.2s",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "var(--accent-border)")
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = "var(--border)")
                        }
                      />
                      {/* Submit + skip */}
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        <button
                          onClick={() => submitReview(item)}
                          disabled={
                            submitting[item.itemId] || !ratings[item.itemId]
                          }
                          style={{
                            flex: 1,
                            padding: "0.55rem 0.75rem",
                            background: ratings[item.itemId]
                              ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                              : "var(--bg-card-hover)",
                            border: "none",
                            borderRadius: "8px",
                            color: ratings[item.itemId]
                              ? "white"
                              : "var(--text-ghost)",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            cursor:
                              ratings[item.itemId] && !submitting[item.itemId]
                                ? "pointer"
                                : "not-allowed",
                            transition: "all 0.2s",
                            boxShadow: ratings[item.itemId]
                              ? "0 3px 10px rgba(var(--accent-rgb),0.3)"
                              : "none",
                            fontFamily: "inherit",
                            opacity: submitting[item.itemId] ? 0.6 : 1,
                          }}
                        >
                          {submitting[item.itemId]
                            ? "Submitting…"
                            : "Submit Review"}
                        </button>
                        <button
                          onClick={() =>
                            setExpanded((p) => ({ ...p, [item.itemId]: false }))
                          }
                          style={{
                            padding: "0.55rem 0.75rem",
                            background: "none",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--text-muted)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor =
                              "var(--border-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor =
                              "var(--border)")
                          }
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          animation: show ? "fadeUp 0.4s ease 0.75s both" : "none",
        }}
      >
        <button
          onClick={onBrowse}
          style={{
            flex: 1,
            padding: "0.8rem",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-hover)",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "700",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-card-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-card)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          ← Continue Shopping
        </button>
        <button
          onClick={onViewTransactions}
          style={{
            flex: 1,
            padding: "0.8rem",
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-alt))",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "700",
            boxShadow: "0 4px 15px rgba(var(--accent-rgb),0.35)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(var(--accent-rgb),0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 15px rgba(var(--accent-rgb),0.35)";
          }}
        >
          View Transactions →
        </button>
      </div>
    </div>
  );
}

// ── Cart Item ─────────────────────────────────────────────────
function CartItem({ cartItem, onRemove, onQtyChange }) {
  const [removing, setRemoving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [updatingQty, setUpdatingQty] = useState(false);
  const navigate = useNavigate();
  const item = cartItem.item || cartItem;
  const status = item?.status?.toLowerCase();
  const isGuest = !cartItem.item;
  const currentQty = cartItem.quantity || 1;
  const maxQty = item?.quantity || 1;

  async function handleRemove() {
    try {
      setRemoving(true);
      if (!isGuest) await API.delete(`/cart/${item.id}`);
      onRemove(isGuest ? item.id : cartItem.id);
    } catch {
      alert("Failed to remove item.");
      setRemoving(false);
    }
  }

  async function handleQtyChange(newQty) {
    // If going below 1, treat as remove
    if (newQty < 1) {
      handleRemove();
      return;
    }
    if (newQty > maxQty || updatingQty) return;
    if (isGuest) {
      onQtyChange(item.id, newQty);
      return;
    }
    try {
      setUpdatingQty(true);
      await API.patch(`/cart/${item.id}`, { quantity: newQty });
      onQtyChange(cartItem.id, newQty);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update quantity.");
    } finally {
      setUpdatingQty(false);
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: hovered
          ? "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: hovered
          ? "1px solid var(--border-hover)"
          : "1px solid var(--border)",
        borderRadius: "16px",
        padding: "1.25rem 1.75rem",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
        opacity: removing ? 0.4 : 1,
        gap: "1rem",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
        }}
      />

      <div
        style={{ flex: 1, cursor: "pointer", minWidth: 0 }}
        onClick={() => navigate(`/items/${item.id}`)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            {item.title}
          </h3>
          {status && status !== "available" && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "20px",
                color: "#ff6b6b",
                background: "rgba(255,107,107,0.1)",
                border: "1px solid rgba(255,107,107,0.15)",
                whiteSpace: "nowrap",
              }}
            >
              No longer available
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: "800",
              fontSize: "1.1rem",
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-alt))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ₹
            {(item.price * currentQty).toLocaleString("en-IN", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </span>
          {currentQty > 1 && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-ghost)",
                fontWeight: "500",
              }}
            >
              ₹{Number(item.price).toLocaleString("en-IN")} × {currentQty}
            </span>
          )}
          <span
            style={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
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
            {item.category}
          </span>
          {item.subcategory && (
            <>
              <span style={{ color: "var(--text-ghost)", fontSize: "0.75rem" }}>
                ›
              </span>
              <span
                style={{
                  color: "var(--accent)",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  opacity: 0.55,
                }}
              >
                {item.subcategory}
              </span>
            </>
          )}
          {item.seller && (item.seller.firstName || item.seller.lastName) && (
            <>
              <span
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
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
                Sold by{" "}
                {`${item.seller.firstName || ""} ${item.seller.lastName || ""}`.trim()}
              </span>
            </>
          )}
        </div>
      </div>

      {maxQty > 1 && status === "available" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
            opacity: updatingQty ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <button
            onClick={() => handleQtyChange(currentQty - 1)}
            disabled={updatingQty}
            style={{
              width: "32px",
              height: "32px",
              background: "none",
              border: "none",
              color:
                currentQty === 1
                  ? "rgba(255,107,107,0.5)"
                  : "rgba(255,255,255,0.5)",
              cursor: updatingQty ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            −
          </button>
          <span
            style={{
              minWidth: "28px",
              textAlign: "center",
              color: "white",
              fontWeight: "700",
              fontSize: "0.85rem",
            }}
          >
            {currentQty}
          </span>
          <button
            onClick={() => handleQtyChange(currentQty + 1)}
            disabled={currentQty === maxQty || updatingQty}
            style={{
              width: "32px",
              height: "32px",
              background: "none",
              border: "none",
              color:
                currentQty === maxQty
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(232,119,34,0.7)",
              cursor: currentQty === maxQty ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            +
          </button>
        </div>
      )}

      <button
        onClick={handleRemove}
        disabled={removing}
        style={{
          padding: "0.4rem 1rem",
          background: "rgba(255,107,107,0.08)",
          color: "rgba(255,107,107,0.6)",
          border: "1px solid rgba(255,107,107,0.1)",
          borderRadius: "10px",
          cursor: removing ? "not-allowed" : "pointer",
          fontSize: "0.8rem",
          fontWeight: "600",
          transition: "all 0.3s ease",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,107,107,0.18)";
          e.currentTarget.style.color = "#ff6b6b";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,107,107,0.08)";
          e.currentTarget.style.color = "rgba(255,107,107,0.6)";
        }}
      >
        {removing ? "..." : "Remove"}
      </button>
    </div>
  );
}

// ── Cart Page ─────────────────────────────────────────────────
function Cart() {
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
      localStorage.removeItem("drag_backbtn_cart");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("drag_backbtn_cart"));
        if (saved)
          backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
      } catch {}
    }
  }, [draggable]);
  useEffect(() => {
    if (!draggable || !backRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem("drag_backbtn_cart"));
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
          localStorage.setItem("drag_backbtn_cart", JSON.stringify({ dx, dy }));
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
  const [cartItems, setCartItems] = useState([]);
  const [guestItems, setGuestItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [totalPaid, setTotalPaid] = useState("0");
  const [protectedCheckoutOpen, setProtectedCheckoutOpen] = useState(false);
  const [selectedProtectedItemId, setSelectedProtectedItemId] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState("upi_direct");
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [checkoutQuoteLoading, setCheckoutQuoteLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  useEffect(() => {
    if (!isLoggedIn) {
      setGuestItems(JSON.parse(localStorage.getItem("guestCart") || "[]"));
      setLoading(false);
      return;
    }
    const fetchCart = async () => {
      try {
        setLoading(true);
        const res = await API.get("/cart");
        setCartItems(res.data);
      } catch (err) {
        console.error("Failed to load cart", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  // ── Fire navbar badge update whenever cartItems changes ────
  useEffect(() => {
    if (!isLoggedIn) return;
    window.dispatchEvent(
      new CustomEvent("cart-updated", { detail: { count: cartItems.length } }),
    );
  }, [cartItems.length, isLoggedIn]);

  function handleRemove(id) {
    setCartItems((prev) => prev.filter((c) => c.id !== id));
    // badge update fires automatically via the useEffect above
  }

  function handleQtyChange(id, newQty) {
    setCartItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, quantity: newQty } : c)),
    );
  }

  function handleGuestRemove(itemId) {
    const updated = guestItems.filter((i) => i.id !== itemId);
    setGuestItems(updated);
    localStorage.setItem("guestCart", JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("cart-updated", { detail: { count: updated.length } }),
    );
  }

  function handleGuestQtyChange(itemId, newQty) {
    const updated = guestItems.map((i) =>
      i.id === itemId ? { ...i, cartQty: newQty } : i,
    );
    setGuestItems(updated);
    localStorage.setItem("guestCart", JSON.stringify(updated));
  }

  const availableItems = cartItems.filter(
    (c) => c.item?.status?.toLowerCase() === "available",
  );
  const unavailableItems = cartItems.filter(
    (c) => c.item?.status?.toLowerCase() !== "available",
  );
  const totalPrice = availableItems
    .reduce((sum, c) => sum + (c.item?.price || 0) * (c.quantity || 1), 0)
    .toFixed(2);
  const guestTotal = guestItems
    .reduce((sum, i) => sum + (i.price || 0) * (i.cartQty || 1), 0)
    .toFixed(2);

  const protectedItems = availableItems.map((c) => ({
    id: c.item?.id,
    title: c.item?.title,
    price: c.item?.price,
  }));

  async function loadRazorpayScript() {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  function handleOpenProtectedCheckout() {
    if (!protectedItems.length) return;
    const first = protectedItems[0];
    setSelectedProtectedItemId(first.id);
    setCheckoutMethod("upi_direct");
    setCheckoutQuote(null);
    setCheckoutSession(null);
    setCheckoutError("");
    setCheckoutResult(null);
    setProtectedCheckoutOpen(true);
  }

  useEffect(() => {
    if (!protectedCheckoutOpen || !selectedProtectedItemId || !!checkoutResult)
      return;

    const controller = new AbortController();

    async function fetchQuote() {
      setCheckoutQuoteLoading(true);
      try {
        const res = await API.post(
          "/transactions/quote",
          {
            itemId: selectedProtectedItemId,
            paymentMethod: checkoutMethod,
          },
          { signal: controller.signal },
        );

        setCheckoutQuote(res.data);
        setCheckoutSession(res.data?.checkoutSession || null);
        if (
          res.data?.paymentMethod &&
          res.data.paymentMethod !== checkoutMethod
        ) {
          setCheckoutMethod(res.data.paymentMethod);
        }
      } catch (err) {
        if (err.name === "CanceledError") return;
        setCheckoutError(
          err.response?.data?.error || "Failed to load checkout quote.",
        );
      } finally {
        setCheckoutQuoteLoading(false);
      }
    }

    fetchQuote();
    return () => controller.abort();
  }, [
    protectedCheckoutOpen,
    selectedProtectedItemId,
    checkoutMethod,
    checkoutResult,
  ]);

  async function handleStartProtectedCheckout() {
    const target = protectedItems.find(
      (x) => Number(x.id) === Number(selectedProtectedItemId),
    );
    if (!target?.id) return;
    const selectedMethod = checkoutQuote?.paymentMethod || checkoutMethod;
    setCheckoutMethod(selectedMethod);

    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await API.post("/transactions/checkout", {
        itemId: target.id,
        paymentMethod: selectedMethod,
        checkoutSessionId: checkoutSession?.id,
        idempotencyKey: checkoutSession?.idempotencyKey,
      });
      setCheckoutResult(res.data);
      setCartItems((prev) =>
        prev.filter((c) => Number(c.item?.id) !== Number(target.id)),
      );
    } catch (err) {
      if (err.response?.status === 409) {
        setCheckoutError(
          "Checkout already started for this item. Use the current QR and PIN shown below.",
        );
        return;
      }
      setCheckoutError(
        err.response?.data?.error || "Failed to initialize checkout.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePayWithRazorpay() {
    const target = protectedItems.find(
      (x) => Number(x.id) === Number(selectedProtectedItemId),
    );
    if (!checkoutResult?.razorpayOrder?.id || !checkoutResult?.razorpayKeyId) {
      setCheckoutError("Razorpay order details are missing.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setCheckoutError("Failed to load Razorpay checkout.");
      return;
    }

    const options = {
      key: checkoutResult.razorpayKeyId,
      amount: checkoutResult.razorpayOrder.amount,
      currency: checkoutResult.razorpayOrder.currency,
      name: "UniHaul",
      description: target?.title || "Item purchase",
      order_id: checkoutResult.razorpayOrder.id,
      handler: async function (response) {
        setVerifyingPayment(true);
        setCheckoutError("");
        try {
          await API.post("/transactions/razorpay/verify", {
            transactionId: checkoutResult.transactionId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setCheckoutResult((prev) =>
            prev
              ? {
                  ...prev,
                  paymentStatus: "paid",
                }
              : prev,
          );
        } catch (err) {
          setCheckoutError(
            err.response?.data?.error || "Payment verification failed.",
          );
        } finally {
          setVerifyingPayment(false);
        }
      },
      theme: { color: "#e87722" },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (resp) {
      setCheckoutError(
        resp?.error?.description ||
          "Razorpay payment failed. Please try again.",
      );
    });
    rzp.open();
  }

  async function handleCheckout() {
    if (
      !window.confirm(
        `Buy all ${availableItems.length} available item(s) for ₹${Number(totalPrice).toLocaleString("en-IN")}?`,
      )
    )
      return;
    try {
      setCheckingOut(true);
      const snapshot = availableItems.map((c) => ({
        title: c.item?.title,
        price: (c.item?.price * (c.quantity || 1)).toFixed(2),
        category: c.item?.category,
        itemId: c.item?.id,
      }));
      const checkoutRes = await API.post("/cart/checkout");
      const txns = checkoutRes.data?.transactions || [];
      const enriched = snapshot.map((s) => {
        const match = txns.find((t) => t.itemId === s.itemId);
        return { ...s, transactionId: match?.id || null };
      });
      setPurchasedItems(enriched);
      setTotalPaid(totalPrice);
      setCheckedOut(true);
      setCartItems([]);
      // Badge goes to 0 after checkout
      window.dispatchEvent(
        new CustomEvent("cart-updated", { detail: { count: 0 } }),
      );
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div
      className="cart-page"
      style={{ minHeight: "calc(100vh - 70px)", padding: "5rem 4rem 3rem" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <style>{`
        .cart-back-btn:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
          box-shadow: 0 0 8px 2px rgba(var(--accent-rgb),0.35) !important;
        }
        @media (min-width: 769px) {
          .cart-header { padding-left: 48px !important; }
        }
        @media (min-width: 1280px) {
          .cart-page { padding: 6rem 5rem 3rem !important; }
          .cart-header { padding-left: 56px !important; }
          .cart-back-btn { left: 0 !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .cart-page { padding: 4rem 2rem 3rem !important; }
          .cart-header { padding-left: 48px !important; }
          .cart-back-btn { left: 0 !important; }
          .cart-header h1 { font-size: 2.2rem !important; letter-spacing: -1.2px !important; }
        }
        @media (max-width: 768px) {
          .cart-page { padding: 3.5rem 1.25rem 3rem !important; }
          .cart-back-btn { position: relative !important; left: 0 !important; top: 0 !important; margin-bottom: 1rem !important; }
          .cart-header h1 { font-size: 2rem !important; letter-spacing: -1px !important; }
        }
        @media (max-width: 480px) {
          .cart-page { padding: 3rem 0.875rem 3rem !important; }
          .cart-header h1 { font-size: 1.6rem !important; }
        }
      `}</style>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        {!checkedOut && (
          <div
            className="cart-header"
            style={{ position: "relative", marginBottom: "2.5rem" }}
          >
            <button
              ref={backRef}
              onClick={() => navigate(-1)}
              onMouseDown={onBackMouseDown}
              onTouchStart={onBackTouchStart}
              className="cart-back-btn back-btn-circle"
              style={{
                position: "absolute",
                left: "0",
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
                zIndex: 2,
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
              My{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Cart.
              </span>
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                margin: 0,
                fontWeight: "400",
              }}
            >
              {isLoggedIn
                ? `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} in your cart`
                : `${guestItems.length} item${guestItems.length !== 1 ? "s" : ""} in your cart`}
            </p>
          </div>
        )}

        {/* Success screen */}
        {checkedOut && (
          <div style={{ maxWidth: "560px", margin: "2rem auto 0" }}>
            <OrderSuccessScreen
              purchasedItems={purchasedItems}
              totalPaid={totalPaid}
              onBrowse={() => navigate("/")}
              onViewTransactions={() => navigate("/transactions")}
            />
          </div>
        )}

        {/* Guest cart */}
        {!isLoggedIn &&
          !loading &&
          (guestItems.length === 0 ? (
            <EmptyCartState onBrowse={() => navigate("/")} />
          ) : (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "var(--text-ghost)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Items ({guestItems.length})
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {guestItems.map((item) => (
                    <CartItem
                      key={item.id}
                      cartItem={item}
                      onRemove={handleGuestRemove}
                      onQtyChange={handleGuestQtyChange}
                    />
                  ))}
                </div>
              </div>
              <div
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  margin: "1.5rem 0",
                }}
              />
              <div
                style={{
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "1.75rem",
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
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                    marginBottom: "1rem",
                  }}
                >
                  Order Summary
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                  >
                    {guestItems.length} item{guestItems.length !== 1 ? "s" : ""}
                  </span>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                    }}
                  >
                    ₹{Number(guestTotal).toLocaleString("en-IN")}
                  </span>
                </div>
                <div
                  style={{
                    height: "1px",
                    background: "var(--bg-card)",
                    margin: "1rem 0",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontWeight: "700",
                      fontSize: "1rem",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "900",
                      letterSpacing: "-1px",
                      background:
                        "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    ₹{Number(guestTotal).toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  onClick={() =>
                    navigate("/login", { state: { from: "/cart" } })
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-accent-lg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-accent)";
                  }}
                  style={{
                    width: "100%",
                    padding: "0.9rem",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(var(--accent-rgb),0.3)",
                    transform: "translateY(0)",
                  }}
                >
                  Sign In to Buy →
                </button>
                <p
                  style={{
                    textAlign: "center",
                    marginTop: "0.75rem",
                    color: "var(--text-ghost)",
                    fontSize: "0.75rem",
                  }}
                >
                  Your cart will be saved when you sign in
                </p>
              </div>
            </>
          ))}

        {/* Loading */}
        {isLoggedIn && !checkedOut && loading && (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(255,255,255,0.08)",
                borderTop: "3px solid var(--accent)",
                borderRadius: "50%",
                margin: "0 auto 1rem",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Loading cart...
            </p>
          </div>
        )}

        {/* Empty */}
        {isLoggedIn && !checkedOut && !loading && cartItems.length === 0 && (
          <EmptyCartState onBrowse={() => navigate("/")} />
        )}

        {/* Logged-in cart with items */}
        {isLoggedIn && !checkedOut && !loading && cartItems.length > 0 && (
          <>
            {availableItems.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "var(--text-ghost)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Available ({availableItems.length})
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {availableItems.map((c) => (
                    <CartItem
                      key={c.id}
                      cartItem={c}
                      onRemove={handleRemove}
                      onQtyChange={handleQtyChange}
                    />
                  ))}
                </div>
              </div>
            )}
            {unavailableItems.length > 0 && (
              <div style={{ marginBottom: "1.5rem", opacity: 0.6 }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "rgba(255,107,107,0.5)",
                    marginBottom: "0.75rem",
                  }}
                >
                  No Longer Available ({unavailableItems.length})
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {unavailableItems.map((c) => (
                    <CartItem
                      key={c.id}
                      cartItem={c}
                      onRemove={handleRemove}
                      onQtyChange={handleQtyChange}
                    />
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                margin: "1.5rem 0",
              }}
            />

            <div
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "1.75rem",
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
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                }}
              />
              <div
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontWeight: "700",
                  marginBottom: "1rem",
                }}
              >
                Order Summary
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
                >
                  {availableItems.length} item
                  {availableItems.length !== 1 ? "s" : ""}
                </span>
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                  }}
                >
                  ₹{Number(totalPrice).toLocaleString("en-IN")}
                </span>
              </div>
              <div
                style={{
                  height: "1px",
                  background: "var(--bg-card)",
                  margin: "1rem 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontWeight: "700",
                    fontSize: "1rem",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "900",
                    letterSpacing: "-1px",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ₹{Number(totalPrice).toLocaleString("en-IN")}
                </span>
              </div>
              <button
                onClick={() =>
                  navigate(
                    `/checkout${availableItems[0]?.item?.id ? `?itemId=${availableItems[0].item.id}` : ""}`,
                  )
                }
                disabled={checkingOut || availableItems.length === 0}
                onMouseEnter={(e) => {
                  if (!checkingOut && availableItems.length > 0) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-accent-lg)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    availableItems.length > 0 && !checkingOut
                      ? "var(--shadow-accent)"
                      : "none";
                }}
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  background:
                    checkingOut || availableItems.length === 0
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  color:
                    checkingOut || availableItems.length === 0
                      ? "rgba(255,255,255,0.25)"
                      : "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor:
                    checkingOut || availableItems.length === 0
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  transition: "all 0.3s ease",
                  boxShadow:
                    availableItems.length > 0 && !checkingOut
                      ? "var(--shadow-accent)"
                      : "none",
                  transform: "translateY(0)",
                }}
              >
                {checkingOut
                  ? "Processing..."
                  : `Buy Now — ₹${Number(totalPrice).toLocaleString("en-IN")}`}
              </button>
              {availableItems.length > 1 && (
                <p
                  style={{
                    textAlign: "center",
                    marginTop: "0.55rem",
                    color: "var(--text-muted)",
                    fontSize: "0.72rem",
                  }}
                >
                  Protected checkout currently processes one cart item at a
                  time.
                </p>
              )}
              {unavailableItems.length > 0 && (
                <p
                  style={{
                    textAlign: "center",
                    marginTop: "0.75rem",
                    color: "rgba(255,107,107,0.5)",
                    fontSize: "0.75rem",
                  }}
                >
                  {unavailableItems.length} item
                  {unavailableItems.length !== 1 ? "s" : ""} no longer available
                  will be skipped.
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <ProtectedCheckoutModal
        open={protectedCheckoutOpen}
        onClose={() => setProtectedCheckoutOpen(false)}
        items={protectedItems}
        selectedItemId={selectedProtectedItemId}
        setSelectedItemId={setSelectedProtectedItemId}
        method={checkoutMethod}
        setMethod={setCheckoutMethod}
        quote={checkoutQuote}
        quoteLoading={checkoutQuoteLoading}
        onStart={handleStartProtectedCheckout}
        loading={checkoutLoading}
        result={checkoutResult}
        error={checkoutError}
        onPayRazorpay={handlePayWithRazorpay}
        verifyingPayment={verifyingPayment}
      />
    </div>
  );
}

export default Cart;
