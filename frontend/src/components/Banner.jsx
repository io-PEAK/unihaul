import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Banner({ id, message, buttonText, to, onClose, icon, style = {} }) {
  const navigate = useNavigate();
  const [closed, setClosed] = useState(() => {
    return sessionStorage.getItem(`banner_closed_${id}`) === "true";
  });

  if (closed) return null;

  const handleClose = (e) => {
    e.stopPropagation();
    setClosed(true);
    sessionStorage.setItem(`banner_closed_${id}`, "true");
    if (onClose) onClose();
  };

  const handleAction = () => {
    if (to.startsWith("http")) {
      window.location.href = to;
    } else {
      navigate(to);
    }
  };

  return (
    <div
      className="st-banner"
      style={{
        width: "100%",
        padding: "0.85rem 1.5rem",
        background: "var(--accent-soft)",
        borderBottom: "1.5px solid var(--accent-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.25rem",
        animation: "bannerSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        position: "relative",
        zIndex: 100,
        boxSizing: "border-box",
        ...style
      }}
    >
      <style>{`
        @keyframes bannerSlideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
        {icon && (
          <div style={{ color: "var(--accent)", flexShrink: 0, display: "flex" }}>
            {icon}
          </div>
        )}
        <div
          style={{
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            fontWeight: "600",
            lineHeight: "1.4",
          }}
        >
          {message}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexShrink: 0 }}>
        {buttonText && to && (
          <button
            onClick={handleAction}
            style={{
              padding: "0.55rem 1.15rem",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(var(--accent-rgb), 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(var(--accent-rgb), 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(var(--accent-rgb), 0.25)";
            }}
          >
            {buttonText}
          </button>
        )}
        <button
          onClick={handleClose}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.background = "var(--bg-card-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--bg-card)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
