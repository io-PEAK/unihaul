import { useEffect, useState } from "react";

// This toast no longer navigates anywhere.
// It just says "You have X new notification(s)" and tells user to check the bell.
// The bell icon in Navbar handles all the detail.
function ToastNotification({ notifications, onOpenBell }) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState("entering");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setPhase("entering");
    const t1 = setTimeout(() => setPhase("visible"), 30);
    const t2 = setTimeout(() => setPhase("exiting"), 6000);
    const t3 = setTimeout(() => setVisible(false), 6400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [notifications]);

  if (!visible || !notifications || notifications.length === 0) return null;

  const count = notifications.length;
  const isExiting = phase === "exiting";

  function handleClick() {
    setPhase("exiting");
    setTimeout(() => setVisible(false), 400);
    // Tell App/Navbar to open the bell dropdown
    if (onOpenBell) onOpenBell();
  }

  function handleClose(e) {
    e.stopPropagation();
    setPhase("exiting");
    setTimeout(() => setVisible(false), 400);
  }

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(12px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes toast-progress-6 {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          15%       { transform: rotate(15deg); }
          30%       { transform: rotate(-12deg); }
          45%       { transform: rotate(10deg); }
          60%       { transform: rotate(-8deg); }
          75%       { transform: rotate(5deg); }
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 9999,
          cursor: "pointer",
          borderRadius: "14px",
          overflow: "hidden",
          background: "rgba(22, 20, 35, 0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: hovered
            ? "0 20px 50px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)"
            : "0 10px 35px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
          width: "280px",
          animation: isExiting
            ? "none"
            : "toast-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          transform: isExiting ? "translateY(8px) scale(0.95)" : undefined,
          opacity: isExiting ? 0 : undefined,
          transition: isExiting ? "all 0.35s ease-in" : "box-shadow 0.2s ease",
        }}
      >
        <div
          style={{
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {/* Bell icon */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "11px",
              flexShrink: 0,
              background: "linear-gradient(135deg, #e87722, #f5a623)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 12px rgba(232,119,34,0.4)",
              position: "relative",
              animation: "bell-ring 1s ease 0.4s",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {/* Count badge */}
            <div
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                minWidth: "18px",
                height: "18px",
                borderRadius: "9px",
                padding: "0 4px",
                background: "#ff4444",
                border: "1.5px solid rgba(22,20,35,0.97)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.55rem",
                fontWeight: "900",
                color: "white",
              }}
            >
              {count > 9 ? "9+" : count}
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.25rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: "700",
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {count === 1 ? "New Sale" : "New Sales"}
                </span>
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#51cf66",
                    display: "inline-block",
                    animation: "live-pulse 1.6s ease-in-out infinite",
                  }}
                />
              </div>
              <button
                onClick={handleClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.18)",
                  fontSize: "0.95rem",
                  lineHeight: 1,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.18)")
                }
              >
                &times;
              </button>
            </div>

            {/* Main message */}
            <div
              style={{
                fontSize: "0.86rem",
                fontWeight: "700",
                color: "rgba(255,255,255,0.9)",
                marginBottom: "0.2rem",
                letterSpacing: "-0.1px",
              }}
            >
              You have {count} new{" "}
              {count === 1 ? "notification" : "notifications"}
            </div>

            {/* CTA */}
            <div
              style={{
                fontSize: "0.72rem",
                color: "rgba(232,119,34,0.7)",
                fontWeight: "600",
                letterSpacing: "0.2px",
              }}
            >
              Click to view details →
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: "2px", background: "rgba(255,255,255,0.04)" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #e87722, #f5a623)",
              transformOrigin: "left center",
              animation: "toast-progress-6 6s linear forwards",
              animationPlayState: hovered ? "paused" : "running",
            }}
          />
        </div>
      </div>
    </>
  );
}

export default ToastNotification;
