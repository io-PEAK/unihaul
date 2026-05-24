import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";

const PAYMENT_OPTIONS = [
  { value: "upi_direct", label: "UPI (Direct)" },
  { value: "razorpay_upi", label: "UPI (via Razorpay)" },
  { value: "razorpay_card", label: "Card (via Razorpay)" },
  { value: "razorpay_wallet", label: "Wallet (via Razorpay)" },
  { value: "razorpay_netbanking", label: "Netbanking (via Razorpay)" },
];

const CHECKOUT_PAYMENT_OPTION_KEY = "checkout_payment_option";

function CheckoutDropItem({
  label,
  active,
  disabled,
  isFirst,
  isLast,
  onSelect,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onSelect();
      }}
      style={{
        padding: "0.52rem 0.9rem",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "0.84rem",
        color: disabled
          ? "var(--text-muted)"
          : active || hovered
            ? "var(--dropdown-item-active)"
            : "var(--dropdown-item-text)",
        background: disabled
          ? "transparent"
          : active
            ? "var(--dropdown-item-active-bg)"
            : hovered
              ? "var(--dropdown-item-hover-bg)"
              : "transparent",
        borderTop: !isFirst ? "1px solid var(--dropdown-divider)" : "none",
        borderRadius: isLast ? "0 0 11px 11px" : "0",
        transition: "all 0.1s ease",
        fontWeight: active || hovered ? "600" : "400",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {active && !disabled ? (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <polyline
            points="1,6 4,9 11,3"
            stroke="var(--dropdown-item-active)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span style={{ width: "9px" }} />
      )}
      {label}
    </div>
  );
}

