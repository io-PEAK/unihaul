import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { connectSocket, getSocket } from "../socket";

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ open, onConfirm, onCancel, name }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        animation: "cdFadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes cdFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes cdSlideUp { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
      <div
        style={{
          width: "380px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-hover)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          animation: "cdSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
      >
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #ff6b6b, #ff8787)",
          }}
        />

        <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(255,107,107,0.10)",
              border: "1px solid rgba(255,107,107,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.1rem",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </div>

          <div
            style={{
              fontSize: "1rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
              marginBottom: "0.5rem",
            }}
          >
            Delete conversation?
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              lineHeight: "1.55",
            }}
          >
            Your conversation with{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              {name}
            </span>{" "}
            will be permanently removed from your inbox. This cannot be undone.
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "0 1.75rem",
          }}
        />

        <div
          style={{
            padding: "1.25rem 1.75rem",
            display: "flex",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.65rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border-hover)",
              borderRadius: "10px",
              color: "var(--text-secondary)",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
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
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.65rem",
              background: "rgba(255,107,107,0.12)",
              border: "1px solid rgba(255,107,107,0.25)",
              borderRadius: "10px",
              color: "#ff6b6b",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,107,107,0.22)";
              e.currentTarget.style.borderColor = "rgba(255,107,107,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,107,107,0.12)";
              e.currentTarget.style.borderColor = "rgba(255,107,107,0.25)";
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, size = 36, orange = false, src = null }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (src && !imgFailed)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          overflow: "hidden",
          border: orange ? "none" : "1px solid rgba(255,255,255,0.1)",
          boxShadow: orange
            ? "0 4px 12px rgba(var(--accent-rgb),0.35)"
            : "none",
        }}
      >
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: orange
          ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
          : "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))",
        border: orange ? "none" : "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: "800",
        color: "white",
        letterSpacing: "-0.5px",
        boxShadow: orange ? "0 4px 12px rgba(var(--accent-rgb),0.35)" : "none",
      }}
    >
      {initials}
    </div>
  );
}

