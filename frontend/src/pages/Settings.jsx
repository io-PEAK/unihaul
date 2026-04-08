import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { useTheme } from "../ThemeContext";

/* ─── InstitutionSearch ─────────────────────────────────────────────── */
function InstitutionSearch({ value, type, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  useEffect(() => {
    setQuery(value || "");
  }, [value]);
  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      onSelect({ name: "", city: "", state: "" });
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await API.get("/institutions/search", {
          params: { q, type: type || "all", limit: 8 },
        });
        setResults(res.data || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  }
  function pick(inst) {
    setQuery(inst.name);
    setOpen(false);
    setResults([]);
    onSelect(inst);
  }
  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={
            type === "school" ? "Search your school…" : "Search your college…"
          }
          className="st-inp"
          style={{
            width: "100%",
            paddingLeft: "2.5rem",
            paddingRight: "1rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
            fontSize: "0.9rem",
            borderRadius: "var(--radius-sm)",
            outline: "none",
            background: "var(--bg-input)",
            border: "1.5px solid var(--border)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            if (query) setOpen(true);
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border)";
            e.target.style.boxShadow = "none";
          }}
        />
        <svg
          style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {loading && (
          <div
            style={{
              position: "absolute",
              right: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "stSpin 0.6s linear infinite",
            }}
          />
        )}
      </div>
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--bg-surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            zIndex: 200,
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {results.map((inst, i) => (
            <div
              key={i}
              onClick={() => pick(inst)}
              style={{
                padding: "0.75rem 1.125rem",
                cursor: "pointer",
                borderBottom:
                  i < results.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-card-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {inst.name}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "0.125rem",
                  }}
                >
                  {[inst.city, inst.state].filter(Boolean).join(", ")}
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "999px",
                  background:
                    inst.type === "college"
                      ? "var(--accent-soft)"
                      : "rgba(34,197,94,0.1)",
                  color: inst.type === "college" ? "var(--accent)" : "#16a34a",
                  border:
                    inst.type === "college"
                      ? "1px solid var(--accent-border)"
                      : "1px solid rgba(34,197,94,0.2)",
                  marginLeft: "0.75rem",
                  flexShrink: 0,
                }}
              >
                {inst.type}
              </span>
            </div>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && query.trim().length > 1 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--bg-surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--radius-md)",
            zIndex: 200,
            padding: "1.25rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            No results — type it manually above
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CreatePasswordPanel (Google users) ───────────────────────────── */
function CreatePasswordPanel({ onSuccess }) {
  const [form, setForm] = useState({ newPass: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showN, setShowN] = useState(false);
  const [showC, setShowC] = useState(false);
  const Eye = ({ show }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {show ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
  const PwIn = ({ val, setter, show, toggle, ph }) => (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={val}
        onChange={(e) => setter(e.target.value)}
        placeholder={ph}
        className="st-inp"
        style={{ ...IS, paddingRight: "2.5rem" }}
      />
      <button
        type="button"
        onClick={toggle}
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 0,
          display: "flex",
        }}
      >
        <Eye show={show} />
      </button>
    </div>
  );
  async function handleCreate() {
    if (!form.newPass || !form.confirm) {
      setError("All fields required");
      return;
    }
    if (form.newPass.length < 8) {
      setError("Min 8 characters");
      return;
    }
    if (form.newPass !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await API.post("/users/create-password", { newPassword: form.newPass });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...stored, authProvider: "both" };
      localStorage.setItem("user", JSON.stringify(updated));
      onSuccess && onSuccess(updated);
    } catch (err) {
      setError(err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          lineHeight: "1.6",
        }}
      >
        Create a password so you can also log in with your email directly.
      </div>
      <div
        className="st-grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.875rem",
        }}
      >
        <div>
          <label style={LS}>New Password</label>
          <PwIn
            val={form.newPass}
            setter={(v) => setForm((f) => ({ ...f, newPass: v }))}
            show={showN}
            toggle={() => setShowN((s) => !s)}
            ph="Min 8 chars"
          />
        </div>
        <div>
          <label style={LS}>Confirm</label>
          <PwIn
            val={form.confirm}
            setter={(v) => setForm((f) => ({ ...f, confirm: v }))}
            show={showC}
            toggle={() => setShowC((s) => !s)}
            ph="Repeat password"
          />
        </div>
      </div>
      {error && (
        <div
          style={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: "600" }}
        >
          {error}
        </div>
      )}
      <button
        onClick={handleCreate}
        disabled={loading}
        style={{ ...AB, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Saving…" : "Create Password"}
      </button>
    </div>
  );
}

/* ─── Toggle ────────────────────────────────────────────────────────── */
function Toggle({ value, onChange, label, desc, disabled = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.1rem 1.25rem",
        borderRadius: "var(--radius-md)",
        marginBottom: "0.625rem",
        background: "var(--bg-input)",
        border: "1.5px solid var(--border)",
        opacity: disabled ? 0.45 : 1,
      }}
      onMouseEnter={(e) =>
        !disabled && (e.currentTarget.style.borderColor = "var(--border-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      <div>
        <div
          style={{
            fontSize: "0.88rem",
            fontWeight: "600",
            color: "var(--text-primary)",
          }}
        >
          {label}
        </div>
        {desc && (
          <div
            style={{
              fontSize: "0.76rem",
              marginTop: "0.2rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            {desc}
          </div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        style={{
          position: "relative",
          flexShrink: 0,
          width: "46px",
          height: "25px",
          borderRadius: "13px",
          background: value ? "var(--accent)" : "var(--border-hover)",
          cursor: disabled ? "not-allowed" : "pointer",
          border: "none",
          marginLeft: "1.25rem",
          transition: "background 0.25s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "3.5px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
            transition: "left 0.25s",
            left: value ? "25px" : "3.5px",
          }}
        />
      </button>
    </div>
  );
}

/* ─── ThemeCard ─────────────────────────────────────────────────────── */
function ThemeCard({ t, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "1.125rem",
        borderRadius: "var(--radius-lg)",
        cursor: "pointer",
        position: "relative",
        border: isActive
          ? "2px solid var(--accent)"
          : "2px solid var(--border)",
        background: isActive ? "var(--accent-soft)" : "var(--bg-input)",
        transition: "all 0.18s",
        fontFamily: "var(--font-body)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.background = "var(--bg-card-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--bg-input)";
        }
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <div style={{ display: "flex", gap: "7px", marginBottom: "0.875rem" }}>
        {t.preview.map((c, i) => (
          <div
            key={i}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: c,
              border: "2px solid var(--border)",
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: "700",
          color: isActive ? "var(--accent)" : "var(--text-primary)",
        }}
      >
        {t.label}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          marginTop: "0.2rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        {t.desc}
      </div>
    </button>
  );
}

/* ─── FloatingButtonsCard ──────────────────────────────────────────── */
function FloatingButtonsCard() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("floatingDraggable") ?? "false");
    } catch {
      return false;
    }
  });

  function handleChange(v) {
    setEnabled(v);
    localStorage.setItem("floatingDraggable", JSON.stringify(v));
    window.dispatchEvent(new Event("floatingDraggableChanged"));
    if (!v) {
      ["drag_themetoggle", "drag_messagebtn", "drag_backbtn"].forEach((k) =>
        localStorage.removeItem(k),
      );
    }
  }

  return (
    <SectionCard
      title="Floating Buttons"
      subtitle="Drag the back button, messages, and theme toggle anywhere on screen"
      icon={
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
        </svg>
      }
    >
      <Toggle
        value={enabled}
        onChange={handleChange}
        label="Draggable floating buttons"
        desc="Move back, messages, and theme buttons freely. Positions are saved per device."
      />
    </SectionCard>
  );
}

