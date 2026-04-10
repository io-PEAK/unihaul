import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Watching() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Grid Size state
  const [gridSize, setGridSizeState] = useState(() => {
    try {
      return parseInt(localStorage.getItem("gridSize_watching") || "1", 10);
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

  // Selection
  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleHistory = (id, e) => {
    e.stopPropagation();
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const navigate = useNavigate();

  useEffect(() => {
    fetchWatching();
  }, []);

  async function fetchWatching() {
    setLoading(true);
    try {
      const res = await API.get("/items/watched");
      setItems(res.data || []);
      setError(null);
    } catch {
      setError("Failed to fetch watched items.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((w) => w.item.id)));
    }
  }

  async function handleBulkUnwatch() {
    try {
      await Promise.all(
        [...selected].map((id) => API.delete(`/items/${id}/watch`))
      );
      setItems((prev) => prev.filter((w) => !selected.has(w.item.id)));
      setSelected(new Set());
      setBulkConfirm(false);
      window.dispatchEvent(new CustomEvent("watching-updated"));
    } catch {
      setError("Failed to unwatch some items.");
    }
  }

  const hasSelection = selected.size > 0;
  const allSel = items.length > 0 && selected.size === items.length;

  return (
    <div className="page-transition">
      <div className="dash-wrapper" style={{ 
        maxWidth: gridSize === 1 ? "900px" : gridSize === 2 ? "1100px" : "1300px", 
        margin: "0 auto", 
        padding: gridSize === 1 ? "5rem 4rem 3rem" : "5rem 2rem 3rem",
        transition: "max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        
        {/* Heading Section: Structured like Dashboard */}
        <div style={{ marginBottom: "2.5rem", position: "relative" }}>
          {/* ── Back button ── */}
          <button
            className="dash-back-btn back-btn-circle"
            onClick={() => navigate(-1)}
            style={{
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
              transition: "all 0.15s",
              position: "absolute",
              left: "-50px",
              top: "6px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 8px 2px rgba(var(--accent-rgb),0.35)";
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
                background: "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Watchlist.
            </span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Items you are keeping an eye on for price drops.
          </p>
        </div>

        {/* Selection Bar: Matches Dashboard Style */}
        {hasSelection && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(135deg, rgba(var(--accent-rgb),0.07) 0%, rgba(var(--accent-rgb),0.02) 100%)",
              border: "1px solid rgba(var(--accent-rgb),0.18)",
              borderRadius: "14px",
              padding: "0.75rem 1.25rem",
              marginBottom: "1.5rem",
              animation: "fadeSlideIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.80rem", fontWeight: "600" }}>
                {selected.size} selected
              </span>
              <button
                onClick={toggleAll}
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
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "var(--bg-card)";
                }}
              >
                {allSel ? "Deselect All" : "Select All"}
              </button>
            </div>
            <button
              onClick={() => setBulkConfirm(true)}
              style={{
                padding: "0.35rem 1rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                background: "rgba(255,77,77,0.1)",
                border: "1px solid rgba(255,77,77,0.22)",
                color: "#ff6b6b",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.2s ease",
              }}
            >
              Unwatch ({selected.size})
            </button>
          </div>
        )}

        {/* Dynamic Grid Layout */}
        <div 
          key={gridSize}
          style={{ 
            display: "grid", 
            animation: "gridSwitchScale 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards",
            gridTemplateColumns:
              gridSize === 1
                ? "1fr"
                : gridSize === 2
                  ? "repeat(auto-fill, minmax(360px, 1fr))"
                  : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: gridSize === 1 ? "0.85rem" : "1.5rem"
          }}
        >
          {loading ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
              <div className="spinner" style={{ margin: "0 auto 1rem" }} />
              Loading your watchlist...
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "5rem 2rem",
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                borderRadius: "20px",
                border: "1px solid var(--border)",
              }}
            >
              {/* Custom watchlist empty icon */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "72px", height: "72px", borderRadius: "20px",
                  background: "var(--accent-soft)",
                  border: "1px solid var(--accent-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="emptyHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="var(--accent-alt)" stopOpacity="0.7" />
                      </linearGradient>
                    </defs>
                    {/* Outer heart outline */}
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      stroke="url(#emptyHeartGrad)"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    {/* Small plus inside — suggests "add to watchlist" */}
                    <line x1="12" y1="10" x2="12" y2="15" stroke="url(#emptyHeartGrad)" strokeWidth="1.5" />
                    <line x1="9.5" y1="12.5" x2="14.5" y2="12.5" stroke="url(#emptyHeartGrad)" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
              <p style={{ color: "var(--text-secondary)", fontWeight: "600", fontSize: "0.95rem", marginBottom: "0.4rem" }}>
                Nothing in your watchlist
              </p>
              <p style={{ color: "var(--text-muted)", fontWeight: "400", fontSize: "0.8rem" }}>
                Tap the heart on any item to watch it for price drops.
              </p>
              <button
                onClick={() => navigate("/")}
                style={{
                  marginTop: "1.75rem",
                  padding: "0.65rem 1.75rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                  color: "white",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                  boxShadow: "var(--shadow-accent)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-accent-lg)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-accent)"; }}
              >
                Browse Items →
              </button>
            </div>
          ) : (
            items.map((w) => {
              const isSelected = selected.has(w.item.id);
              const isHovered = hoveredId === w.item.id;

              if (gridSize === 1) {
                // List Mode
                return (
                  <div
                    key={w.id}
                    onMouseEnter={() => setHoveredId(w.item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() =>
                      hasSelection ? toggleSelect(w.item.id) : navigate(`/items/${w.item.id}`)
                    }
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)"
                        : isHovered
                        ? "var(--bg-card-hover)"
                        : "var(--bg-card)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: isSelected
                        ? "1px solid rgba(var(--accent-rgb),0.3)"
                        : isHovered
                        ? "1px solid var(--border-hover)"
                        : "1px solid var(--border)",
                      borderRadius: "20px",
                      padding: "1.25rem 1.75rem",
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: isSelected
                        ? "0 4px 20px rgba(var(--accent-rgb),0.1)"
                        : isHovered
                        ? "0 10px 40px rgba(0,0,0,0.18)"
                        : "0 4px 15px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(w.item.id);
                        }}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "6px",
                          flexShrink: 0,
                          border: isSelected ? "none" : "1.5px solid var(--border-hover)",
                          background: isSelected 
                            ? "linear-gradient(135deg, var(--accent), var(--accent-alt))"
                            : "var(--bg-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: isHovered || isSelected ? 1 : 0,
                          transform: isHovered || isSelected ? "scale(1)" : "scale(0.7)",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        {isSelected && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Small Image Placeholder Logic */}
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          flexShrink: 0,
                          border: "1.5px solid var(--border)",
                          background: "var(--bg-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {w.item.images?.[0] || w.item.imageUrl ? (
                          <img
                            src={w.item.images?.[0] || w.item.imageUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ opacity: 0.15 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: "1.05rem", 
                          fontWeight: "700", 
                          color: "var(--text-primary)", 
                          marginBottom: "0.4rem", 
                          whiteSpace: "nowrap", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis",
                          letterSpacing: "-0.3px"
                        }}>
                          {w.item.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                          <span style={{ 
                            fontSize: "1.05rem", 
                            fontWeight: "800", 
                            color: "var(--accent)"
                          }}>
                            ₹{w.item.price?.toLocaleString()}
                          </span>
                          {w.priceHistory?.[0] && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "rgba(239,68,68,0.1)", padding: "1px 8px", borderRadius: "20px" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <polyline points="19 12 12 19 5 12"></polyline>
                              </svg>
                              <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "#ef4444" }}>
                                {Math.round(((w.priceHistory[0].oldPrice - w.item.price) / w.priceHistory[0].oldPrice) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Just like Dashboard */}
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <button
                          onClick={(e) => toggleHistory(w.item.id, e)}
                          style={{
                            padding: "0.45rem 1rem",
                            borderRadius: "10px",
                            background: expandedIds.has(w.item.id) ? "var(--bg-surface)" : "var(--bg-card)",
                            border: "1px solid var(--border)",
                            color: expandedIds.has(w.item.id) ? "var(--accent)" : "var(--text-muted)",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            style={{ 
                              transform: expandedIds.has(w.item.id) ? "rotate(180deg)" : "none",
                              transition: "transform 0.3s ease"
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          History
                        </button>
                      </div>
                    </div>

                    {/* Expandable History Content */}
                    {expandedIds.has(w.item.id) && (
                      <div 
                        style={{ 
                          marginTop: "0.5rem",
                          marginLeft: "135px",
                          padding: "1rem", 
                          background: "var(--bg-surface)", 
                          borderRadius: "14px", 
                          border: "1px solid var(--border)",
                          animation: "fadeSlideIn 0.3s ease"
                        }}
                      >
                        <div style={{ fontSize: "0.65rem", fontWeight: "700", color: "var(--text-ghost)", marginBottom: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Full Price History
                        </div>
                        {w.priceHistory?.length > 0 ? (
                          w.priceHistory.map((h, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                               <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "120px" }}>
                                 <span style={{ fontSize: "0.8rem", textDecoration: "line-through", color: "var(--text-muted)" }}>₹{h.oldPrice.toLocaleString()}</span>
                                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                                 <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--text-primary)" }}>₹{h.price.toLocaleString()}</span>
                               </div>
                               <div style={{ fontSize: "0.7rem", color: "var(--text-ghost)" }}>
                                 {new Date(h.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                               </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}> No price drops recorded yet. </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Grid Mode
                return (
                  <div
                    key={w.id}
                    onMouseEnter={() => setHoveredId(w.item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => hasSelection ? toggleSelect(w.item.id) : navigate(`/items/${w.item.id}`)}
                    style={{
                      background: isSelected ? "var(--glass-bg-hover)" : "var(--glass-bg)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: isSelected ? "1px solid var(--accent)" : "1px solid var(--glass-border)",
                      borderRadius: "24px",
                      padding: "1rem",
                      boxShadow: isSelected ? "0 15px 35px rgba(var(--accent-rgb),0.2)" : isHovered ? "0 20px 40px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(w.item.id);
                      }}
                      style={{
                        position: "absolute",
                        top: "1rem",
                        left: "1rem",
                        zIndex: 10,
                        width: "22px",
                        height: "22px",
                        borderRadius: "7px",
                        border: isSelected ? "none" : "1.5px solid var(--border-hover)",
                        background: isSelected ? "var(--accent)" : "var(--bg-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isHovered || isSelected ? 1 : 0,
                        transform: isHovered || isSelected ? "scale(1)" : "scale(0.7)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div 
                      style={{ 
                        position: "relative", 
                        height: "180px", 
                        borderRadius: "14px", 
                        overflow: "hidden", 
                        marginBottom: "0.75rem",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {w.item.images?.[0] || w.item.imageUrl ? (
                        <img 
                          src={w.item.images?.[0] || w.item.imageUrl} 
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-ghost)", opacity: 0.15 }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      )}
                      {w.priceHistory?.[0] && (
                        <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "900", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                          -{Math.round(((w.priceHistory[0].oldPrice - w.item.price) / w.priceHistory[0].oldPrice) * 100)}%
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.3rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.item.title}</h3>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                         <span style={{ fontSize: "0.95rem", fontWeight: "900", color: "var(--accent)" }}>₹{w.item.price?.toLocaleString()}</span>
                         {w.priceHistory?.[0] && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#ef4444" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <polyline points="19 12 12 19 5 12"></polyline>
                            </svg>
                            <span style={{ fontSize: "0.8rem", fontWeight: "900" }}>
                              {Math.round(((w.priceHistory[0].oldPrice - w.item.price) / w.priceHistory[0].oldPrice) * 100)}%
                            </span>
                          </div>
                        )}

                        <button
                          onClick={(e) => toggleHistory(w.item.id, e)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            borderRadius: "8px",
                            background: expandedIds.has(w.item.id) ? "var(--bg-surface)" : "var(--bg-card)",
                            border: "1px solid var(--border)",
                            color: expandedIds.has(w.item.id) ? "var(--accent)" : "var(--text-muted)",
                            fontSize: "0.65rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            style={{ 
                              transform: expandedIds.has(w.item.id) ? "rotate(180deg)" : "none",
                              transition: "transform 0.3s ease"
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          History
                        </button>
                      </div>

                      {/* Expanded History for Grid */}
                      {expandedIds.has(w.item.id) && w.priceHistory?.length > 0 && (
                        <div 
                          style={{ 
                            marginTop: "0.75rem", 
                            padding: "0.6rem", 
                            background: "rgba(255,255,255,0.03)", 
                            borderRadius: "14px", 
                            border: "1px solid rgba(255,255,255,0.08)",
                            animation: "fadeSlideIn 0.2s ease"
                          }}
                        >
                          <div style={{ fontSize: "0.62rem", fontWeight: "700", color: "var(--text-ghost)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Price History</div>
                          {w.priceHistory.map((h, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: i === w.priceHistory.length - 1 ? 0 : "6px" }}>
                              <span style={{ fontSize: "0.7rem", textDecoration: "line-through", color: "var(--text-muted)" }}>₹{h.oldPrice.toLocaleString()}</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                              <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--text-primary)" }}>₹{h.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .dash-back-btn {
            position: static !important;
            margin-bottom: 1rem;
          }
        }
        @media (max-width: 480px) {
          .dash-wrapper { padding: 3rem 1.25rem !important; }
        }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gridSwitchScale {
          0% { opacity: 0; transform: scale(0.98) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Bulk Unwatch Modal */}
      {bulkConfirm && (
        <div
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
            animation: "fadeSlideIn 0.2s ease",
          }}
          onClick={() => setBulkConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-hover)",
              borderRadius: "24px",
              padding: "2.5rem",
              width: "420px",
              maxWidth: "92vw",
              textAlign: "center",
              boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
            }}
          >
             <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "900", marginBottom: "0.75rem", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
              Unwatch {selected.size} items?
            </h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "2rem", lineHeight: "1.5" }}>
              You'll stop receiving price drop and status updates for these items.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button 
                onClick={() => setBulkConfirm(false)}
                style={{ flex: 1, padding: "0.9rem", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
              >
                Keep them
              </button>
              <button 
                onClick={handleBulkUnwatch}
                style={{ flex: 1, padding: "0.9rem", borderRadius: "14px", background: "#ef4444", border: "none", color: "white", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 8px 20px rgba(239,68,68,0.25)" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}