// ── Conversation Item ─────────────────────────────────────────
function ConversationItem({
  convo,
  isActive,
  isSelected,
  selectMode,
  onClick,
  onSelect,
  isTyping,
}) {
  const [hovered, setHovered] = useState(false);
  const hasUnread = convo.unread_count > 0;
  const isProfileChat = convo.item_id === null || convo.item_id === undefined;

  return (
    <div
      onClick={() => (selectMode ? onSelect(convo.conversation_id) : onClick())}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "background 0.18s ease, border 0.18s ease",
        background: isSelected
          ? "rgba(var(--accent-rgb),0.14)"
          : isActive
            ? "var(--accent-soft)"
            : hovered
              ? "rgba(255,255,255,0.06)"
              : "transparent",
        border: isSelected
          ? "1px solid rgba(var(--accent-rgb),0.35)"
          : isActive
            ? "1px solid var(--accent-border)"
            : "1px solid transparent",
        marginBottom: "0.25rem",
        position: "relative",
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        height: "64px",
        boxSizing: "border-box",
      }}
    >
      {hasUnread && !isActive && !selectMode && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "55%",
            borderRadius: "0 3px 3px 0",
            background:
              "linear-gradient(180deg, var(--accent), var(--accent-alt))",
          }}
        />
      )}
      {selectMode && (
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "6px",
            border: isSelected ? "none" : "1.5px solid var(--border-hover)",
            background: isSelected ? "var(--accent)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {isSelected && (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
      <Avatar
        name={convo.other_user_name}
        size={38}
        orange={isActive && !selectMode}
        src={convo.other_user_avatar || null}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: hasUnread ? "800" : "600",
              color: isActive
                ? "var(--accent)"
                : hasUnread
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              letterSpacing: "-0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "130px",
            }}
          >
            {convo.other_user_name || "Unknown"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {/* Context Icon (Profile vs Item) */}
            <div
              style={{
                color: isActive ? "var(--accent)" : "var(--text-ghost)",
                display: "flex",
                alignItems: "center",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {isProfileChat ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              )}
            </div>
            {hasUnread && !isActive && !selectMode && (
              <div
                style={{
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  padding: "0 5px",
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.58rem",
                  fontWeight: "800",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {convo.unread_count > 9 ? "9+" : convo.unread_count}
              </div>
            )}
          </div>
        </div>
        {isTyping ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              marginTop: "0.3rem",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#a8c4a2",
                  animation: "typingDot 1.1s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>
        ) : convo.chat_request_status === "pending" &&
          convo.is_request_sender ? (
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--accent)",
              fontWeight: "600",
              marginTop: "0.2rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              opacity: 0.85,
            }}
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Waiting for acceptance
          </div>
        ) : (
          convo.last_message && (
            <div
              style={{
                fontSize: "0.72rem",
                color:
                  hasUnread && !isActive
                    ? "var(--text-secondary)"
                    : "var(--text-ghost)",
                fontWeight: hasUnread && !isActive ? "600" : "400",
                marginTop: "0.2rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {convo.last_message}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Item Card ─────────────────────────────────────────────────
function ItemCard({ convo, myId, onStatusChange }) {
  const navigate = useNavigate();
  const isSeller = convo.item_seller_id === myId;
  const status = convo.item_status?.toLowerCase() || "available";
  const [loading, setLoading] = useState(false);
  const [statusHovered, setStatusHovered] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [addHovered, setAddHovered] = useState(false);
  const [removeHovered, setRemoveHovered] = useState(false);
  const [cartCheckDone, setCartCheckDone] = useState(false);
  const [itemImage, setItemImage] = useState(convo.item_image || null);
  const [itemPrice, setItemPrice] = useState(convo.item_price ?? null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceVal, setPriceVal] = useState("");
  const [priceSaving, setPriceSaving] = useState(false);
  const priceInputRef = useRef(null);

  useEffect(() => {
    setItemImage(convo.item_image || null);
  }, [convo.item_id]);

  const isSold = status === "sold";
  const isPending = status === "pending";
  const isAvailable = status === "available";
  const showPendingHint = isSeller && isAvailable && statusHovered && !loading;
  const showAvailHint = isSeller && isPending && statusHovered && !loading;
  const statusColor = isSold ? "#ff6b6b" : isPending ? "#ffd43b" : "#51cf66";
  const statusBg = isSold
    ? "rgba(255,107,107,0.1)"
    : isPending
      ? "rgba(255,212,59,0.1)"
      : "rgba(81,207,102,0.1)";
  const statusLabel = isSold ? "Sold" : isPending ? "Pending" : "Available";
  const hoverColor = showPendingHint
    ? "#ffd43b"
    : showAvailHint
      ? "#51cf66"
      : statusColor;
  const hoverBg = showPendingHint
    ? "rgba(255,212,59,0.14)"
    : showAvailHint
      ? "rgba(81,207,102,0.14)"
      : statusBg;
  const hoverLabel = showPendingHint
    ? "Mark Pending"
    : showAvailHint
      ? "Mark Available"
      : statusLabel;

  useEffect(() => {
    if (!convo.item_id) return;
    API.get(`/items/${convo.item_id}`)
      .then((res) => {
        const imgs = res.data?.images;
        if (imgs?.length) setItemImage(imgs[0]);
        if (res.data?.price != null) setItemPrice(res.data.price);
      })
      .catch(() => {});
  }, [convo.item_id]); // eslint-disable-line

  useEffect(() => {
    if (isSeller || !convo.item_id || !isAvailable) return;
    setCartCheckDone(false);
    setInCart(false);
    setCartError("");
    API.get("/cart")
      .then((res) => {
        setInCart(
          (res.data || []).some(
            (ci) =>
              ci.itemId === convo.item_id || ci.item?.id === convo.item_id,
          ),
        );
      })
      .catch(() => {})
      .finally(() => setCartCheckDone(true));
  }, [convo.item_id, isSeller, status]); // eslint-disable-line

  async function handleAddToCart() {
    if (cartLoading || inCart) return;
    setCartError("");
    try {
      setCartLoading(true);
      await API.post("/cart", { itemId: convo.item_id, quantity: 1 });
      setInCart(true);
      const cartRes = await API.get("/cart");
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: { count: cartRes.data.length },
        }),
      );
    } catch (err) {
      setCartError(err?.response?.data?.error || "Could not add to cart");
      setTimeout(() => setCartError(""), 4000);
    } finally {
      setCartLoading(false);
    }
  }

  async function handleRemoveFromCart() {
    if (cartLoading || !inCart) return;
    setCartError("");
    try {
      setCartLoading(true);
      await API.delete(`/cart/${convo.item_id}`);
      setInCart(false);
      const cartRes = await API.get("/cart");
      window.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: { count: cartRes.data.length },
        }),
      );
    } catch (err) {
      setCartError(err?.response?.data?.error || "Could not remove from cart");
      setTimeout(() => setCartError(""), 4000);
    } finally {
      setCartLoading(false);
    }
  }

  async function toggleStatus() {
    if (!isSeller || isSold || loading) return;
    try {
      setLoading(true);
      const newStatus = isPending ? "available" : "pending";
      await API.patch(`/items/${convo.item_id}/status`, { status: newStatus });
      onStatusChange(newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setLoading(false);
    }
  }

  function startEditPrice() {
    setPriceVal(itemPrice != null ? String(itemPrice) : "");
    setEditingPrice(true);
    setTimeout(() => priceInputRef.current?.focus(), 60);
  }

  async function savePrice() {
    const num = parseFloat(priceVal);
    if (isNaN(num) || num < 0) {
      setEditingPrice(false);
      return;
    }
    try {
      setPriceSaving(true);
      await API.put(`/items/${convo.item_id}`, { price: num });
      setItemPrice(num);
    } catch (err) {
      console.error("Failed to update price", err);
    } finally {
      setPriceSaving(false);
      setEditingPrice(false);
    }
  }

  const pillBase = {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.28rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "700",
    letterSpacing: "0.2px",
    cursor: "pointer",
    transition: "all 0.18s ease",
    border: "none",
    outline: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        margin: "0 1.5rem",
        padding: "0.65rem 1rem",
        background: "var(--glass-bg-row)",
        border: "1px solid var(--glass-border-row)",
        borderRadius: "14px",
      }}
    >
      <style>{`@keyframes mspin { to { transform: rotate(360deg) } }`}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            onClick={() =>
              isSeller
                ? navigate(
                    `/dashboard?tab=${status === "available" ? "active" : status}`,
                  )
                : navigate(`/items/${convo.item_id}`)
            }
            title={isSeller ? "Go to Dashboard" : "View Item"}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "9px",
              overflow: "hidden",
              flexShrink: 0,
              background: "var(--bg-card)",
              border: "1px solid var(--border-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.75";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {itemImage ? (
              <img
                src={itemImage}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "0.58rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--text-ghost)",
                fontWeight: "700",
                marginBottom: "0.1rem",
              }}
            >
              Item
            </div>
            <div
              onClick={() =>
                isSeller
                  ? navigate(
                      `/dashboard?tab=${status === "available" ? "active" : status}`,
                    )
                  : navigate(`/items/${convo.item_id}`)
              }
              style={{
                fontSize: "0.88rem",
                fontWeight: "700",
                color: "var(--accent)",
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {convo.item_title || "Item"}
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <div
              style={{
                marginTop: "0.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {editingPrice ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      fontWeight: "700",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    min="0"
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePrice();
                      if (e.key === "Escape") setEditingPrice(false);
                    }}
                    onBlur={savePrice}
                    style={{
                      width: "72px",
                      padding: "0.15rem 0.4rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: "var(--bg-card-hover)",
                      border: "1px solid var(--accent-border)",
                      borderRadius: "6px",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  {priceSaving && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        border: "1.5px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "mspin 0.6s linear infinite",
                      }}
                    />
                  )}
                </div>
              ) : (
                <div
                  onClick={isSeller && !isSold ? startEditPrice : undefined}
                  title={
                    isSeller && !isSold ? "Click to edit price" : undefined
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    cursor: isSeller && !isSold ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => {
                    if (isSeller && !isSold)
                      e.currentTarget.querySelector(".edit-icon")?.style &&
                        (e.currentTarget.querySelector(
                          ".edit-icon",
                        ).style.opacity = "1");
                  }}
                  onMouseLeave={(e) => {
                    if (isSeller && !isSold)
                      e.currentTarget.querySelector(".edit-icon")?.style &&
                        (e.currentTarget.querySelector(
                          ".edit-icon",
                        ).style.opacity = "0");
                  }}
                >
                  {itemPrice != null ? (
                    <>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          fontWeight: "700",
                        }}
                      >
                        ₹
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {Number(itemPrice).toLocaleString("en-IN")}
                      </span>
                      {isSeller && !isSold && (
                        <svg
                          className="edit-icon"
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{ opacity: 0, transition: "opacity 0.15s" }}
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      )}
                    </>
                  ) : isSeller && !isSold ? (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-ghost)",
                        fontWeight: "500",
                        fontStyle: "italic",
                      }}
                    >
                      set price
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          {isSeller && !isSold ? (
            <button
              onClick={toggleStatus}
              disabled={loading}
              onMouseEnter={() => setStatusHovered(true)}
              onMouseLeave={() => setStatusHovered(false)}
              style={{
                ...pillBase,
                background: hoverBg,
                border: `1px solid ${hoverColor}40`,
                color: hoverColor,
                opacity: loading ? 0.6 : 1,
                minWidth: "90px",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "1.5px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "mspin 0.6s linear infinite",
                    }}
                  />
                  Updating
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: hoverColor,
                      boxShadow: `0 0 5px ${hoverColor}`,
                      flexShrink: 0,
                    }}
                  />
                  {hoverLabel}
                </>
              )}
            </button>
          ) : (
            <div
              style={{
                ...pillBase,
                cursor: "default",
                background: statusBg,
                border: `1px solid ${statusColor}40`,
                color: statusColor,
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: statusColor,
                  boxShadow: `0 0 5px ${statusColor}`,
                  flexShrink: 0,
                }}
              />
              {statusLabel}
            </div>
          )}
          {!isSeller && cartCheckDone && isAvailable && !inCart && (
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              onMouseEnter={() => setAddHovered(true)}
              onMouseLeave={() => setAddHovered(false)}
              style={{
                ...pillBase,
                background: addHovered
                  ? "rgba(139,92,246,0.22)"
                  : "rgba(139,92,246,0.10)",
                border: `1px solid rgba(139,92,246,${addHovered ? "0.6" : "0.3"})`,
                color: "#c4b5fd",
                opacity: cartLoading ? 0.6 : 1,
              }}
            >
              {cartLoading ? (
                <>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "1.5px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "mspin 0.6s linear infinite",
                    }}
                  />
                  Adding...
                </>
              ) : (
                <>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          )}
          {!isSeller && cartCheckDone && isAvailable && inCart && (
            <button
              onClick={handleRemoveFromCart}
              disabled={cartLoading}
              onMouseEnter={() => setRemoveHovered(true)}
              onMouseLeave={() => setRemoveHovered(false)}
              style={{
                ...pillBase,
                background: removeHovered
                  ? "rgba(255,107,107,0.14)"
                  : "rgba(255,107,107,0.06)",
                border: `1px solid rgba(255,107,107,${removeHovered ? "0.45" : "0.2"})`,
                color: removeHovered ? "#ffa8a8" : "#ff8787",
                opacity: cartLoading ? 0.6 : 1,
              }}
            >
              {cartLoading ? (
                <>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "1.5px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "mspin 0.6s linear infinite",
                    }}
                  />
                  Removing...
                </>
              ) : (
                <>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                  Remove
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {cartError && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.35rem 0.8rem",
            background: "rgba(255,107,107,0.07)",
            border: "1px solid rgba(255,107,107,0.18)",
            borderRadius: "8px",
            fontSize: "0.72rem",
            color: "#ff8787",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {cartError}
        </div>
      )}
    </div>
  );
}

