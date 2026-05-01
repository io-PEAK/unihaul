import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import API from "../api/axios";

function GoogleButton({ onClick, loading }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "0.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.65rem",
        background: hovered ? "var(--bg-card-hover)" : "var(--bg-card)",
        border: hovered
          ? "1px solid var(--border-hover)"
          : "1px solid var(--border)",
        borderRadius: "12px",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        color: "var(--text-primary)",
        fontSize: "0.88rem",
        fontWeight: "600",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <path fill="none" d="M0 0h48v48H0z" />
      </svg>
      {loading ? "Signing in..." : "Continue with Google"}
    </button>
  );
}

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [focusedField, setFocusedField] = useState(null);
  const [btnHovered, setBtnHovered] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [draggable, setDraggable] = useState(false);
  const backRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  const fromMessage = from.startsWith("/cart")
    ? "Sign in to complete your purchase"
    : from !== "/"
      ? "Sign in to continue"
      : null;

  function onBackMouseDown() {}
  function onBackTouchStart() {}

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleGoogleSuccess(codeResponse) {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/google", { code: codeResponse.code });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      try {
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
        if (guestCart.length > 0) {
          await Promise.allSettled(
            guestCart.map((item) =>
              API.post(
                "/cart",
                { itemId: item.id },
                {
                  headers: { Authorization: `Bearer ${res.data.token}` },
                },
              ),
            ),
          );
          localStorage.removeItem("guestCart");
        }
      } catch (_) {}

      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error || "Google sign-in failed. Try again.",
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google sign-in was cancelled or failed."),
    flow: "auth-code",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      try {
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
        if (guestCart.length > 0) {
          await Promise.allSettled(
            guestCart.map((item) =>
              API.post(
                "/cart",
                { itemId: item.id },
                {
                  headers: { Authorization: `Bearer ${res.data.token}` },
                },
              ),
            ),
          );
          localStorage.removeItem("guestCart");
        }
      } catch (_) {}

      navigate(from, { replace: true });
    } catch (err) {
      const code = err.response?.data?.code;
      const status = err.response?.status;

      if (status === 404 || code === "USER_NOT_FOUND") {
        setError("Account does not exist. Please register first.");
        return;
      }

      setError(err.response?.data?.error || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      label: "Email",
      name: "email",
      type: "email",
      placeholder: "your@email.com",
    },
    {
      label: "Password",
      name: "password",
      type: "password",
      placeholder: "••••••••",
    },
  ];

  return (
    <div
      className="login-outer"
      style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <style>{`
        .login-back { position:absolute; left:-50px; top:16px; width:34px; height:34px }
        .login-heading { font-size:2.4rem }
        @media (max-width:1280px) { .login-back { left:-50px } }
        @media (max-width:1024px) { .login-back { left:-36px } .login-heading { font-size:2rem } }
        @media (max-width:768px)  {
          .login-back { position:static; margin-bottom:1rem; display:flex }
          .login-heading { font-size:1.9rem }
          .login-outer { padding: 1.25rem !important }
          .login-card  { padding: 2rem !important }
        }
        @media (max-width:480px)  { .login-heading { font-size:1.6rem } .login-card { padding:1.5rem !important } }
      `}</style>
      <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        <button
          ref={backRef}
          className="login-back back-btn-circle"
          onClick={() => navigate(-1)}
          onMouseDown={onBackMouseDown}
          onTouchStart={onBackTouchStart}
          style={{
            borderRadius: "50%",
            background: "var(--bg-card-hover)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: draggable ? "grab" : "pointer",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            transition: "all 0.15s",
            width: "34px",
            height: "34px",
            flexShrink: 0,
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

        <div
          className="login-card"
          style={{
            width: "100%",
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--glass-border)",
            borderRadius: "24px",
            padding: "2.75rem",
            boxShadow: "var(--shadow-card), var(--shadow-inset)",
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

          <div style={{ marginBottom: "2.25rem" }}>
            <h1
              className="login-heading"
              style={{
                fontWeight: "900",
                letterSpacing: "-1.5px",
                lineHeight: "1.05",
                marginBottom: "0.6rem",
                color: "var(--text-primary)",
              }}
            >
              Welcome
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
                Back.
              </span>
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                fontWeight: "400",
              }}
            >
              Sign in to your Student Shop account
            </p>
            {fromMessage && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem 0.85rem",
                  background: "rgba(var(--accent-rgb),0.08)",
                  border: "1px solid rgba(var(--accent-rgb),0.15)",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                  fontWeight: "500",
                }}
              >
                {fromMessage}
              </div>
            )}
          </div>

          <GoogleButton onClick={googleLogin} loading={googleLoading} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              margin: "1.25rem 0",
            }}
          >
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--text-ghost)",
                fontWeight: "600",
                letterSpacing: "1px",
              }}
            >
              OR
            </span>
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.name} style={{ marginBottom: "1.15rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.65rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color:
                      focusedField === field.name
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    fontWeight: "700",
                    marginBottom: "0.45rem",
                    transition: "color 0.3s ease",
                  }}
                >
                  {field.label}
                </label>
                <input
                  name={field.name}
                  type={field.type}
                  value={form[field.name]}
                  onChange={handleChange}
                  onFocus={() => setFocusedField(field.name)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    padding: "0.7rem 1rem",
                    background:
                      focusedField === field.name
                        ? "var(--bg-input-focus)"
                        : "var(--bg-input)",
                    border:
                      focusedField === field.name
                        ? "1px solid var(--accent-border)"
                        : "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            <div
              style={{
                height: "1px",
                background: "var(--glass-divider)",
                margin: "1.25rem 0",
              }}
            />

            {error && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(255,77,77,0.1)",
                  border: "1px solid rgba(255,77,77,0.3)",
                  borderRadius: "10px",
                  color: "#ff4d4d",
                  fontSize: "0.85rem",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                width: "100%",
                padding: "0.8rem",
                background: loading
                  ? "var(--bg-card-hover)"
                  : btnHovered
                    ? "linear-gradient(135deg, var(--accent-alt), var(--accent))"
                    : "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                transform:
                  btnHovered && !loading ? "translateY(-3px)" : "translateY(0)",
                boxShadow:
                  btnHovered && !loading
                    ? "0 15px 35px rgba(var(--accent-rgb),0.35)"
                    : "0 4px 15px rgba(var(--accent-rgb),0.2)",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "1.75rem",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No account yet?{" "}
            <Link
              to="/register"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-alt))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textDecoration: "none",
                fontWeight: "700",
              }}
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