/* ─── DeleteAccountDialog ───────────────────────────────────────────── */
function DeleteAccountDialog({ open, onConfirm, onCancel, loading }) {
  const [typed, setTyped] = useState("");
  if (!open) return null;
  const confirmed = typed.trim().toLowerCase() === "delete";
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
      }}
    >
      <div
        className="st-modal"
        style={{
          width: "400px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          animation: "stSlideUp 0.22s ease",
        }}
      >
        <div
          style={{
            height: "3px",
            background: "linear-gradient(90deg,#ef4444,#f87171)",
          }}
        />
        <div style={{ padding: "1.75rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.125rem",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Delete your account?
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              lineHeight: "1.7",
              marginBottom: "1.25rem",
            }}
          >
            Permanently deletes all listings, messages and history.{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              Cannot be undone.
            </strong>
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.7rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "0.4rem",
              }}
            >
              Type <span style={{ color: "#ef4444" }}>delete</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="delete"
              style={{
                width: "100%",
                padding: "0.7rem 0.875rem",
                fontSize: "0.9rem",
                borderRadius: "var(--radius-sm)",
                outline: "none",
                background: "var(--bg-input)",
                border: `1.5px solid ${confirmed ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "0.7rem",
                background: "var(--bg-input)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => confirmed && !loading && onConfirm()}
              disabled={!confirmed || loading}
              style={{
                flex: 1,
                padding: "0.7rem",
                background: confirmed
                  ? "rgba(239,68,68,0.12)"
                  : "var(--bg-input)",
                border: `1.5px solid ${confirmed ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)",
                color: confirmed ? "#ef4444" : "var(--text-muted)",
                fontSize: "0.85rem",
                fontWeight: "700",
                cursor: confirmed && !loading ? "pointer" : "not-allowed",
                fontFamily: "var(--font-body)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading && (
                <div
                  style={{
                    width: "13px",
                    height: "13px",
                    border: "2px solid rgba(239,68,68,0.3)",
                    borderTopColor: "#ef4444",
                    borderRadius: "50%",
                    animation: "stSpin 0.6s linear infinite",
                  }}
                />
              )}
              {loading ? "Deleting…" : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ChangeEmailPanel ──────────────────────────────────────────────── */
function ChangeEmailPanel({ currentEmail, onSuccess }) {
  const [step, setStep] = useState("idle");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);
  const otpInputRef = useRef(null);
  function startCountdown() {
    setCountdown(60);
    timerRef.current = setInterval(
      () =>
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        }),
      1000,
    );
  }
  async function sendOtp() {
    if (!newEmail.trim()) {
      setError("Please enter a new email");
      return;
    }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setError("Must be different from current email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setError("Invalid email address");
      return;
    }
    try {
      setStep("sending");
      setError("");
      await API.post("/users/send-otp", { type: "email_change" });
      setStep("otp_sent");
      startCountdown();
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
      setStep("idle");
    }
  }
  async function submit(otpVal) {
    const v = otpVal || otp;
    if (!v.trim()) {
      setError("Enter the OTP");
      return;
    }
    try {
      setStep("submitting");
      setError("");
      const res = await API.post("/users/change-email", {
        otp: v,
        newEmail: newEmail.trim(),
      });
      setStep("done");
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change email");
      setStep("otp_sent");
    }
  }
  if (step === "done")
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 1.125rem",
          borderRadius: "var(--radius-sm)",
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e",
          fontSize: "0.85rem",
          fontWeight: "600",
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
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Email changed to {newEmail}
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div>
        <label style={LS}>New Email Address</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && sendOtp()}
            placeholder="your@newemail.com"
            type="email"
            disabled={step !== "idle"}
            className="st-inp"
            style={{ ...IS, flex: 1, opacity: step !== "idle" ? 0.55 : 1 }}
          />
          {step === "idle" && (
            <button onClick={sendOtp} style={AB}>
              Send OTP
            </button>
          )}
          {step === "sending" && (
            <div
              style={{
                width: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  animation: "stSpin 0.6s linear infinite",
                }}
              />
            </div>
          )}
          {(step === "otp_sent" || step === "submitting") && (
            <button
              onClick={() => {
                setStep("idle");
                setOtp("");
                setError("");
              }}
              style={{
                ...GB,
                width: "44px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {(step === "otp_sent" || step === "submitting") && (
        <div style={{ animation: "stFadeUp 0.22s ease" }}>
          <div
            style={{
              padding: "0.625rem 0.875rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              fontSize: "0.73rem",
              color: "var(--accent)",
              marginBottom: "0.875rem",
            }}
          >
            OTP sent to <strong>{currentEmail}</strong>
          </div>
          <label style={LS}>6-digit OTP</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              ref={otpInputRef}
              value={otp}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(v);
                setError("");
                if (v.length === 6 && step !== "submitting") submit(v);
              }}
              placeholder="••••••"
              maxLength={6}
              disabled={step === "submitting"}
              className="st-inp"
              style={{
                flex: 1,
                padding: "0.75rem",
                fontSize: "1.1rem",
                fontWeight: "700",
                letterSpacing: "0.3em",
                borderRadius: "var(--radius-sm)",
                outline: "none",
                background: "var(--bg-input)",
                border: "1.5px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "monospace",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => submit()}
              disabled={step === "submitting" || otp.length < 6}
              style={{
                ...AB,
                opacity: step === "submitting" || otp.length < 6 ? 0.45 : 1,
              }}
            >
              {step === "submitting" ? "Verifying…" : "Confirm"}
            </button>
          </div>
          <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
            <button
              onClick={countdown === 0 ? sendOtp : undefined}
              disabled={countdown > 0}
              style={{
                fontSize: "0.72rem",
                fontWeight: "600",
                color: countdown > 0 ? "var(--text-muted)" : "var(--accent)",
                background: "none",
                border: "none",
                cursor: countdown > 0 ? "default" : "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div
          style={{ fontSize: "0.76rem", color: "#ef4444", fontWeight: "500" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/* ─── ChangePasswordPanel ───────────────────────────────────────────── */
function ChangePasswordPanel() {
  const [mode, setMode] = useState("normal");
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showCo, setShowCo] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);
  function startCountdown() {
    setCountdown(60);
    timerRef.current = setInterval(
      () =>
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        }),
      1000,
    );
  }
  async function handleChange() {
    if (!form.current || !form.newPass || !form.confirm) {
      setError("All fields required");
      return;
    }
    if (form.newPass.length < 8) {
      setError("Min 8 characters");
      return;
    }
    if (form.newPass !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await API.post("/users/change-password", {
        currentPassword: form.current,
        newPassword: form.newPass,
      });
      setSuccess("Password changed");
      setForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }
  async function handleForgot() {
    try {
      setLoading(true);
      setError("");
      await API.post("/users/send-otp", { type: "password_reset" });
      setMode("otp");
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }
  async function handleReset() {
    if (!otp || !newPass || !confirmPass) {
      setError("All fields required");
      return;
    }
    if (newPass.length < 8) {
      setError("Min 8 characters");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await API.post("/users/reset-password", { otp, newPassword: newPass });
      setSuccess("Password reset");
      setMode("normal");
    } catch (err) {
      setError(err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  }
  const Eye = ({ show }) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {show ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
  const PwIn = ({ val, setter, show, toggle, ph }) => (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={val}
        onChange={(e) => setter(e.target.value)}
        placeholder={ph}
        className="st-inp"
        style={{ ...IS, paddingRight: "2.5rem" }}
      />
      <button
        type="button"
        onClick={toggle}
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          padding: 0,
          display: "flex",
        }}
      >
        <Eye show={show} />
      </button>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      {mode === "normal" && (
        <>
          <div>
            <label style={LS}>Current Password</label>
            <PwIn
              val={form.current}
              setter={(v) => setForm((f) => ({ ...f, current: v }))}
              show={showC}
              toggle={() => setShowC((s) => !s)}
              ph="Enter current password"
            />
          </div>
          <div
            className="st-grid-2"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.875rem",
            }}
          >
            <div>
              <label style={LS}>New Password</label>
              <PwIn
                val={form.newPass}
                setter={(v) => setForm((f) => ({ ...f, newPass: v }))}
                show={showN}
                toggle={() => setShowN((s) => !s)}
                ph="Min 8 chars"
              />
            </div>
            <div>
              <label style={LS}>Confirm</label>
              <PwIn
                val={form.confirm}
                setter={(v) => setForm((f) => ({ ...f, confirm: v }))}
                show={showCo}
                toggle={() => setShowCo((s) => !s)}
                ph="Repeat password"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={handleChange}
              disabled={loading}
              style={{ ...AB, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Saving…" : "Change Password"}
            </button>
            <button
              onClick={() => {
                setMode("forgot");
                setError("");
              }}
              style={{
                fontSize: "0.73rem",
                fontWeight: "600",
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Forgot?
            </button>
          </div>
        </>
      )}
      {mode === "forgot" && (
        <div
          style={{
            padding: "1.125rem",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            border: "1.5px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            Reset via email OTP
          </div>
          <div
            style={{
              fontSize: "0.73rem",
              color: "var(--text-muted)",
              marginBottom: "0.875rem",
              lineHeight: "1.6",
            }}
          >
            A 6-digit code will be sent to your registered email.
          </div>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button
              onClick={handleForgot}
              disabled={loading}
              style={{ ...AB, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Sending…" : "Send Code"}
            </button>
            <button
              onClick={() => {
                setMode("normal");
                setError("");
              }}
              style={GB}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {mode === "otp" && (
        <>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-border)",
              fontSize: "0.76rem",
              color: "var(--accent)",
            }}
          >
            Reset code sent — check your email
          </div>
          <div>
            <label style={LS}>Code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="••••••"
              maxLength={6}
              className="st-inp"
              style={{
                ...IS,
                fontFamily: "monospace",
                letterSpacing: "0.2em",
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: "700",
              }}
            />
          </div>
          <div
            className="st-grid-2"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.875rem",
            }}
          >
            <div>
              <label style={LS}>New Password</label>
              <PwIn
                val={newPass}
                setter={setNewPass}
                show={showN}
                toggle={() => setShowN((s) => !s)}
                ph="Min 8 chars"
              />
            </div>
            <div>
              <label style={LS}>Confirm</label>
              <PwIn
                val={confirmPass}
                setter={setConfirmPass}
                show={showCo}
                toggle={() => setShowCo((s) => !s)}
                ph="Repeat password"
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={handleReset}
              disabled={loading}
              style={{ ...AB, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Resetting…" : "Set New Password"}
            </button>
            <button
              onClick={countdown === 0 ? handleForgot : undefined}
              disabled={countdown > 0}
              style={{
                fontSize: "0.72rem",
                fontWeight: "600",
                color: countdown > 0 ? "var(--text-muted)" : "var(--accent)",
                background: "none",
                border: "none",
                cursor: countdown > 0 ? "not-allowed" : "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
            </button>
          </div>
        </>
      )}
      {error && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "#ef4444",
            fontWeight: "500",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── AvatarCropModal ───────────────────────────────────────────────── */
function AvatarCropModal({ src, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [canvasH, setCanvasH] = useState(320);
  const [sizePct, setSizePct] = useState(82);
  const cropRef = useRef({ x: 0, y: 0, r: 0 });
  const dragRef = useRef(null);
  const trackDragging = useRef(false);
  const W = 420;
  function sizeToR(pct, cw, ch, img) {
    const sc = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const mxR = Math.min(img.naturalWidth * sc, img.naturalHeight * sc) / 2;
    return 20 + (mxR - 20) * (pct / 100);
  }
  function draw() {
    const cv = canvasRef.current;
    const im = imgRef.current;
    if (!cv || !im) return;
    const ctx = cv.getContext("2d");
    const cw = cv.width;
    const ch = cv.height;
    const { x, y, r } = cropRef.current;
    const sc = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
    const dw = im.naturalWidth * sc;
    const dh = im.naturalHeight * sc;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.drawImage(im, dx, dy, dw, dh);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(im, dx, dy, dw, dh);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  function initCrop() {
    const im = imgRef.current;
    const cv = canvasRef.current;
    if (!im || !cv) return;
    const cw = cv.width;
    const ch = cv.height;
    const sc = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
    const dw = im.naturalWidth * sc;
    const dh = im.naturalHeight * sc;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    cropRef.current = {
      x: dx + dw / 2,
      y: dy + dh / 2,
      r: sizeToR(82, cw, ch, im),
    };
    draw();
  }
  function resizeTo(next) {
    next = Math.max(10, Math.min(100, next));
    setSizePct(next);
    const cv = canvasRef.current;
    const im = imgRef.current;
    if (cv && im) {
      const cw = cv.width;
      const ch = cv.height;
      const sc = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
      const dw = im.naturalWidth * sc;
      const dh = im.naturalHeight * sc;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      const r = sizeToR(next, cw, ch, im);
      cropRef.current.r = r;
      cropRef.current.x = Math.max(
        dx + r,
        Math.min(dx + dw - r, cropRef.current.x),
      );
      cropRef.current.y = Math.max(
        dy + r,
        Math.min(dy + dh - r, cropRef.current.y),
      );
      draw();
    }
    return next;
  }
  function getPos(e, cv) {
    const rc = cv.getBoundingClientRect();
    const sx = cv.width / rc.width;
    const sy = cv.height / rc.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy2 = e.touches ? e.touches[0].clientY : e.clientY;
    return { px: (cx - rc.left) * sx, py: (cy2 - rc.top) * sy };
  }
  function onDown(e) {
    e.preventDefault();
    const { px, py } = getPos(e, canvasRef.current);
    dragRef.current = {
      startX: px,
      startY: py,
      startCX: cropRef.current.x,
      startCY: cropRef.current.y,
    };
  }
  function onMove(e) {
    if (!dragRef.current) return;
    e.preventDefault();
    const { px, py } = getPos(e, canvasRef.current);
    const cv = canvasRef.current;
    const im = imgRef.current;
    const cw = cv.width;
    const ch = cv.height;
    const sc = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
    const dw = im.naturalWidth * sc;
    const dh = im.naturalHeight * sc;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    const r = cropRef.current.r;
    cropRef.current.x = Math.max(
      dx + r,
      Math.min(
        dx + dw - r,
        dragRef.current.startCX + (px - dragRef.current.startX),
      ),
    );
    cropRef.current.y = Math.max(
      dy + r,
      Math.min(
        dy + dh - r,
        dragRef.current.startCY + (py - dragRef.current.startY),
      ),
    );
    draw();
  }
  function onUp() {
    dragRef.current = null;
  }
  function handleConfirm() {
    const im = imgRef.current;
    const cv = canvasRef.current;
    const { x, y, r } = cropRef.current;
    const cw = cv.width;
    const ch = cv.height;
    const sc = Math.min(cw / im.naturalWidth, ch / im.naturalHeight);
    const dw = im.naturalWidth * sc;
    const dh = im.naturalHeight * sc;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    const out = document.createElement("canvas");
    out.width = 400;
    out.height = 400;
    out
      .getContext("2d")
      .drawImage(
        im,
        (x - dx - r) / sc,
        (y - dy - r) / sc,
        (r * 2) / sc,
        (r * 2) / sc,
        0,
        0,
        400,
        400,
      );
    out.toBlob((blob) => onConfirm(blob), "image/jpeg", 0.92);
  }
  function onImgLoad() {
    const im = imgRef.current;
    setCanvasH(
      Math.min(Math.round(W * (im.naturalHeight / im.naturalWidth)), 480),
    );
    setLoaded(true);
  }
  useEffect(() => {
    if (loaded) initCrop();
  }, [loaded, canvasH]); // eslint-disable-line
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="st-crop-inner"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          overflow: "hidden",
          width: `${W}px`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          animation: "stSlideUp 0.2s ease",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem 0.875rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: "800",
                background:
                  "linear-gradient(135deg,var(--accent),var(--accent-alt))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Crop Photo
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                marginTop: "0.15rem",
              }}
            >
              Drag to reposition · +/− to resize
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-body)",
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{ position: "relative", background: "#0a0a0a", lineHeight: 0 }}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={canvasH}
            style={{
              width: "100%",
              display: "block",
              cursor: "move",
              userSelect: "none",
            }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          />
          {!loaded && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  border: "2.5px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "stSpin 0.7s linear infinite",
                }}
              />
            </div>
          )}
          {loaded && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid var(--border-hover)",
                borderRadius: "40px",
                padding: "5px 8px",
              }}
            >
              <button
                onClick={() => resizeTo(sizePct - 10)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid var(--border-hover)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <div
                style={{
                  position: "relative",
                  width: "80px",
                  height: "4px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => {
                  trackDragging.current = true;
                  const rc = e.currentTarget.getBoundingClientRect();
                  const calc = (cx) =>
                    Math.max(
                      0,
                      Math.min(
                        100,
                        Math.round(((cx - rc.left) / rc.width) * 100),
                      ),
                    );
                  resizeTo(calc(e.clientX));
                  const mv = (e2) => {
                    if (trackDragging.current) resizeTo(calc(e2.clientX));
                  };
                  const up = () => {
                    trackDragging.current = false;
                    window.removeEventListener("mousemove", mv);
                    window.removeEventListener("mouseup", up);
                  };
                  window.addEventListener("mousemove", mv);
                  window.addEventListener("mouseup", up);
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${sizePct}%`,
                    background:
                      "linear-gradient(90deg,var(--accent),var(--accent-alt))",
                    borderRadius: "2px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${sizePct}%`,
                    transform: "translate(-50%,-50%)",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
              <button
                onClick={() => resizeTo(sizePct + 10)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid var(--border-hover)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          )}
          <img
            ref={imgRef}
            src={src}
            alt=""
            style={{ display: "none" }}
            onLoad={onImgLoad}
          />
        </div>
        <div
          style={{
            padding: "0.875rem 1.25rem",
            display: "flex",
            gap: "0.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.625rem",
              background: "transparent",
              border: "1.5px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text-secondary)",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: "0.625rem",
              background:
                "linear-gradient(135deg,var(--accent),var(--accent-alt))",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Use This Photo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared atoms ──────────────────────────────────────────────────── */
const LS = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--text-muted)",
  marginBottom: "0.4rem",
  fontFamily: "var(--font-body)",
};
const IS = {
  width: "100%",
  padding: "0.72rem 0.875rem",
  fontSize: "0.9rem",
  lineHeight: "1.4",
  borderRadius: "var(--radius-sm)",
  outline: "none",
  background: "var(--bg-input)",
  border: "1.5px solid var(--border)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};
const AB = {
  padding: "0.65rem 1.25rem",
  borderRadius: "var(--radius-sm)",
  fontSize: "0.85rem",
  fontWeight: "700",
  cursor: "pointer",
  border: "none",
  fontFamily: "var(--font-body)",
  background: "linear-gradient(135deg,var(--accent),var(--accent-alt))",
  color: "white",
  whiteSpace: "nowrap",
};
const GB = {
  padding: "0.65rem 1.125rem",
  borderRadius: "var(--radius-sm)",
  fontSize: "0.85rem",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "var(--font-body)",
  background: "var(--bg-input)",
  border: "1.5px solid var(--border)",
  color: "var(--text-secondary)",
  whiteSpace: "nowrap",
};

function F({ label, children, hint, style = {} }) {
  return (
    <div style={{ marginBottom: "1.25rem", ...style }}>
      {label && <label style={LS}>{label}</label>}
      {children}
      {hint && (
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            marginTop: "0.3rem",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function Accordion({ title, icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        border: "1.5px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.9rem 1.125rem",
          background: open ? "var(--bg-card-hover)" : "var(--bg-input)",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: "var(--accent)", display: "flex" }}>
            {icon}
          </span>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </span>
        </div>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            padding: "1.125rem",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Saved() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.4rem 0.875rem",
        borderRadius: "999px",
        background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.25)",
        fontSize: "0.78rem",
        fontWeight: "700",
        color: "#22c55e",
        animation: "stFadeUp 0.25s ease",
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Saved
    </span>
  );
}

const PaintIcon = ({ sz = 16, col = "var(--accent)" }) => (
  <svg
    width={sz}
    height={sz}
    viewBox="0 0 24 24"
    fill="none"
    stroke={col}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="13.5" cy="6.5" r="0.5" fill={col} />
    <circle cx="17.5" cy="10.5" r="0.5" fill={col} />
    <circle cx="8.5" cy="7.5" r="0.5" fill={col} />
    <circle cx="6.5" cy="12.5" r="0.5" fill={col} />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════ */
export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, setThemeById, themes } = useTheme();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      firstName: "",
      lastName: "",
      phone: "",
      bio: "",
      institutionType: "",
      institution: "",
      city: "",
      state: "",
      notificationsEnabled: u.notificationsEnabled ?? true,
      messageNotificationsEnabled: u.messageNotificationsEnabled ?? true,
      priceDropAlerts: u.priceDropAlerts ?? true,
    };
  });
  const [changingType, setChangingType] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const validSections = [
    "profile",
    "institution",
    "appearance",
    "notifications",
    "account",
  ];
  const sectionParam = searchParams.get("section");
  const [activeSection, setActiveSection] = useState(
    validSections.includes(sectionParam) ? sectionParam : "profile",
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [cropSrc, setCropSrc] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const savedFormRef = useRef(null);
  const saveBarRef = useRef(null);

  const [navH, setNavH] = useState(64);
  useEffect(() => {
    const measure = () => {
      const nav =
        document.querySelector("nav") || document.querySelector("header");
      if (nav) setNavH(nav.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/users/me");
        const u = res.data;
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
        const loaded = {
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
          bio: u.bio || "",
          institutionType: u.institutionType || "",
          institution: u.institution || "",
          city: u.city || "",
          state: u.state || "",
          notificationsEnabled: u.notificationsEnabled ?? true,
          messageNotificationsEnabled: u.messageNotificationsEnabled ?? true,
          priceDropAlerts: u.priceDropAlerts ?? true,
        };
        setForm(loaded);
        savedFormRef.current = loaded;
        if (u.theme && !localStorage.getItem("theme")) setThemeById(u.theme);
      } catch {
        if (user) {
          const loaded = {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            bio: user.bio || "",
            institutionType: user.institutionType || "",
            institution: user.institution || "",
            city: user.city || "",
            state: user.state || "",
            notificationsEnabled: user.notificationsEnabled ?? true,
            messageNotificationsEnabled:
              user.messageNotificationsEnabled ?? true,
            priceDropAlerts: user.priceDropAlerts ?? true,
          };
          setForm(loaded);
          savedFormRef.current = loaded;
        }
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []); // eslint-disable-line

  const sections = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: "institution",
      label: "Institution",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <PaintIcon sz={14} col="currentColor" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      id: "password",
      label: "Password",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      id: "account",
      label: "Account",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const changeSection = (id) => {
    if (savedFormRef.current) setForm({ ...savedFormRef.current });
    setActiveSection(id);
    setSaved(false);
    setError("");
    setAvatarError("");
  };
  const upd = (u) => {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  async function uploadCropped(blob) {
    setAvatarUploading(true);
    setAvatarError("");
    setShowCrop(false);
    try {
      const fd = new FormData();
      fd.append("image", blob, "avatar.jpg");
      const res = await API.post("/upload/avatar", fd);
      await API.put("/users/profile", { avatar: res.data.url });
      upd({ ...user, avatar: res.data.url });
    } catch (err) {
      const s = err?.response?.status;
      setAvatarError(
        s === 413
          ? "Photo over 5MB"
          : s === 400
            ? "Invalid file type"
            : "Upload failed",
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  function extractPublicId(url) {
    if (!url) return null;
    const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[a-z]+)?$/);
    return m ? m[1] : null;
  }

  async function handleToggle(key, val) {
    set(key, val);
    try {
      await API.put("/users/profile", { [key]: val });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, [key]: val }));
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch {}
  }

  async function handleSave() {
    if (!form.firstName.trim()) {
      setError("First name cannot be empty");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await API.put("/users/profile", {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        bio: form.bio,
        institutionType: form.institutionType,
        institution: form.institution,
        city: form.city,
        state: form.state,
        notificationsEnabled: form.notificationsEnabled,
        messageNotificationsEnabled: form.messageNotificationsEnabled,
        theme,
      });
      upd({ ...user, ...res.data });
      savedFormRef.current = { ...form };
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleThemeChange(id) {
    setThemeById(id);
    API.put("/users/profile", { theme: id }).catch(() => {});
    upd({ ...user, theme: id });
  }

  async function handleDeleteAccount() {
    try {
      setDeleting(true);
      await API.delete("/users/account");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/register");
    } catch (err) {
      setDeleting(false);
      setShowDeleteDialog(false);
      setError(err.response?.data?.error || "Failed");
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const noSave = [
    "appearance",
    "account",
    "notifications",
    "password",
  ].includes(activeSection);
  const isDirty =
    !noSave &&
    !!savedFormRef.current &&
    (saving ||
      [
        "firstName",
        "lastName",
        "phone",
        "bio",
        "institutionType",
        "institution",
        "city",
        "state",
      ].some((k) => (form[k] || "") !== (savedFormRef.current[k] || "")));

  const wasDirtyRef = useRef(false);
  useEffect(() => {
    if (isDirty && !wasDirtyRef.current) {
      wasDirtyRef.current = true;
      setTimeout(
        () =>
          saveBarRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        50,
      );
    }
    if (!isDirty) wasDirtyRef.current = false;
  }, [isDirty]);

  return (
    <div
      style={{
        height: `calc(100vh - ${navH}px)`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-base)",
        fontFamily: "var(--font-body)",
      }}
    >
      <style>{`
        @keyframes stFadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes stSlideUp { from{opacity:0;transform:translateY(10px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes stSpin    { to{transform:rotate(360deg)} }
        .st-inp:focus { border-color:var(--accent)!important; box-shadow:0 0 0 3px var(--accent-soft)!important; outline:none!important; }
        .st-inp::placeholder { color:var(--text-muted); }
        .st-inp:disabled { opacity:0.45; cursor:not-allowed; }
        .st-nav-btn:hover { background:var(--bg-card-hover)!important; }
        .st-back-btn:hover { border-color:var(--accent)!important; color:var(--accent)!important; box-shadow:0 0 8px 2px rgba(var(--accent-rgb),0.35)!important; }
        .st-scroll::-webkit-scrollbar { width:0px; }
        .st-scroll { scrollbar-width:none; }

        @media (max-width: 768px) {
          .st-header { padding: 3rem 1rem 0.75rem !important; }
          .st-header h1 { font-size: 2rem !important; letter-spacing: -1px !important; }
          .st-back-btn { left: 0 !important; top: 3rem !important; }
          .st-layout { flex-direction: column !important; padding: 0 1rem 2rem !important; gap: 0.75rem !important; overflow: visible !important; }
          .st-sidebar { width: 100% !important; position: static !important; flex-direction: column !important; overflow-y: visible !important; }
          .st-sidebar-profile { display: none !important; }
          .st-sidebar-nav { display: flex !important; flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; padding: 0.35rem !important; scrollbar-width: none !important; }
          .st-sidebar-nav::-webkit-scrollbar { display: none; }
          .st-nav-btn { flex-shrink: 0 !important; width: auto !important; padding: 0.45rem 0.8rem !important; font-size: 0.78rem !important; margin-bottom: 0 !important; margin-right: 2px !important; white-space: nowrap !important; }
          .st-grid-2 { grid-template-columns: 1fr !important; }
          .st-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .st-modal { width: 92vw !important; max-width: 92vw !important; }
          .st-crop-inner { width: 92vw !important; }
        }
        @media (max-width: 480px) {
          .st-header h1 { font-size: 1.6rem !important; }
          .st-layout { padding: 0 0.75rem 2rem !important; }
          .st-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleting}
      />
      {showCrop && cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onConfirm={(blob) => {
            setCropSrc(null);
            uploadCropped(blob);
          }}
          onCancel={() => {
            setShowCrop(false);
            setCropSrc(null);
          }}
        />
      )}

      {/* ── Page header ── */}
      <div
        className="st-header"
        style={{
          flexShrink: 0,
          maxWidth: "1080px",
          width: "100%",
          margin: "0 auto",
          padding: "4rem 2.5rem 1rem",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="st-back-btn back-btn-circle"
          style={{
            position: "absolute",
            left: "-10px",
            top: "4.5rem",
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
            Settings.
          </span>
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            marginTop: "0.5rem",
            fontWeight: "400",
            margin: 0,
          }}
        >
          Manage your profile, institution and preferences
        </p>
      </div>

      {/* ── Two-column area ── */}
      <div
        className="st-layout"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          maxWidth: "1080px",
          width: "100%",
          margin: "0 auto",
          padding: "0 2.5rem 2rem",
          gap: "1.5rem",
          boxSizing: "border-box",
        }}
      >
        {/* ── Sidebar ── */}
        <div
          className="st-scroll st-sidebar"
          style={{
            width: "210px",
            flexShrink: 0,
            overflowY: "auto",
            alignSelf: "flex-start",
            position: "sticky",
            top: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.625rem",
          }}
        >
          {user && (
            <div
              className="st-sidebar-profile"
              style={{
                borderRadius: "var(--radius-xl)",
                background: "var(--bg-surface)",
                border: "1.5px solid var(--border)",
                padding: "1.25rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: user.avatar
                    ? "transparent"
                    : "var(--accent-soft)",
                  border: "2px solid var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "800",
                      color: "var(--accent)",
                    }}
                  >
                    {(
                      user.firstName?.[0] ||
                      user.email?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    "Your Account"}
                </div>
                <div
                  style={{
                    fontSize: "0.67rem",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginTop: "0.1rem",
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
          )}
          <div
            className="st-sidebar-nav"
            style={{
              borderRadius: "var(--radius-xl)",
              background: "var(--bg-surface)",
              border: "1.5px solid var(--border)",
              padding: "0.5rem",
            }}
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => changeSection(s.id)}
                className="st-nav-btn"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.7rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.84rem",
                  textAlign: "left",
                  marginBottom: "2px",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.15s",
                  background:
                    activeSection === s.id
                      ? "var(--accent-soft)"
                      : "transparent",
                  border:
                    activeSection === s.id
                      ? "1px solid var(--accent-border)"
                      : "1px solid transparent",
                  color:
                    activeSection === s.id
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                  fontWeight: activeSection === s.id ? "700" : "500",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    opacity: activeSection === s.id ? 1 : 0.55,
                  }}
                >
                  {s.icon}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right column ── */}
        <div
          className="st-scroll"
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            paddingRight: "2px",
            paddingBottom: "1.5rem",
          }}
        >
          {loadingUser ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "stSpin 0.7s linear infinite",
                }}
              />
            </div>
          ) : (
            <>
              {/* ── PROFILE ── */}
              {activeSection === "profile" && (
                <div
                  style={{
                    animation: "stFadeUp 0.25s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "var(--radius-xl)",
                      background: "var(--bg-surface)",
                      border: "1.5px solid var(--border)",
                      padding: "1.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1.75rem",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        onClick={() =>
                          !avatarUploading &&
                          document.getElementById("st-av")?.click()
                        }
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: user?.avatar
                            ? "transparent"
                            : "var(--accent-soft)",
                          border: "3px solid var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: avatarUploading ? "not-allowed" : "pointer",
                          overflow: "hidden",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          if (!avatarUploading) {
                            const ov = e.currentTarget.querySelector(".pov");
                            if (ov) ov.style.opacity = "1";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const ov = e.currentTarget.querySelector(".pov");
                          if (ov && !avatarUploading) ov.style.opacity = "0";
                        }}
                      >
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: "1.8rem",
                              fontWeight: "800",
                              color: "var(--accent)",
                            }}
                          >
                            {(
                              user?.firstName?.[0] ||
                              user?.email?.[0] ||
                              "?"
                            ).toUpperCase()}
                          </span>
                        )}
                        <div
                          className="pov"
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.45)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: avatarUploading ? 1 : 0,
                            transition: "opacity 0.2s",
                            pointerEvents: "none",
                          }}
                        >
                          {avatarUploading ? (
                            <div
                              style={{
                                width: "22px",
                                height: "22px",
                                border: "2.5px solid rgba(255,255,255,0.3)",
                                borderTopColor: "white",
                                borderRadius: "50%",
                                animation: "stSpin 0.7s linear infinite",
                              }}
                            />
                          ) : (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                          )}
                        </div>
                      </div>
                      {!avatarUploading && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "2px",
                            right: "2px",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "var(--accent)",
                            border: "2.5px solid var(--bg-surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                          }}
                        >
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                          >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                      )}
                      <input
                        id="st-av"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          e.target.value = "";
                          const rd = new FileReader();
                          rd.onload = (ev) => {
                            setCropSrc(ev.target.result);
                            setShowCrop(true);
                            setAvatarError("");
                          };
                          rd.readAsDataURL(f);
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: "800",
                          color: "var(--text-primary)",
                          lineHeight: 1.25,
                        }}
                      >
                        {[user?.firstName, user?.lastName]
                          .filter(Boolean)
                          .join(" ") || "Your Name"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          marginTop: "0.2rem",
                          marginBottom: "1rem",
                        }}
                      >
                        {user?.email}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.625rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() =>
                            document.getElementById("st-av")?.click()
                          }
                          disabled={avatarUploading}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            color: "var(--accent)",
                            background: "var(--accent-soft)",
                            border: "1.5px solid var(--accent-border)",
                            borderRadius: "var(--radius-sm)",
                            cursor: avatarUploading ? "not-allowed" : "pointer",
                            padding: "0.45rem 0.875rem",
                            fontFamily: "var(--font-body)",
                            opacity: avatarUploading ? 0.6 : 1,
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
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          {avatarUploading ? "Uploading…" : "Upload photo"}
                        </button>
                        {user?.avatar && !avatarUploading && (
                          <button
                            onClick={async () => {
                              try {
                                const pid = extractPublicId(user.avatar);
                                if (pid)
                                  await API.delete("/upload/avatar", {
                                    data: { publicId: pid },
                                  }).catch(() => {});
                                await API.put("/users/profile", {
                                  avatar: null,
                                });
                                upd({ ...user, avatar: null });
                              } catch {}
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              fontSize: "0.78rem",
                              fontWeight: "600",
                              color: "var(--text-muted)",
                              background: "transparent",
                              border: "1.5px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              padding: "0.45rem 0.875rem",
                              fontFamily: "var(--font-body)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#ef4444";
                              e.currentTarget.style.borderColor =
                                "rgba(239,68,68,0.35)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.borderColor =
                                "var(--border)";
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {avatarError && (
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "#ef4444",
                            marginTop: "0.5rem",
                          }}
                        >
                          {avatarError}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.7,
                        textAlign: "right",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "0.15rem",
                      }}
                    >
                      <span>JPG, PNG or WebP</span>
                      <span>Max 5MB</span>
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: "var(--radius-xl)",
                      background: "var(--bg-surface)",
                      border: "1.5px solid var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "1.75rem 1.75rem 1.5rem",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="st-grid-2"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                        }}
                      >
                        <F style={{ marginBottom: 0 }} label="First Name">
                          <input
                            className="st-inp"
                            style={IS}
                            value={form.firstName}
                            onChange={(e) => set("firstName", e.target.value)}
                            placeholder="First name"
                          />
                        </F>
                        <F style={{ marginBottom: 0 }} label="Last Name">
                          <input
                            className="st-inp"
                            style={IS}
                            value={form.lastName}
                            onChange={(e) => set("lastName", e.target.value)}
                            placeholder="Last name"
                          />
                        </F>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "1.75rem 1.75rem 1.5rem",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="st-grid-2"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                          alignItems: "end",
                        }}
                      >
                        <F style={{ marginBottom: 0 }} label="Phone Number">
                          <input
                            className="st-inp"
                            style={IS}
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="+91 98765 43210"
                          />
                        </F>
                        <div>
                          <label style={LS}>Email Address</label>
                          <div
                            style={{
                              ...IS,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              cursor: "default",
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: "var(--text-secondary)",
                                lineHeight: "1.4",
                              }}
                            >
                              {user?.email || ""}
                            </span>
                            <button
                              onClick={() => changeSection("account")}
                              style={{
                                flexShrink: 0,
                                alignSelf: "center",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.68rem",
                                fontWeight: "700",
                                color: "var(--accent)",
                                background: "var(--accent-soft)",
                                border: "1px solid var(--accent-border)",
                                borderRadius: "5px",
                                cursor: "pointer",
                                padding: "0.2rem 0.5rem",
                                fontFamily: "var(--font-body)",
                                whiteSpace: "nowrap",
                                lineHeight: 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "var(--accent)";
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "var(--accent-soft)";
                                e.currentTarget.style.color = "var(--accent)";
                              }}
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--text-muted)",
                          marginBottom: "0.75rem",
                        }}
                      >
                        Bio
                      </div>
                      <F
                        hint={`${form.bio.length}/200 characters`}
                        style={{ marginBottom: 0 }}
                      >
                        <textarea
                          className="st-inp"
                          style={{
                            ...IS,
                            minHeight: "100px",
                            resize: "vertical",
                            lineHeight: 1.7,
                          }}
                          value={form.bio}
                          onChange={(e) => set("bio", e.target.value)}
                          placeholder="Tell buyers a little about yourself…"
                        />
                      </F>
                    </div>
                  </div>
                </div>
              )}

              {/* ── INSTITUTION ── */}
              {activeSection === "institution" && (
                <div style={{ animation: "stFadeUp 0.25s ease" }}>
                  <SectionCard
                    title="Institution"
                    subtitle="Where you study — connects you with students nearby"
                    icon={
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    }
                  >
                    {(!form.institutionType || changingType) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          marginBottom: "1.5rem",
                        }}
                      >
                        {[
                          {
                            id: "college",
                            label: "College",
                            icon: (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              >
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                              </svg>
                            ),
                          },
                          {
                            id: "school",
                            label: "School",
                            icon: (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              >
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                              </svg>
                            ),
                          },
                        ].map((t) => {
                          const sel = form.institutionType === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                set("institutionType", t.id);
                                set("institution", "");
                                set("city", "");
                                set("state", "");
                                setChangingType(false);
                              }}
                              style={{
                                flex: 1,
                                padding: "1.125rem",
                                textAlign: "left",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                                border: sel
                                  ? "2px solid var(--accent)"
                                  : "2px solid var(--border)",
                                background: sel
                                  ? "var(--accent-soft)"
                                  : "var(--bg-input)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                              }}
                            >
                              <span
                                style={{
                                  color: sel
                                    ? "var(--accent)"
                                    : "var(--text-muted)",
                                  display: "flex",
                                }}
                              >
                                {t.icon}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.88rem",
                                  fontWeight: "700",
                                  color: sel
                                    ? "var(--accent)"
                                    : "var(--text-primary)",
                                }}
                              >
                                {t.label} Student
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {form.institutionType && !changingType && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "1.5rem",
                            padding: "0.8rem 1rem",
                            borderRadius: "var(--radius-md)",
                            background: "var(--accent-soft)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              color: "var(--accent)",
                              textTransform: "capitalize",
                            }}
                          >
                            {form.institutionType} student
                          </span>
                          <button
                            onClick={() => setChangingType(true)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.72rem",
                              fontWeight: "600",
                              color: "var(--text-muted)",
                              background: "none",
                              border: "1px solid var(--border)",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontFamily: "var(--font-body)",
                              padding: "0.25rem 0.7rem",
                            }}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Change
                          </button>
                        </div>
                        <F
                          label={
                            form.institutionType === "college"
                              ? "Institution Name"
                              : "School Name"
                          }
                          hint="Can't find it? Just type the name manually."
                        >
                          <InstitutionSearch
                            key={form.institutionType}
                            value={form.institution}
                            type={form.institutionType}
                            onSelect={(inst) => {
                              set("institution", inst.name);
                              set("city", inst.city || "");
                              set("state", inst.state || "");
                            }}
                          />
                        </F>
                        <div
                          className="st-grid-2"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                          }}
                        >
                          <F label="City" style={{ marginBottom: 0 }}>
                            <input
                              className="st-inp"
                              style={IS}
                              value={form.city}
                              onChange={(e) => set("city", e.target.value)}
                              placeholder="City"
                            />
                          </F>
                          <F label="State" style={{ marginBottom: 0 }}>
                            <input
                              className="st-inp"
                              style={IS}
                              value={form.state}
                              onChange={(e) => set("state", e.target.value)}
                              placeholder="State"
                            />
                          </F>
                        </div>
                      </>
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ── APPEARANCE ── */}
              {activeSection === "appearance" && (
                <div style={{ animation: "stFadeUp 0.25s ease" }}>
                  <SectionCard
                    title="Appearance"
                    subtitle="Choose how Student Shop looks for you"
                    icon={<PaintIcon sz={17} />}
                  >
                    <div
                      className="st-grid-3"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: "1rem",
                      }}
                    >
                      {themes.map((t) => (
                        <ThemeCard
                          key={t.id}
                          t={t}
                          isActive={theme === t.id}
                          onClick={() => handleThemeChange(t.id)}
                        />
                      ))}
                    </div>
                  </SectionCard>
                  <FloatingButtonsCard />
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeSection === "notifications" && (
                <div style={{ animation: "stFadeUp 0.25s ease" }}>
                  <SectionCard
                    title="Notifications"
                    subtitle="Changes save automatically when you flip a toggle"
                    icon={
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    }
                  >
                    <Toggle
                      value={form.notificationsEnabled}
                      onChange={(v) => handleToggle("notificationsEnabled", v)}
                      label="Sale notifications"
                      desc="Get notified when someone buys your item"
                    />
                    <Toggle
                      value={form.messageNotificationsEnabled}
                      onChange={(v) =>
                        handleToggle("messageNotificationsEnabled", v)
                      }
                      label="Message notifications"
                      desc="Get notified when you receive a new message"
                    />
                    <Toggle
                      value={form.priceDropAlerts}
                      onChange={(v) => handleToggle("priceDropAlerts", v)}
                      label="Price drop alerts"
                      desc="Get notified when a watched item drops in price"
                    />
                    {saved && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <Saved />
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ── ACCOUNT ── */}
              {activeSection === "password" && (
                <div style={{ animation: "stFadeUp 0.25s ease" }}>
                  <SectionCard
                    title={
                      user?.authProvider === "google"
                        ? "Create Password"
                        : "Change Password"
                    }
                    subtitle={
                      user?.authProvider === "google"
                        ? "Add a password so you can also log in with your email"
                        : "Update your current account password"
                    }
                    icon={
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
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
                    }
                  >
                    {user?.authProvider === "google" ? (
                      <CreatePasswordPanel
                        onSuccess={(u) => {
                          setUser(u);
                          upd(u);
                        }}
                      />
                    ) : (
                      <ChangePasswordPanel />
                    )}
                  </SectionCard>
                </div>
              )}

              {activeSection === "account" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                    animation: "stFadeUp 0.25s ease",
                  }}
                >
                  {/* ── Member row ── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem 1.25rem",
                      borderRadius: "var(--radius-md)",
                      background: "transparent",
                      border: "1.5px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "var(--accent-soft)",
                          border: "1.5px solid var(--accent-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                          }}
                        >
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginTop: "0.1rem",
                          }}
                        >
                          Member since {memberSince || "—"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        navigate("/login");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.45rem 1rem",
                        borderRadius: "999px",
                        fontSize: "0.73rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        background: "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.18)",
                        color: "#ef4444",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239,68,68,0.14)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(239,68,68,0.07)")
                      }
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log out
                    </button>
                  </div>

                  {/* ── Connected accounts ── */}
                  <SectionCard
                    title="Connected Accounts"
                    subtitle="How you sign in to Student Shop"
                    icon={
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    }
                  >
                    {/* Email/password row — only show if registered with email (local or both) */}
                    {(user?.authProvider === "local" ||
                      user?.authProvider === "both") && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.875rem",
                          padding: "0.875rem 0",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: "var(--bg-input)",
                            border: "1.5px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--text-secondary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: "700",
                              color: "var(--text-primary)",
                            }}
                          >
                            Email & Password
                          </div>
                          <div
                            style={{
                              fontSize: "0.71rem",
                              color: "var(--text-muted)",
                              marginTop: "0.1rem",
                            }}
                          >
                            {user?.email}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.3rem 0.7rem",
                            borderRadius: "999px",
                            background: "rgba(34,197,94,0.08)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            fontSize: "0.68rem",
                            fontWeight: "700",
                            color: "#22c55e",
                          }}
                        >
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="#22c55e"
                          >
                            <circle cx="12" cy="12" r="12" />
                          </svg>
                          Active
                        </div>
                      </div>
                    )}
                    {/* Google row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.875rem",
                        padding: "0.875rem 0 0 0",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          background:
                            user?.authProvider === "google" ||
                            user?.authProvider === "both"
                              ? "rgba(34,197,94,0.06)"
                              : "var(--bg-input)",
                          border: `1.5px solid ${user?.authProvider === "google" || user?.authProvider === "both" ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 18 18">
                          <path
                            fill="#4285F4"
                            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                          />
                          <path
                            fill="#34A853"
                            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                          />
                          <path
                            fill="#EA4335"
                            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                          />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                          }}
                        >
                          Google
                        </div>
                        <div
                          style={{
                            fontSize: "0.71rem",
                            color: "var(--text-muted)",
                            marginTop: "0.1rem",
                          }}
                        >
                          {user?.authProvider === "google" ||
                          user?.authProvider === "both"
                            ? user?.email
                            : "Not connected"}
                        </div>
                      </div>
                      {user?.authProvider === "google" ||
                      user?.authProvider === "both" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.3rem 0.7rem",
                            borderRadius: "999px",
                            background: "rgba(34,197,94,0.08)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            fontSize: "0.68rem",
                            fontWeight: "700",
                            color: "#22c55e",
                          }}
                        >
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="#22c55e"
                          >
                            <circle cx="12" cy="12" r="12" />
                          </svg>
                          Connected
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "0.3rem 0.7rem",
                            borderRadius: "999px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border)",
                            fontSize: "0.68rem",
                            fontWeight: "600",
                            color: "var(--text-muted)",
                          }}
                        >
                          Not linked
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  {/* ── Change Email ── */}
                  <SectionCard
                    title="Change Email"
                    subtitle="Update your login email address"
                    icon={
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    }
                  >
                    <ChangeEmailPanel
                      currentEmail={user?.email || ""}
                      onSuccess={(u) => {
                        setUser(u);
                        localStorage.setItem("user", JSON.stringify(u));
                      }}
                    />
                  </SectionCard>

                  {/* ── Danger Zone ── */}
                  <div
                    style={{
                      padding: "1.25rem",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(239,68,68,0.02)",
                      border: "1px solid rgba(239,68,68,0.12)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            color: "#ef4444",
                            marginBottom: "0.2rem",
                          }}
                        >
                          Danger Zone
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            lineHeight: "1.6",
                          }}
                        >
                          Permanently deletes your account, listings, messages
                          and history.
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        style={{
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.5rem 1rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          background: "transparent",
                          border: "1.5px solid rgba(239,68,68,0.3)",
                          color: "#ef4444",
                          marginLeft: "1rem",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.08)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Save bar ── */}
          {!noSave && (isDirty || saved) && (
            <div
              ref={saveBarRef}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                paddingTop: "1.25rem",
                animation: "stFadeUp 0.2s ease",
              }}
            >
              {isDirty && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.72rem 2rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    cursor: saving ? "not-allowed" : "pointer",
                    border: "none",
                    fontFamily: "var(--font-body)",
                    background: saving
                      ? "var(--bg-card-hover)"
                      : "linear-gradient(135deg,var(--accent),var(--accent-alt))",
                    color: saving ? "var(--text-muted)" : "white",
                    boxShadow: saving ? "none" : "var(--shadow-accent)",
                  }}
                >
                  {saving && (
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        animation: "stSpin 0.6s linear infinite",
                      }}
                    />
                  )}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              )}
              {saved && <Saved />}
              {error && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    color: "#ef4444",
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── SectionCard helper ────────────────────────────────────────────── */
function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--bg-surface)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "1.5rem 1.75rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-border)",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: "0.975rem",
              fontWeight: "700",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "0.76rem",
              color: "var(--text-secondary)",
              marginTop: "0.15rem",
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
      <div style={{ padding: "1.75rem" }}>{children}</div>
    </div>
  );
}