// ── Main Messages ─────────────────────────────────────────────
function Messages() {
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
      localStorage.removeItem("drag_backbtn_msgs");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("drag_backbtn_msgs"));
        if (saved)
          backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`;
      } catch {}
    }
  }, [draggable]);
  useEffect(() => {
    if (!draggable || !backRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem("drag_backbtn_msgs"));
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
          localStorage.setItem("drag_backbtn_msgs", JSON.stringify({ dx, dy }));
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

  const location = useLocation();
  const incomingItem = location.state?.item;

  // ── State ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("chats");
  const [chatRequests, setChatRequests] = useState([]);
  const chatRequestsRef = useRef([]); // mirror for socket handlers
  const [respondingId, setRespondingId] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const fetchTick = useRef(0); // increments on every convo click → forces useEffect to re-run
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [newConvoMode, setNewConvoMode] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "ember",
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [mobShowChat, setMobShowChat] = useState(false);

  // Keep ref in sync so socket handlers can read latest chatRequests without stale closure
  useEffect(() => {
    chatRequestsRef.current = chatRequests;
  }, [chatRequests]);

  // ── Socket / presence state ────────────────────────────────
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState(new Set());
  const typingEmitRef = useRef(false);
  const typingEmitTimeoutRef = useRef(null);
  const typingClearTimeoutRef = useRef(null);
  const typingTimersRef = useRef({});

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setTheme(document.documentElement.dataset.theme || "ember"),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const msgInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const myId = user?.id;
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // helper to dedupe conversation list by key (latest wins)
  const setConvosDedupe = useCallback((list) => {
    const map = new Map();
    list.forEach((c) => map.set(c.conversation_id, c));
    setConversations(Array.from(map.values()));
  }, []);

  // ── Socket listeners ───────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const socket = connectSocket(myId);

    socket.on("online-list", ({ userIds }) => {
      if (activeConvo?.other_user_id)
        setOtherUserOnline(userIds.includes(String(activeConvo.other_user_id)));
    });
    if (activeConvo?.other_user_id) {
      if (socket.connected) socket.emit("get-online-list");
      else socket.once("connect", () => socket.emit("get-online-list"));
    }
    socket.on("user-online", ({ userId }) => {
      if (activeConvo && String(userId) === String(activeConvo.other_user_id))
        setOtherUserOnline(true);
    });
    socket.on("user-offline", ({ userId }) => {
      if (activeConvo && String(userId) === String(activeConvo.other_user_id))
        setOtherUserOnline(false);
    });
    socket.on("typing-start", ({ fromUserId }) => {
      if (
        activeConvo &&
        String(fromUserId) === String(activeConvo.other_user_id)
      ) {
        setOtherUserTyping(true);
        clearTimeout(typingClearTimeoutRef.current);
        typingClearTimeoutRef.current = setTimeout(
          () => setOtherUserTyping(false),
          2000,
        );
      }
      setTypingUserIds((prev) => {
        const s = new Set(prev);
        s.add(String(fromUserId));
        return s;
      });
      clearTimeout(typingTimersRef.current[fromUserId]);
      typingTimersRef.current[fromUserId] = setTimeout(() => {
        setTypingUserIds((prev) => {
          const s = new Set(prev);
          s.delete(String(fromUserId));
          return s;
        });
      }, 2000);
    });
    socket.on("typing-stop", ({ fromUserId }) => {
      if (
        activeConvo &&
        String(fromUserId) === String(activeConvo.other_user_id)
      ) {
        clearTimeout(typingClearTimeoutRef.current);
        setOtherUserTyping(false);
      }
      clearTimeout(typingTimersRef.current[fromUserId]);
      setTypingUserIds((prev) => {
        const s = new Set(prev);
        s.delete(String(fromUserId));
        return s;
      });
    });
    socket.on("request-accepted", ({ requestId, itemId, seller }) => {
      setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
      API.get("/messages/conversations")
        .then((res) => {
          setConvosDedupe(res.data);
          setSidebarTab("chats");
          const itemKey = `${itemId ?? "null"}-${seller?.id}`;
          const accepted = res.data.find(
            (c) =>
              c.conversation_id === itemKey &&
              c.chat_request_status === "accepted",
          );
          if (accepted) {
            setActiveConvo(accepted);
          }
        })
        .catch(() => {});
    });
    socket.on("request-declined", ({ requestId }) => {
      setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
      setConversations((prev) =>
        prev.filter((c) => c.chat_request_id !== requestId),
      );
      if (activeConvo?.chat_request_id === requestId) {
        setActiveConvo(null);
        setMessages([]);
      }
    });
    socket.on("new-chat-request", (req) => {
      setChatRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
      setSidebarTab("requests");
    });
    socket.on("new-message", (msg) => {
      const isActiveConvo =
        activeConvo &&
        msg.itemId === activeConvo.item_id &&
        (String(msg.senderId) === String(activeConvo.other_user_id) ||
          String(msg.senderId) === String(myId));

      if (isActiveConvo) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          return next.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
          );
        });
        setConversations((prev) =>
          prev.map((c) =>
            String(c.other_user_id) === String(activeConvo.other_user_id) &&
            c.item_id === activeConvo.item_id
              ? {
                  ...c,
                  unread_count: 0,
                  last_message: msg.content,
                  last_message_at: msg.createdAt,
                }
              : c,
          ),
        );
        if (activeConvo.isNew) {
          API.get("/messages/conversations")
            .then((res) => {
              setConvosDedupe(res.data);
              const real =
                res.data.find(
                  (c) =>
                    c.conversation_id === activeConvo.conversation_id &&
                    !c.isNew,
                ) ||
                res.data.find(
                  (c) =>
                    String(c.other_user_id) ===
                      String(activeConvo.other_user_id) &&
                    String(c.item_id ?? "null") ===
                      String(activeConvo.item_id ?? "null") &&
                    !c.isNew,
                );
              if (real) setActiveConvo(real);
            })
            .catch(() => {});
        } else {
          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.conversation_id === activeConvo.conversation_id
                ? {
                    ...c,
                    last_message: msg.content,
                    last_message_at: msg.createdAt,
                  }
                : c,
            );
            const idx = updated.findIndex(
              (c) => c.conversation_id === activeConvo.conversation_id,
            );
            if (idx > 0) {
              const [m] = updated.splice(idx, 1);
              return [m, ...updated];
            }
            return updated;
          });
        }
        if (String(msg.senderId) === String(activeConvo.other_user_id)) {
          API.post("/messages/mark-convo-read", {
            itemId: msg.itemId,
            otherUserId: msg.senderId,
          }).catch(() => {});
        }
      } else if (String(msg.receiverId) === String(myId)) {
        setConversations((prev) => {
          const updated = prev.map((c) =>
            String(c.other_user_id) === String(msg.senderId) &&
            c.item_id === (msg.itemId ?? null)
              ? {
                  ...c,
                  unread_count: (c.unread_count || 0) + 1,
                  last_message: msg.content,
                  last_message_at: msg.createdAt,
                }
              : c,
          );
          const idx = updated.findIndex(
            (c) =>
              String(c.other_user_id) === String(msg.senderId) &&
              c.item_id === (msg.itemId ?? null),
          );
          if (idx > 0) {
            const [m] = updated.splice(idx, 1);
            return [m, ...updated];
          }
          return updated;
        });
      }
    });
    return () => {
      socket.off("online-list");
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("typing-start");
      socket.off("typing-stop");
      socket.off("request-accepted");
      socket.off("request-declined");
      socket.off("new-chat-request");
      socket.off("new-message");
      clearTimeout(typingClearTimeoutRef.current);
      clearTimeout(typingEmitTimeoutRef.current);
    };
  }, [myId, activeConvo?.other_user_id, activeConvo?.item_id, setConvosDedupe]); // eslint-disable-line

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token]);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConvos(true);
        const res = await API.get("/messages/conversations");
        setConvosDedupe(res.data);
        if (incomingItem) {
          const existing = res.data.find(
            (c) =>
              c.item_id === incomingItem.id || c.itemId === incomingItem.id,
          );
          if (existing) {
            setActiveConvo(existing);
            setNewConvoMode(false);
          } else {
            setNewConvoMode(true);
            setActiveConvo({
              item_id: incomingItem.id,
              item_title: incomingItem.title,
              item_status: incomingItem.status || "available",
              item_seller_id: incomingItem.seller?.id,
              item_image: incomingItem.images?.[0] || null,
              other_user_name:
                `${incomingItem.seller?.firstName} ${incomingItem.seller?.lastName}`.trim() ||
                "Seller",
              other_user_id: incomingItem.seller?.id,
              other_user_avatar: incomingItem.seller?.avatar || null,
              isNew: true,
              chat_request_status: null,
              chat_request_id: null,
              is_request_sender: false,
            });
          }
        } else if (res.data.length === 1) {
          setActiveConvo(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setLoadingConvos(false);
      }
    };
    fetchConversations();

    API.get("/chat-requests")
      .then((res) => {
        setChatRequests(
          res.data?.received?.filter((r) => r.status === "pending") || [],
        );
      })
      .catch(() => {});
  }, [incomingItem, setConvosDedupe]);

  useEffect(() => {
    if (activeConvo?.item_id && activeConvo?.other_user_id) {
      window.__activeConvoKey = `${activeConvo.item_id}-${activeConvo.other_user_id}`;
    } else {
      window.__activeConvoKey = null;
    }
    return () => {
      window.__activeConvoKey = null;
    };
  }, [activeConvo?.item_id, activeConvo?.other_user_id]);

  useEffect(() => {
    if (!activeConvo) return;
    if (activeConvo.isNew && !activeConvo.chat_request_id) return;
    const fetchMessages = async () => {
      try {
        // Only show loading spinner if we have no messages yet — otherwise keep showing old ones
        if (messages.length === 0) setLoadingMessages(true);
        const itemIdParam = activeConvo.item_id ?? "null";
        const res = await API.get(`/messages/${itemIdParam}`, {
          params: { otherUserId: activeConvo.other_user_id },
        });
        const sorted = [...res.data].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
        setMessages(sorted);
        setConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === activeConvo.conversation_id
              ? { ...c, unread_count: 0 }
              : c,
          ),
        );
        if (sorted.length > 0 && activeConvo.isNew) {
          setActiveConvo((prev) => (prev ? { ...prev, isNew: false } : prev));
        }
        await API.post("/messages/mark-convo-read", {
          itemId: activeConvo.item_id,
          otherUserId: activeConvo.other_user_id,
        }).catch(() => {});
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
    // fetchTick added so clicking the same convo again always re-fetches
  }, [
    activeConvo?.conversation_id,
    activeConvo?.chat_request_status,
    fetchTick.current,
  ]); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (activeConvo) setTimeout(() => msgInputRef.current?.focus(), 100);
  }, [activeConvo?.conversation_id, activeConvo?.item_id]);

  async function handleMarkAllRead() {
    try {
      setMarkingRead(true);
      await API.post("/messages/mark-all-read");
      setConversations((prev) => prev.map((c) => ({ ...c, unread_count: 0 })));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingRead(false);
    }
  }

  function handleStatusChange(newStatus) {
    setActiveConvo((prev) => ({ ...prev, item_status: newStatus }));
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === activeConvo?.conversation_id
          ? { ...c, item_status: newStatus }
          : c,
      ),
    );
  }

  async function handleRespondRequest(id, status) {
    setRespondingId(id);
    const req = activeRequest;
    try {
      await API.patch(`/chat-requests/${id}`, { status });
      setChatRequests((prev) => {
        const remaining = prev.filter((r) => r.id !== id);
        if (remaining.length === 0) setSidebarTab("chats");
        return remaining;
      });
      setActiveRequest(null);

      if (status === "accepted") {
        setSidebarTab("chats");
        setMobShowChat(false);
        const convosRes = await API.get("/messages/conversations");
        setConvosDedupe(convosRes.data);
        const itemKey = `${req?.itemId ?? "null"}-${req?.sender?.id}`;
        const accepted = convosRes.data.find(
          (c) =>
            c.conversation_id === itemKey &&
            c.chat_request_status === "accepted",
        );
        if (accepted) {
          setActiveConvo(accepted);
        }
      }
    } catch (err) {
      console.error(
        "Failed to respond to request:",
        err?.response?.data || err,
      );
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!confirmTarget) return;
    if (confirmTarget === "bulk") {
      await handleDeleteSelected();
      setConfirmTarget(null);
      return;
    }
    try {
      setDeleting(true);
      const itemIdParam = confirmTarget.item_id ?? "null";
      await API.delete(
        `/messages/conversation/${itemIdParam}/${confirmTarget.other_user_id}`,
      );
      setConversations((prev) =>
        prev.filter((c) => c.conversation_id !== confirmTarget.conversation_id),
      );
      if (activeConvo?.conversation_id === confirmTarget.conversation_id) {
        setActiveConvo(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedIds.length) return;
    try {
      setDeletingSelected(true);
      const toDelete = conversations.filter((c) =>
        selectedIds.includes(c.conversation_id),
      );
      await Promise.allSettled(
        toDelete.map((c) =>
          API.delete(
            `/messages/conversation/${c.item_id ?? "null"}/${c.other_user_id}`,
          ),
        ),
      );
      setConversations((prev) =>
        prev.filter((c) => !selectedIds.includes(c.conversation_id)),
      );
      if (activeConvo && selectedIds.includes(activeConvo.conversation_id)) {
        setActiveConvo(null);
        setMessages([]);
      }
      setSelectedIds([]);
      setSelectMode(false);
    } catch (err) {
      console.error("Failed to delete selected", err);
    } finally {
      setDeletingSelected(false);
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo) return;
    try {
      setSending(true);
      const itemId = activeConvo.item_id ?? null;
      const content = newMessage.trim();
      setNewMessage("");

      const res = await API.post("/messages", {
        receiverId: activeConvo.other_user_id,
        itemId,
        content,
      });

      if (res.data?.routedAsRequest) {
        const convosRes = await API.get("/messages/conversations").catch(
          () => null,
        );
        if (convosRes?.data) {
          setConvosDedupe(convosRes.data);
          const pending = convosRes.data.find(
            (c) =>
              String(c.other_user_id) === String(activeConvo.other_user_id) &&
              String(c.item_id ?? "null") ===
                String(activeConvo.item_id ?? "null") &&
              c.chat_request_status === "pending",
          );
          if (pending) {
            setActiveConvo(pending);
            setNewConvoMode(false);
          }
        }
        API.get("/chat-requests")
          .then((r) => {
            setChatRequests(
              r.data?.received?.filter((x) => x.status === "pending") || [],
            );
          })
          .catch(() => {});
        return;
      }

      if (activeConvo.isNew) {
        const convosRes = await API.get("/messages/conversations");
        setConvosDedupe(convosRes.data);
        const real =
          convosRes.data.find(
            (c) =>
              c.conversation_id === activeConvo.conversation_id && !c.isNew,
          ) ||
          convosRes.data.find(
            (c) =>
              String(c.other_user_id) === String(activeConvo.other_user_id) &&
              String(c.item_id ?? "null") ===
                String(activeConvo.item_id ?? "null") &&
              !c.isNew,
          );
        if (real) setActiveConvo(real);
        setNewConvoMode(false);
      }

      const socket = getSocket();
      if (socket && activeConvo?.other_user_id) {
        clearTimeout(typingEmitTimeoutRef.current);
        typingEmitRef.current = false;
        socket.emit("typing-stop", {
          toUserId: activeConvo.other_user_id,
          itemId,
        });
      }
    } catch (err) {
      setNewMessage(newMessage);
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="msgs-page"
      style={{
        height: "calc(100vh - 65px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "2rem 4rem 1.5rem",
      }}
    >
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse     { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(0.85) } }
        @keyframes typingDot { 0%,60%,100% { transform:translateY(0); opacity:0.4 } 30% { transform:translateY(-3px); opacity:1 } }
        @keyframes reqSlideIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes lockPulse { 0%,100% { opacity:0.5 } 50% { opacity:1 } }
        @keyframes drawerIn  { from { transform:translateX(-100%) } to { transform:translateX(0) } }
        .msg-input::placeholder { color: var(--text-muted) }
        .msg-input:focus { outline: none }
        ::-webkit-scrollbar { width: 0px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: transparent }
        .hide-scrollbar::-webkit-scrollbar { display: none }
        .msgs-page    { padding: 2rem 4rem 1.5rem }
        .msgs-heading { display:flex; align-items:flex-end; justify-content:space-between; flex-shrink:0 }
        .msgs-title   { font-size:2.8rem }
        .msgs-panels  { display:grid; grid-template-columns:300px 1fr; gap:1rem; flex:1; min-height:0; position:relative }
        .msgs-back-desktop { display:flex }
        .msgs-hamburger    { display:none !important }
        .msgs-drawer       { display:none }
        @media (max-width:768px) {
          .msgs-page        { padding: 1.25rem 1.25rem 0.75rem !important }
          .msgs-heading     { flex-direction:column; align-items:flex-start; gap:0.5rem }
          .msgs-title       { font-size:2.2rem !important }
          .msgs-panels      { grid-template-columns:1fr !important }
          .msgs-panel-sidebar { display:none !important }
          .msgs-panel-chat  { display:flex !important }
          .msgs-back-desktop { display:none !important }
          .msgs-hamburger   { display:flex !important }
          .msgs-drawer      { display:block !important; position:absolute; inset:0; z-index:50; border-radius:20px; overflow:hidden; pointer-events:all }
        }
        @media (max-width:480px) {
          .msgs-page  { padding: 0.75rem 0.75rem 0.5rem !important }
          .msgs-title { font-size:1.8rem !important }
        }
      `}</style>

      <ConfirmDialog
        open={!!confirmTarget}
        name={
          confirmTarget === "bulk"
            ? `${selectedIds.length} conversation${selectedIds.length > 1 ? "s" : ""}`
            : confirmTarget?.other_user_name
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Heading */}
        <div className="msgs-heading" style={{ flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, lineHeight: 1.05 }}>
              <span
                className="msgs-title"
                style={{
                  display: "block",
                  fontWeight: "900",
                  color: "var(--text-primary)",
                  letterSpacing: "-1.5px",
                }}
              >
                My
              </span>
              <span
                className="msgs-title"
                style={{
                  display: "block",
                  fontWeight: "900",
                  letterSpacing: "-1.5px",
                  background:
                    "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Messages.
              </span>
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginTop: "0.4rem",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  fontWeight: "500",
                }}
              >
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""}
                {totalUnread > 0 && (
                  <span
                    style={{
                      color: "var(--accent)",
                      fontWeight: "700",
                      marginLeft: "0.5rem",
                    }}
                  >
                    · {totalUnread} unread
                  </span>
                )}
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingRead}
              style={{
                padding: "0.5rem 1.2rem",
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
                borderRadius: "10px",
                cursor: markingRead ? "not-allowed" : "pointer",
                fontSize: "0.78rem",
                fontWeight: "600",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                opacity: markingRead ? 0.6 : 1,
              }}
            >
              {markingRead ? "Marking..." : "✓ Mark all read"}
            </button>
          )}
        </div>

        {/* Mobile drawer — slides in over chat with dimmed overlay */}
        {mobShowChat && (
          <div className="msgs-drawer" onClick={() => setMobShowChat(false)}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                borderRadius: "20px",
              }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                bottom: "0",
                width: "88%",
                maxWidth: "310px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px 0 0 20px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "8px 0 40px rgba(0,0,0,0.5)",
                zIndex: 51,
                animation: "drawerIn 0.22s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {/* Tab headers */}
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex" }}>
                  {[
                    { key: "chats", label: "Chats" },
                    ...(chatRequests.length > 0
                      ? [
                          {
                            key: "requests",
                            label: "Requests",
                            count: chatRequests.length,
                          },
                        ]
                      : []),
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setSidebarTab(tab.key);
                        if (tab.key === "chats") setActiveRequest(null);
                      }}
                      style={{
                        flex: 1,
                        padding: "0.75rem 0.5rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.72rem",
                        fontWeight: sidebarTab === tab.key ? "700" : "500",
                        color:
                          sidebarTab === tab.key
                            ? "var(--accent)"
                            : "var(--text-muted)",
                        borderBottom:
                          sidebarTab === tab.key
                            ? "2px solid var(--accent)"
                            : "2px solid transparent",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.35rem",
                        fontFamily: "inherit",
                      }}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          style={{
                            fontSize: "0.55rem",
                            fontWeight: "800",
                            padding: "1px 5px",
                            borderRadius: "10px",
                            background:
                              sidebarTab === tab.key
                                ? "var(--accent-soft)"
                                : "var(--bg-card-hover)",
                            color:
                              sidebarTab === tab.key
                                ? "var(--accent)"
                                : "var(--text-secondary)",
                            border: `1px solid ${sidebarTab === tab.key ? "var(--accent-border)" : "var(--border)"}`,
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setMobShowChat(false)}
                    style={{
                      padding: "0 0.85rem",
                      background: "none",
                      border: "none",
                      borderLeft: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                {sidebarTab === "chats" && (
                  <div
                    style={{
                      padding: "0.4rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "0.4rem",
                    }}
                  >
                    {selectMode && selectedIds.length > 0 && (
                      <button
                        onClick={() => setConfirmTarget("bulk")}
                        style={{
                          padding: "0.28rem 0.6rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,107,107,0.35)",
                          background: "rgba(255,107,107,0.1)",
                          color: "#ff8787",
                          fontSize: "0.65rem",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Delete {selectedIds.length}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectMode((s) => !s);
                        setSelectedIds([]);
                      }}
                      style={{
                        padding: "0.28rem 0.6rem",
                        borderRadius: "8px",
                        border: `1px solid ${selectMode ? "rgba(var(--accent-rgb),0.4)" : "var(--border)"}`,
                        background: selectMode
                          ? "rgba(var(--accent-rgb),0.12)"
                          : "transparent",
                        color: selectMode
                          ? "var(--accent)"
                          : "var(--text-muted)",
                        fontSize: "0.65rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {selectMode ? "Cancel" : "Select"}
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "0.5rem",
                  scrollbarWidth: "none",
                }}
                className="hide-scrollbar"
              >
                {sidebarTab === "requests" ? (
                  chatRequests.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "var(--text-ghost)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          marginBottom: "0.5rem",
                          opacity: 0.3,
                        }}
                      >
                        💬
                      </div>
                      <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                        No pending requests
                      </p>
                    </div>
                  ) : (
                    chatRequests.map((req) => {
                      const isAct = activeRequest?.id === req.id;
                      return (
                        <div
                          key={req.id}
                          onClick={() => {
                            setActiveRequest(req);
                            setActiveConvo(null);
                            setMobShowChat(false);
                          }}
                          style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "14px",
                            cursor: "pointer",
                            marginBottom: "0.25rem",
                            position: "relative",
                            background: isAct
                              ? "var(--accent-soft)"
                              : "transparent",
                            border: isAct
                              ? "1px solid var(--accent-border)"
                              : "1px solid transparent",
                            display: "flex",
                            gap: "0.75rem",
                            alignItems: "center",
                            height: "64px",
                            boxSizing: "border-box",
                          }}
                          onMouseEnter={(e) => {
                            if (!isAct)
                              e.currentTarget.style.background =
                                "var(--bg-card-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isAct)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "3px",
                              height: "55%",
                              borderRadius: "0 3px 3px 0",
                              background:
                                "linear-gradient(180deg, var(--accent), var(--accent-alt))",
                            }}
                          />
                          <Avatar
                            name={`${req.sender?.firstName} ${req.sender?.lastName}`}
                            size={38}
                            orange={isAct}
                            src={req.sender?.avatar || null}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.88rem",
                                fontWeight: "700",
                                color: isAct
                                  ? "var(--accent)"
                                  : "var(--text-primary)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {req.sender?.firstName} {req.sender?.lastName}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                                marginTop: "0.15rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.2rem",
                                  color: isAct
                                    ? "var(--accent)"
                                    : "var(--text-muted)",
                                  fontWeight: "600",
                                  flexShrink: 0,
                                }}
                              >
                                {!req.itemId ? (
                                  <>
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Profile
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                      <line x1="7" y1="7" x2="7.01" y2="7" />
                                    </svg>
                                    Item
                                  </>
                                )}
                              </span>
                              <span
                                style={{
                                  color: "var(--text-ghost)",
                                  fontSize: "0.65rem",
                                  flexShrink: 0,
                                }}
                              >
                                •
                              </span>
                              <span
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  flex: 1,
                                }}
                              >
                                {req.message || "Wants to chat with you"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  <>
                    {newConvoMode && activeConvo?.isNew && (
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "14px",
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-border)",
                          marginBottom: "0.25rem",
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                          height: "64px",
                          boxSizing: "border-box",
                        }}
                      >
                        <Avatar
                          name={activeConvo.other_user_name}
                          size={38}
                          orange
                          src={activeConvo.other_user_avatar || null}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: "700",
                              color: "var(--accent)",
                            }}
                          >
                            {activeConvo.other_user_name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--accent-alt)",
                              fontWeight: "600",
                              marginTop: "0.1rem",
                              opacity: 0.8,
                            }}
                          >
                            New conversation
                          </div>
                        </div>
                      </div>
                    )}
                    {loadingConvos ? (
                      <div
                        style={{ textAlign: "center", padding: "3rem 1rem" }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            border: "2.5px solid var(--border)",
                            borderTop: "2.5px solid var(--accent)",
                            borderRadius: "50%",
                            margin: "0 auto",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                      </div>
                    ) : conversations.length === 0 && !newConvoMode ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "3rem 1rem",
                          color: "var(--text-ghost)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "2rem",
                            marginBottom: "0.5rem",
                            opacity: 0.3,
                          }}
                        >
                          ✉
                        </div>
                        <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                          No conversations yet
                        </p>
                      </div>
                    ) : (
                      conversations.map((convo) => (
                        <ConversationItem
                          key={convo.conversation_id}
                          convo={convo}
                          isActive={
                            activeConvo?.conversation_id ===
                            convo.conversation_id
                          }
                          isSelected={selectedIds.includes(
                            convo.conversation_id,
                          )}
                          selectMode={selectMode}
                          isTyping={
                            !(
                              activeConvo &&
                              activeConvo.conversation_id ===
                                convo.conversation_id
                            ) && typingUserIds.has(String(convo.other_user_id))
                          }
                          onClick={() => {
                            fetchTick.current++;
                            setActiveConvo(convo);
                            setActiveRequest(null);
                            setNewConvoMode(false);
                            setMobShowChat(false);
                          }}
                          onSelect={toggleSelect}
                        />
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panels */}
        <div className="msgs-panels">
          <button
            ref={backRef}
            className="msgs-back-desktop"
            onClick={() => navigate(-1)}
            onMouseDown={onBackMouseDown}
            onTouchStart={onBackTouchStart}
            style={{
              position: "absolute",
              left: "-50px",
              top: "12px",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "var(--bg-card)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: draggable ? "grab" : "pointer",
              flexShrink: 0,
              color: "var(--text-muted)",
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

          {/* ── LEFT SIDEBAR ── */}
          <div
            className="msgs-panel-sidebar"
            style={{
              background: "var(--bg-card)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Tab headers */}
            <div
              style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}
            >
              <div style={{ display: "flex" }}>
                {[
                  { key: "chats", label: "Chats" },
                  ...(chatRequests.length > 0
                    ? [
                        {
                          key: "requests",
                          label: "Requests",
                          count: chatRequests.length,
                        },
                      ]
                    : []),
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setSidebarTab(tab.key);
                      if (tab.key === "chats") setActiveRequest(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "0.75rem 0.5rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: sidebarTab === tab.key ? "700" : "500",
                      color:
                        sidebarTab === tab.key
                          ? "var(--accent)"
                          : "var(--text-muted)",
                      borderBottom:
                        sidebarTab === tab.key
                          ? "2px solid var(--accent)"
                          : "2px solid transparent",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      fontFamily: "inherit",
                    }}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        style={{
                          fontSize: "0.55rem",
                          fontWeight: "800",
                          padding: "1px 5px",
                          borderRadius: "10px",
                          background:
                            sidebarTab === tab.key
                              ? "var(--accent-soft)"
                              : "var(--bg-card-hover)",
                          color:
                            sidebarTab === tab.key
                              ? "var(--accent)"
                              : "var(--text-secondary)",
                          border: `1px solid ${sidebarTab === tab.key ? "var(--accent-border)" : "var(--border)"}`,
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {sidebarTab === "chats" && (
                <div
                  style={{
                    padding: "0.5rem 1rem 0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "0.5rem",
                  }}
                >
                  {selectMode && selectedIds.length > 0 && (
                    <button
                      onClick={() => setConfirmTarget("bulk")}
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,107,107,0.35)",
                        background: "rgba(255,107,107,0.1)",
                        color: "#ff8787",
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      Delete {selectedIds.length}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectMode((s) => !s);
                      setSelectedIds([]);
                    }}
                    style={{
                      padding: "0.3rem 0.7rem",
                      borderRadius: "8px",
                      border: `1px solid ${selectMode ? "rgba(var(--accent-rgb),0.4)" : "var(--border)"}`,
                      background: selectMode
                        ? "rgba(var(--accent-rgb),0.12)"
                        : "transparent",
                      color: selectMode ? "var(--accent)" : "var(--text-muted)",
                      fontSize: "0.68rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {selectMode ? "Cancel" : "Select"}
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar list */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0.5rem",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              className="hide-scrollbar"
            >
              {/* ── REQUESTS TAB ── */}
              {sidebarTab === "requests" ? (
                chatRequests.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem 1rem",
                      color: "var(--text-ghost)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        marginBottom: "0.5rem",
                        opacity: 0.3,
                      }}
                    >
                      💬
                    </div>
                    <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                      No pending requests
                    </p>
                  </div>
                ) : (
                  chatRequests.map((req) => {
                    const isActive = activeRequest?.id === req.id;
                    return (
                      <div
                        key={req.id}
                        onClick={() => {
                          setActiveRequest(req);
                          setActiveConvo(null);
                        }}
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "14px",
                          cursor: "pointer",
                          marginBottom: "0.25rem",
                          position: "relative",
                          background: isActive
                            ? "var(--accent-soft)"
                            : "transparent",
                          border: isActive
                            ? "1px solid var(--accent-border)"
                            : "1px solid transparent",
                          transition:
                            "background 0.18s ease, border 0.18s ease",
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                          height: "64px",
                          boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background =
                              "var(--bg-card-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* accent left bar */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "55%",
                            borderRadius: "0 3px 3px 0",
                            background:
                              "linear-gradient(180deg, var(--accent), var(--accent-alt))",
                          }}
                        />
                        <Avatar
                          name={`${req.sender?.firstName} ${req.sender?.lastName}`}
                          size={38}
                          orange={isActive}
                          src={req.sender?.avatar || null}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: "700",
                              color: isActive
                                ? "var(--accent)"
                                : "var(--text-primary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              letterSpacing: "-0.2px",
                            }}
                          >
                            {req.sender?.firstName} {req.sender?.lastName}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              marginTop: "0.15rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.2rem",
                                color: isActive
                                  ? "var(--accent)"
                                  : "var(--text-muted)",
                                fontWeight: "600",
                                flexShrink: 0,
                              }}
                            >
                              {!req.itemId ? (
                                <>
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  Profile
                                </>
                              ) : (
                                <>
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                  </svg>
                                  Item
                                </>
                              )}
                            </span>
                            <span
                              style={{
                                color: "var(--text-ghost)",
                                fontSize: "0.65rem",
                                flexShrink: 0,
                              }}
                            >
                              •
                            </span>
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                flex: 1,
                              }}
                            >
                              {req.message || "Wants to chat with you"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* ── CHATS TAB ── */
                <>
                  {newConvoMode && activeConvo?.isNew && (
                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "14px",
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent-border)",
                        marginBottom: "0.25rem",
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                        height: "64px",
                        boxSizing: "border-box",
                      }}
                    >
                      <Avatar
                        name={activeConvo.other_user_name}
                        size={38}
                        orange
                        src={activeConvo.other_user_avatar || null}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: "700",
                            color: "var(--accent)",
                          }}
                        >
                          {activeConvo.other_user_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--accent-alt)",
                            fontWeight: "600",
                            marginTop: "0.1rem",
                            opacity: 0.8,
                          }}
                        >
                          New conversation
                        </div>
                      </div>
                    </div>
                  )}
                  {loadingConvos ? (
                    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          border: "2.5px solid var(--border)",
                          borderTop: "2.5px solid var(--accent)",
                          borderRadius: "50%",
                          margin: "0 auto",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    </div>
                  ) : conversations.length === 0 && !newConvoMode ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "var(--text-ghost)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          marginBottom: "0.5rem",
                          opacity: 0.3,
                        }}
                      >
                        ✉
                      </div>
                      <p style={{ fontSize: "0.78rem", fontWeight: "500" }}>
                        No conversations yet
                      </p>
                    </div>
                  ) : (
                    conversations.map((convo) => (
                      <ConversationItem
                        key={convo.conversation_id}
                        convo={convo}
                        isActive={
                          activeConvo?.conversation_id === convo.conversation_id
                        }
                        isSelected={selectedIds.includes(convo.conversation_id)}
                        selectMode={selectMode}
                        isTyping={
                          !(
                            activeConvo &&
                            activeConvo.conversation_id ===
                              convo.conversation_id
                          ) && typingUserIds.has(String(convo.other_user_id))
                        }
                        onClick={() => {
                          fetchTick.current++;
                          setActiveConvo(convo);
                          setActiveRequest(null);
                          setNewConvoMode(false);
                          setMobShowChat(true);
                        }}
                        onSelect={toggleSelect}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div
            className="msgs-panel-chat"
            style={{
              background: "var(--bg-card)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* ════════════════════════════════════════════════
                REQUEST VIEW — chat-bubble preview
                ═══════════════════════════════════════════════ */}
            {activeRequest && !activeConvo ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  animation: "reqSlideIn 0.22s ease",
                }}
              >
                {/* ── Header: looks like a real chat header ── */}
                <div
                  style={{
                    padding: "1rem 1.5rem 0.85rem",
                    borderBottom: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                    }}
                  >
                    <button
                      className="msgs-hamburger"
                      onClick={() => setMobShowChat((prev) => !prev)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        border: "1px solid var(--border-hover)",
                        background: "var(--bg-card)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <line x1="2" y1="5" x2="18" y2="5" />
                        <line x1="2" y1="10" x2="14" y2="10" />
                        <line x1="2" y1="15" x2="18" y2="15" />
                      </svg>
                    </button>
                    <Avatar
                      name={`${activeRequest.sender?.firstName} ${activeRequest.sender?.lastName}`}
                      size={40}
                      src={activeRequest.sender?.avatar || null}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {activeRequest.sender?.firstName}{" "}
                        {activeRequest.sender?.lastName}
                      </div>
                      {activeRequest.sender?.institution && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            marginTop: "0.1rem",
                            color: "var(--text-muted)",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          {activeRequest.sender.institution}
                        </div>
                      )}
                    </div>
                    {/* date badge */}
                    <div
                      style={{
                        fontSize: "0.62rem",
                        color: "var(--text-ghost)",
                        flexShrink: 0,
                        padding: "0.2rem 0.6rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "20px",
                      }}
                    >
                      {activeRequest.createdAt
                        ? new Date(activeRequest.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )
                        : "Just now"}
                    </div>
                  </div>
                </div>

                {/* ── Message area: their message as a real chat bubble ── */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    position: "relative",
                  }}
                >
                  {/* "pending request" label at top — tiny and unobtrusive */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.85rem",
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent-border)",
                        borderRadius: "20px",
                        fontSize: "0.65rem",
                        fontWeight: "700",
                        color: "var(--accent)",
                        letterSpacing: "0.3px",
                      }}
                    >
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Pending request
                    </div>
                  </div>

                  {/* Their message — real bubble, left-aligned */}
                  {activeRequest.message ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        animation: "fadeUp 0.25s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "0.6rem",
                          maxWidth: "72%",
                        }}
                      >
                        <Avatar
                          name={`${activeRequest.sender?.firstName} ${activeRequest.sender?.lastName}`}
                          size={28}
                          src={activeRequest.sender?.avatar || null}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              padding: "0.65rem 1rem",
                              borderRadius: "18px 18px 18px 4px",
                              background: "var(--bg-card-hover)",
                              border: "1px solid var(--border-hover)",
                              color: "var(--text-primary)",
                              fontSize: "0.9rem",
                              lineHeight: "1.55",
                              fontWeight: "500",
                            }}
                          >
                            {activeRequest.message}
                          </div>
                          <span
                            style={{
                              fontSize: "0.6rem",
                              color: "var(--text-ghost)",
                              paddingInline: "0.3rem",
                            }}
                          >
                            {activeRequest.createdAt
                              ? new Date(
                                  activeRequest.createdAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        animation: "fadeUp 0.25s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "0.6rem",
                          maxWidth: "72%",
                        }}
                      >
                        <Avatar
                          name={`${activeRequest.sender?.firstName} ${activeRequest.sender?.lastName}`}
                          size={28}
                          src={activeRequest.sender?.avatar || null}
                        />
                        <div
                          style={{
                            padding: "0.65rem 1rem",
                            borderRadius: "18px 18px 18px 4px",
                            background: "var(--bg-card-hover)",
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                            fontSize: "0.82rem",
                            fontStyle: "italic",
                            lineHeight: "1.5",
                          }}
                        >
                          No message — just wants to connect.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Locked reply area — shows what the input will look like but blocked */}
                  <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
                    <div
                      style={{
                        padding: "0.65rem 1rem",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        cursor: "not-allowed",
                        opacity: 0.45,
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-muted)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        style={{
                          flexShrink: 0,
                          animation: "lockPulse 2.5s ease-in-out infinite",
                        }}
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Accept the request to start chatting…
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Accept / Decline buttons ── */}
                <div
                  style={{
                    padding: "1rem 1.5rem 1.25rem",
                    borderTop: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", gap: "0.65rem" }}>
                    {/* Decline */}
                    <button
                      onClick={() =>
                        handleRespondRequest(activeRequest.id, "declined")
                      }
                      disabled={respondingId === activeRequest.id}
                      style={{
                        flex: 1,
                        padding: "0.78rem",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-card)",
                        border: "1px solid rgba(255,107,107,0.28)",
                        color: "#ff8787",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        cursor:
                          respondingId === activeRequest.id
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                        opacity: respondingId === activeRequest.id ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) => {
                        if (respondingId !== activeRequest.id) {
                          e.currentTarget.style.background =
                            "rgba(255,107,107,0.10)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,107,107,0.50)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-card)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,107,107,0.28)";
                      }}
                    >
                      {respondingId === activeRequest.id ? (
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid rgba(255,107,107,0.3)",
                            borderTopColor: "#ff8787",
                            borderRadius: "50%",
                            animation: "spin 0.6s linear infinite",
                          }}
                        />
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Decline
                        </>
                      )}
                    </button>

                    {/* Accept */}
                    <button
                      onClick={() =>
                        handleRespondRequest(activeRequest.id, "accepted")
                      }
                      disabled={respondingId === activeRequest.id}
                      style={{
                        flex: 2,
                        padding: "0.78rem",
                        borderRadius: "var(--radius-md)",
                        background:
                          respondingId === activeRequest.id
                            ? "rgba(81,207,102,0.10)"
                            : "linear-gradient(135deg, #3ecf5a, #2b9e44)",
                        border: "none",
                        color: "white",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        cursor:
                          respondingId === activeRequest.id
                            ? "not-allowed"
                            : "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                        boxShadow:
                          respondingId === activeRequest.id
                            ? "none"
                            : "0 4px 18px rgba(62,207,90,0.30)",
                        opacity: respondingId === activeRequest.id ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) => {
                        if (respondingId !== activeRequest.id) {
                          e.currentTarget.style.filter = "brightness(1.08)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 22px rgba(62,207,90,0.42)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = "";
                        e.currentTarget.style.boxShadow =
                          respondingId === activeRequest.id
                            ? "none"
                            : "0 4px 18px rgba(62,207,90,0.30)";
                      }}
                    >
                      {respondingId === activeRequest.id ? (
                        <>
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              border: "2px solid rgba(255,255,255,0.3)",
                              borderTopColor: "white",
                              borderRadius: "50%",
                              animation: "spin 0.6s linear infinite",
                            }}
                          />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Accept Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : !activeConvo ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  color: "var(--text-ghost)",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.3 }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                  {sidebarTab === "requests"
                    ? "Select a request to review"
                    : "Select a conversation"}
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "1rem 1.5rem 0.85rem",
                    borderBottom: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      marginBottom: "0.85rem",
                    }}
                  >
                    <button
                      className="msgs-hamburger"
                      onClick={() => setMobShowChat((prev) => !prev)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        border: "1px solid var(--border-hover)",
                        background: "var(--bg-card)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                        gap: "0",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <line x1="2" y1="5" x2="18" y2="5" />
                        <line x1="2" y1="10" x2="14" y2="10" />
                        <line x1="2" y1="15" x2="18" y2="15" />
                      </svg>
                    </button>
                    <Avatar
                      name={activeConvo.other_user_name}
                      size={40}
                      src={activeConvo.other_user_avatar || null}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {activeConvo.other_user_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          marginTop: "0.1rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          color: activeConvo.isNew
                            ? "var(--text-ghost)"
                            : otherUserTyping
                              ? "var(--accent)"
                              : otherUserOnline
                                ? "#4ade80"
                                : "var(--text-ghost)",
                        }}
                      >
                        {!activeConvo.isNew && (
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              flexShrink: 0,
                              background: otherUserTyping
                                ? "var(--accent)"
                                : otherUserOnline
                                  ? "#4ade80"
                                  : "var(--border-hover)",
                              boxShadow:
                                otherUserOnline && !otherUserTyping
                                  ? "0 0 6px #4ade80"
                                  : otherUserTyping
                                    ? "0 0 6px var(--accent)"
                                    : "none",
                              animation: otherUserTyping
                                ? "pulse 1s ease-in-out infinite"
                                : "none",
                            }}
                          />
                        )}
                        {activeConvo.isNew
                          ? "Start a new conversation"
                          : otherUserTyping
                            ? "typing..."
                            : otherUserOnline
                              ? "Online"
                              : "Offline"}
                      </div>
                    </div>
                    {!activeConvo.isNew && (
                      <button
                        onClick={() => setConfirmTarget(activeConvo)}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,107,107,0.2)",
                          background: "rgba(255,107,107,0.06)",
                          color: "#ff8787",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255,107,107,0.18)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,107,107,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(255,107,107,0.06)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,107,107,0.2)";
                        }}
                        title="Delete conversation"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {activeConvo.item_id && (
                    <ItemCard
                      convo={activeConvo}
                      myId={myId}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {loadingMessages ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          border: "2.5px solid var(--border)",
                          borderTop: "2.5px solid var(--accent)",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    </div>
                  ) : activeConvo.chat_request_status === "pending" &&
                    activeConvo.is_request_sender &&
                    messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.6rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          padding: "0.6rem 0.85rem",
                          borderRadius: "18px 18px 18px 4px",
                          background: "var(--bg-card-hover)",
                          border: "1px solid var(--border-hover)",
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          fontStyle: "italic",
                          maxWidth: "60%",
                        }}
                      >
                        {activeConvo.last_message || "No message attached."}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.28rem 0.75rem",
                          background: "var(--accent-soft)",
                          border: "1px solid var(--accent-border)",
                          borderRadius: "20px",
                          fontSize: "0.65rem",
                          fontWeight: "700",
                          color: "var(--accent)",
                        }}
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Waiting for {activeConvo.other_user_name} to accept
                      </div>
                    </div>
                  ) : activeConvo.isNew && messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "16px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0.5,
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-secondary)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          color: "var(--text-muted)",
                          margin: 0,
                        }}
                      >
                        Say hello to{" "}
                        <span
                          style={{ color: "var(--accent)", fontWeight: "700" }}
                        >
                          {activeConvo.other_user_name}
                        </span>
                      </p>
                      {activeConvo.item_title && (
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-ghost)",
                            margin: 0,
                          }}
                        >
                          about {activeConvo.item_title}
                        </p>
                      )}
                    </div>
                  ) : messages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-ghost)",
                        fontSize: "0.82rem",
                      }}
                    >
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe =
                        msg.senderId === myId || msg.sender_id === myId;
                      const time = msg.createdAt || msg.created_at;
                      return (
                        <div
                          key={msg.id || i}
                          style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            animation: "fadeUp 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "62%",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.2rem",
                              alignItems: isMe ? "flex-end" : "flex-start",
                            }}
                          >
                            <div
                              style={{
                                padding: "0.6rem 0.95rem",
                                borderRadius: isMe
                                  ? "18px 18px 4px 18px"
                                  : "18px 18px 18px 4px",
                                background: isMe
                                  ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                                  : "var(--bg-card-hover)",
                                border: isMe
                                  ? "none"
                                  : "1px solid var(--border-hover)",
                                color: isMe ? "white" : "var(--text-primary)",
                                fontSize: "0.875rem",
                                lineHeight: "1.5",
                                boxShadow: isMe
                                  ? "0 4px 12px rgba(var(--accent-rgb),0.22)"
                                  : "none",
                              }}
                            >
                              {msg.content}
                            </div>
                            {time && (
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  color: "var(--text-muted)",
                                  paddingInline: "0.3rem",
                                }}
                              >
                                {new Date(time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderTop: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                >
                  {activeConvo.chat_request_status === "pending" &&
                  activeConvo.is_request_sender ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        padding: "0.7rem 1rem",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        cursor: "not-allowed",
                        opacity: 0.55,
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-muted)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        style={{
                          flexShrink: 0,
                          animation: "lockPulse 2.5s ease-in-out infinite",
                        }}
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Waiting for {activeConvo.other_user_name} to accept…
                      </span>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSend}
                      style={{
                        display: "flex",
                        gap: "0.65rem",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <input
                          ref={msgInputRef}
                          className="msg-input"
                          type="text"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            const socket = getSocket();
                            if (socket && activeConvo?.other_user_id) {
                              if (!typingEmitRef.current) {
                                typingEmitRef.current = true;
                                socket.emit("typing-start", {
                                  toUserId: activeConvo.other_user_id,
                                  itemId: activeConvo.item_id,
                                });
                              }
                              clearTimeout(typingEmitTimeoutRef.current);
                              typingEmitTimeoutRef.current = setTimeout(() => {
                                typingEmitRef.current = false;
                                socket.emit("typing-stop", {
                                  toUserId: activeConvo.other_user_id,
                                  itemId: activeConvo.item_id,
                                });
                              }, 800);
                            }
                          }}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          placeholder={
                            activeConvo.isNew
                              ? `Message ${activeConvo.other_user_name}...`
                              : "Type a message..."
                          }
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "0.7rem 1rem",
                            background: inputFocused
                              ? "var(--bg-input-focus)"
                              : "var(--bg-input)",
                            border: inputFocused
                              ? "1px solid var(--accent-border)"
                              : "1px solid var(--border)",
                            borderRadius: "12px",
                            color: "var(--text-primary)",
                            fontSize: "0.875rem",
                            fontFamily: "inherit",
                            transition: "all 0.2s ease",
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "12px",
                          flexShrink: 0,
                          background:
                            sending || !newMessage.trim()
                              ? "var(--bg-card-hover)"
                              : "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                          border: "none",
                          cursor:
                            sending || !newMessage.trim()
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                          boxShadow:
                            !sending && newMessage.trim()
                              ? "0 4px 14px rgba(var(--accent-rgb),0.3)"
                              : "none",
                        }}
                      >
                        {sending ? (
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              border: "2px solid var(--border-hover)",
                              borderTopColor: "var(--text-primary)",
                              borderRadius: "50%",
                              animation: "spin 0.6s linear infinite",
                            }}
                          />
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={
                              !newMessage.trim() ? "var(--text-ghost)" : "white"
                            }
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