function CheckoutPaymentSelect({
  value,
  onChange,
  options,
  disabled,
  onOpenChange,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (onOpenChange) onOpenChange(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        style={{
          width: "100%",
          padding: "0.7rem 2.5rem 0.7rem 1rem",
          background: open ? "var(--select-bg-focus)" : "var(--select-bg)",
          border: open
            ? "1px solid var(--accent-border)"
            : "1px solid var(--select-border)",
          borderRadius: open ? "12px 12px 0 0" : "12px",
          color: value ? "var(--text-primary)" : "var(--select-placeholder)",
          fontSize: "0.9rem",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          textAlign: "left",
          boxSizing: "border-box",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedLabel}
        </span>
        <span
          style={{
            position: "absolute",
            right: "1rem",
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform 0.2s",
            pointerEvents: "none",
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            fill="var(--select-arrow)"
          >
            <path d="M8 11L3 6h10z" />
          </svg>
        </span>
      </button>

      {open && !disabled && (
        <div
          className="pi-dropdown"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 99999,
            background: "var(--dropdown-bg)",
            border: "1px solid var(--dropdown-border)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 20px 48px rgba(0,0,0,0.7)",
          }}
        >
          {options.map((opt, index) => (
            <CheckoutDropItem
              key={opt.value}
              label={opt.label}
              active={opt.value === value}
              disabled={opt.disabled}
              isFirst={index === 0}
              isLast={index === options.length - 1}
              onSelect={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function toBackendPaymentMethod(option) {
  return option === "upi_direct" ? "upi_direct" : "razorpay";
}

function toRazorpayMethodConfig(option) {
  if (option === "razorpay_card") {
    return { upi: false, card: true, wallet: false, netbanking: false };
  }
  if (option === "razorpay_wallet") {
    return { upi: false, card: false, wallet: true, netbanking: false };
  }
  if (option === "razorpay_netbanking") {
    return { upi: false, card: false, wallet: false, netbanking: true };
  }
  if (option === "razorpay_upi") {
    return { upi: true, card: false, wallet: false, netbanking: false };
  }
  return { upi: true, card: true, wallet: true, netbanking: true };
}

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [paymentOption, setPaymentOption] = useState(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_PAYMENT_OPTION_KEY);
      if (PAYMENT_OPTIONS.some((opt) => opt.value === saved)) {
        return saved;
      }
    } catch {
      // Ignore storage errors and keep default option.
    }
    return "upi_direct";
  });
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [result, setResult] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
  const [methodTransitioning, setMethodTransitioning] = useState(false);

  const quoteRequestRef = useRef(0);
  const previousPaymentOptionRef = useRef(null);

  const selectedItem = useMemo(
    () =>
      items.find((x) => Number(x.id) === Number(selectedItemId)) || items[0],
    [items, selectedItemId],
  );

  const backendPaymentMethod = toBackendPaymentMethod(paymentOption);
  const availableMethods = quote?.availableMethods || [
    "upi_direct",
    "razorpay",
  ];
  const razorpayAvailable = availableMethods.includes("razorpay");
  const paymentOptions = useMemo(
    () =>
      PAYMENT_OPTIONS.map((opt) => {
        const isRazorpayOption = opt.value !== "upi_direct";
        return {
          ...opt,
          disabled: isRazorpayOption && !razorpayAvailable,
          label:
            isRazorpayOption && !razorpayAvailable
              ? `${opt.label} (Unavailable)`
              : opt.label,
        };
      }),
    [razorpayAvailable],
  );

  useEffect(() => {
    if (!razorpayAvailable && paymentOption !== "upi_direct") {
      setPaymentOption("upi_direct");
    }
  }, [razorpayAvailable, paymentOption]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mediaQuery.matches);

    update();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    const previous = previousPaymentOptionRef.current;
    previousPaymentOptionRef.current = paymentOption;

    if (!previous || previous === paymentOption) return;

    if (!reduceMotion) {
      setMethodTransitioning(true);
      const transitionTimer = window.setTimeout(
        () => setMethodTransitioning(false),
        650,
      );
      return () => window.clearTimeout(transitionTimer);
    }

    setMethodTransitioning(false);
  }, [paymentOption, reduceMotion]);

  const quoteRefreshing = quoteLoading || methodTransitioning;

  useEffect(() => {
    try {
      localStorage.setItem(CHECKOUT_PAYMENT_OPTION_KEY, paymentOption);
    } catch {
      // Ignore storage errors; this should not block checkout.
    }
  }, [paymentOption]);

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const preselectedId = Number(search.get("itemId"));

    async function load() {
      try {
        setLoading(true);
        const res = await API.get("/cart");
        const available = (res.data || [])
          .filter((c) => c.item?.status?.toLowerCase() === "available")
          .map((c) => ({
            id: c.item?.id,
            title: c.item?.title,
            price: c.item?.price,
          }))
          .filter((x) => x.id);

        setItems(available);
        if (available.length === 0) {
          setCheckoutError("No available item in cart for checkout.");
          return;
        }

        if (
          preselectedId &&
          available.some((x) => Number(x.id) === preselectedId)
        ) {
          setSelectedItemId(preselectedId);
        } else {
          setSelectedItemId(available[0].id);
        }
      } catch (err) {
        setCheckoutError(
          err.response?.data?.error || "Failed to load checkout items.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [location.search]);

  useEffect(() => {
    if (!selectedItem?.id || !!result) return;

    const controller = new AbortController();
    const requestId = ++quoteRequestRef.current;

    async function loadQuote() {
      try {
        setQuoteLoading(true);
        setCheckoutError("");
        const res = await API.post(
          "/transactions/quote",
          {
            itemId: selectedItem.id,
            paymentMethod: backendPaymentMethod,
            idempotencyKey: session?.idempotencyKey,
          },
          { signal: controller.signal },
        );

        if (requestId !== quoteRequestRef.current) return;
        setQuote(res.data);
        setSession(res.data?.checkoutSession || null);
      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED" ||
          requestId !== quoteRequestRef.current
        )
          return;
        setCheckoutError(err.response?.data?.error || "Failed to fetch quote.");
      } finally {
        if (requestId === quoteRequestRef.current) {
          setQuoteLoading(false);
        }
      }
    }

    loadQuote();
    return () => controller.abort();
  }, [selectedItem?.id, backendPaymentMethod, result, session?.idempotencyKey]);

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

  async function startCheckout() {
    if (!selectedItem?.id) return;

    try {
      setCheckoutLoading(true);
      setCheckoutError("");
      const res = await API.post("/transactions/checkout", {
        itemId: selectedItem.id,
        paymentMethod: backendPaymentMethod,
        checkoutSessionId: session?.id,
        idempotencyKey: session?.idempotencyKey,
      });
      setResult(res.data);
      setSession(res.data?.checkoutSession || session);
    } catch (err) {
      setCheckoutError(
        err.response?.data?.error || "Failed to initialize checkout.",
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function payWithRazorpay() {
    if (!result?.razorpayOrder?.id || !result?.razorpayKeyId) {
      setCheckoutError("Razorpay order details are missing.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setCheckoutError("Failed to load Razorpay checkout.");
      return;
    }

    const options = {
      key: result.razorpayKeyId,
      amount: result.razorpayOrder.amount,
      currency: result.razorpayOrder.currency,
      name: "UniHaul",
      description: selectedItem?.title || "Item purchase",
      order_id: result.razorpayOrder.id,
      method: toRazorpayMethodConfig(paymentOption),
      handler: async (response) => {
        try {
          setVerifyingPayment(true);
          setCheckoutError("");
          await API.post("/transactions/razorpay/verify", {
            transactionId: result.transactionId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setResult((prev) =>
            prev ? { ...prev, paymentStatus: "paid" } : prev,
          );
        } catch (err) {
          setCheckoutError(
            err.response?.data?.error || "Payment verification failed.",
          );
        } finally {
          setVerifyingPayment(false);
        }
      },
      prefill: {},
      theme: { color: "#e87722" },
    };

    const rz = new window.Razorpay(options);
    rz.open();
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "5rem 1rem",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Loading checkout...
      </div>
    );
  }

  return (
    <div
      style={{ maxWidth: "820px", margin: "0 auto", padding: "5rem 1rem 3rem" }}
    >
      <style>
        {`@keyframes checkoutShimmer {0% {background-position: 200% 0;} 100% {background-position: -200% 0;}}
          @keyframes checkoutSpin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}
          .checkout-back-btn:hover {
            border-color: var(--accent) !important;
            color: var(--accent) !important;
            box-shadow: 0 0 8px 2px rgba(var(--accent-rgb),0.35) !important;
          }
          @media (min-width: 769px) {
            .checkout-header { padding-left: 48px !important; }
          }
          @media (max-width: 768px) {
            .checkout-back-btn {
              position: relative !important;
              left: 0 !important;
              top: 0 !important;
              margin-bottom: 1rem;
            }
          }`}
      </style>
      <div
        className="checkout-header"
        style={{ position: "relative", marginBottom: "1.6rem" }}
      >
        <button
          onClick={() => navigate("/cart")}
          className="checkout-back-btn back-btn-circle"
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
            cursor: "pointer",
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
            margin: 0,
            marginBottom: "0.35rem",
            fontSize: "2.5rem",
            fontWeight: "900",
            letterSpacing: "-1.4px",
            lineHeight: "1.06",
            color: "var(--text-primary)",
          }}
        >
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-alt))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Checkout.
          </span>
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--text-muted)",
            fontSize: "0.85rem",
          }}
        >
          Review your totals and complete payment securely.
        </p>
      </div>

      {checkoutError && (
        <div
          style={{
            marginBottom: "1rem",
            color: "#ff6b6b",
            border: "1px solid rgba(255,107,107,0.25)",
            borderRadius: "10px",
            padding: "0.65rem",
          }}
        >
          {checkoutError}
        </div>
      )}

      {selectedItem && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "1rem",
            marginBottom: "1rem",
            background: "var(--bg-card)",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            {selectedItem.title}
          </div>
          <div style={{ color: "var(--text-secondary)", marginTop: "0.35rem" }}>
            Item price: Rs{" "}
            {Number(selectedItem.price || 0).toLocaleString("en-IN")}
          </div>
        </div>
      )}

      <div
        style={{
          position: "relative",
          zIndex: paymentMenuOpen ? 30 : 2,
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1rem",
          marginBottom: "1rem",
          background: "var(--bg-card)",
        }}
      >
        <div
          style={{
            color: "var(--text-secondary)",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Pay with
        </div>
        <CheckoutPaymentSelect
          value={paymentOption}
          onChange={setPaymentOption}
          options={paymentOptions}
          disabled={checkoutLoading || !!result}
          onOpenChange={setPaymentMenuOpen}
        />
        {!razorpayAvailable && (
          <p
            style={{
              marginTop: "0.5rem",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
            }}
          >
            Razorpay options are unavailable right now. Using UPI (Direct).
          </p>
        )}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1rem",
          marginBottom: "1rem",
          background: "var(--bg-card)",
        }}
      >
        {quoteRefreshing ? (
          <div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.82rem",
                letterSpacing: "0.35px",
                marginBottom: "0.7rem",
              }}
            >
              Refreshing totals...
            </div>
            {["78%", "72%", "66%", "70%", "82%"].map((width, idx) => (
              <div
                key={idx}
                style={{
                  height: "11px",
                  width,
                  marginBottom: idx === 4 ? 0 : "0.6rem",
                  borderRadius: "999px",
                  backgroundImage:
                    "linear-gradient(90deg, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.06) 80%)",
                  backgroundSize: "220% 100%",
                  animation: reduceMotion
                    ? "none"
                    : "checkoutShimmer 1.8s cubic-bezier(0.25, 1, 0.5, 1) infinite",
                  opacity: reduceMotion ? 0.45 : 0.9,
                }}
              />
            ))}
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
                Rs {Number(quote.pricing.subtotal || 0).toLocaleString("en-IN")}
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
                {Number(quote.pricing.platformFee || 0).toLocaleString("en-IN")}
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
                marginTop: "0.4rem",
                paddingTop: "0.4rem",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 800,
                color: "var(--text-primary)",
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
          </>
        ) : (
          <div style={{ color: "var(--text-muted)" }}>Quote unavailable.</div>
        )}
      </div>

      <button
        onClick={startCheckout}
        disabled={
          checkoutLoading || !selectedItem || !!result || quoteRefreshing
        }
        onMouseEnter={(e) => {
          if (
            !(checkoutLoading || !selectedItem || !!result || quoteRefreshing)
          ) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "var(--shadow-accent-lg)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = !(
            checkoutLoading ||
            !selectedItem ||
            !!result ||
            quoteRefreshing
          )
            ? "var(--shadow-accent)"
            : "none";
        }}
        style={{
          width: "100%",
          padding: "0.9rem",
          borderRadius: "12px",
          border: "none",
          background:
            "linear-gradient(135deg, var(--accent), var(--accent-alt))",
          color: "white",
          fontWeight: 800,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          cursor:
            checkoutLoading || !!result || quoteRefreshing
              ? "not-allowed"
              : "pointer",
          opacity: checkoutLoading || !!result || quoteRefreshing ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          boxShadow: !(
            checkoutLoading ||
            !selectedItem ||
            !!result ||
            quoteRefreshing
          )
            ? "var(--shadow-accent)"
            : "none",
          transform: "translateY(0)",
          transition: "all 0.3s ease",
        }}
      >
        {quoteRefreshing && !checkoutLoading && (
          <span
            style={{
              width: "13px",
              height: "13px",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "rgba(255,255,255,0.95)",
              animation: reduceMotion
                ? "none"
                : "checkoutSpin 0.95s linear infinite",
            }}
          />
        )}
        {checkoutLoading
          ? "Processing..."
          : quoteRefreshing
            ? "Updating..."
            : "Checkout"}
      </button>

      {result && (
        <div
          style={{
            marginTop: "1rem",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "1rem",
            background: "var(--bg-card)",
          }}
        >
          <div
            style={{
              color: "var(--text-primary)",
              fontWeight: 700,
              marginBottom: "0.45rem",
            }}
          >
            Checkout Initialized
          </div>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            Transaction #{result.transactionId} · Method:{" "}
            {result.paymentMethod === "upi_direct" ? "UPI" : "Razorpay"}
          </div>

          {result.qrCodeDataUrl && (
            <div
              style={{
                width: "220px",
                height: "220px",
                position: "relative",
                margin: "0 auto 0.6rem",
              }}
            >
              <img
                src={result.qrCodeDataUrl}
                alt="Transaction QR"
                style={{
                  width: "220px",
                  height: "220px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  display: "block",
                }}
              />

              {result.paymentMethod === "upi_direct" && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "36px",
                    height: "36px",
                    transform: "translate(-50%, -50%)",
                    borderRadius: "11px",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                    border: "2px solid rgba(255,255,255,0.96)",
                    boxShadow:
                      "0 8px 18px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.08)",
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
                    stroke="white"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {result.upiIntent && (
            <a
              href={result.upiIntent}
              style={{ color: "var(--accent-alt)", fontWeight: 700 }}
            >
              Open UPI app
            </a>
          )}

          {result.paymentMethod === "razorpay" && result.razorpayOrder && (
            <button
              onClick={payWithRazorpay}
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
                marginTop: "0.75rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: "10px",
                border: "none",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                color: "white",
                fontWeight: 800,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                cursor: verifyingPayment ? "not-allowed" : "pointer",
                opacity: verifyingPayment ? 0.7 : 1,
                boxShadow: !verifyingPayment ? "var(--shadow-accent)" : "none",
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
  );
}

export default Checkout;
