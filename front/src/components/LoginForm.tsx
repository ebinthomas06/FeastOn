import React, { useState } from "react";
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google'; 
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // 1. Import Theme Hook

type StaffCreds = { username: string; password: string; remember?: boolean };

export interface LoginFormProps {
  onStudentSignIn?: () => void;
  onStaffSignIn?: (creds: StaffCreds) => Promise<void> | void;
}

export default function LoginForm({ onStaffSignIn }: LoginFormProps) {
  const [mode, setMode] = useState<"student" | "staff">("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth(); 
  const { colors } = useTheme(); // 2. Get dynamic colors
  const navigate = useNavigate();

  // --- Dynamic Styles ---
  const cardStyle: React.CSSProperties = {
    maxWidth: 480,
    width: "100%",
    margin: "0 auto",
    padding: 32,
    borderRadius: 8, // slightly rounded
    backgroundColor: colors.ui.card, // Dynamic Card BG
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    border: `1px solid ${colors.ui.border}`, // Dynamic Border
  };

  const primaryBtnStyle: React.CSSProperties = {
    background: colors.primary.main, // Dynamic Primary
    borderColor: colors.primary.main,
    color: "#fff",
    borderRadius: 4,
    padding: "13px 18px",
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: 0.3,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const tabActiveStyle: React.CSSProperties = {
    background: colors.primary.main, // Dynamic Primary
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "11px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const tabInactiveStyle: React.CSSProperties = {
    background: colors.ui.background, // Dynamic light/dark bg
    color: colors.text.secondary, // Dynamic text color
    border: `1px solid ${colors.ui.border}`,
    borderRadius: 4,
    padding: "11px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const inputCustomStyle: React.CSSProperties = {
    borderRadius: 4,
    padding: "13px 14px",
    border: `1px solid ${colors.ui.border}`,
    backgroundColor: colors.ui.background, // Dynamic Input BG
    color: colors.text.primary, // Dynamic Input Text
    boxShadow: "none",
    minHeight: 46,
    fontSize: 14,
    fontFamily: "inherit",
    transition: "border 0.2s ease",
    width: "100%",
    boxSizing: 'border-box'
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) {
        setError("Google Login failed. No credential received.");
        return;
      }

      // API Call (Assuming this matches your backend)
      const res = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }), 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed on server");
      }

      login(data.token, data.user);

      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleGoogleError = () => {
    setError("Google Login Failed. Please try again.");
  };

  async function handleStaffSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Please enter username and password");
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Invalid credentials");

      login(data.token, data.user);

      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/staff');

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={cardStyle}>
      <h4
        style={{
          textAlign: "center",
          marginBottom: 20,
          color: colors.text.primary, // Dynamic Title Color
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: -0.2,
        }}
      >
        Login
      </h4>

      <div
        style={{ display: "flex", gap: 14, marginBottom: 16 }}
        role="tablist"
      >
        <button
          type="button"
          style={mode === "student" ? tabActiveStyle : tabInactiveStyle}
          onClick={() => setMode("student")}
          aria-pressed={mode === "student"}
        >
          Student
        </button>
        <button
          type="button"
          style={mode === "staff" ? tabActiveStyle : tabInactiveStyle}
          onClick={() => setMode("staff")}
          aria-pressed={mode === "staff"}
        >
          Staff / Admin
        </button>
      </div>

      {mode === "student" ? (
        <div>
          <p
            style={{
              marginBottom: 14,
              color: colors.text.secondary, // Dynamic Subtext
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Sign in with your IIIT Kottayam Gmail account
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="rectangular"
              width="100%"
            />
          </div>
          {error && (
            <div style={{ color: colors.error.main, fontSize: 13, marginBottom: 10, textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: colors.text.disabled, // Dynamic Disabled Text
              lineHeight: 1.5,
            }}
          >
            Only <strong style={{ color: colors.text.secondary }}>@iiitkottayam.ac.in</strong> accounts are allowed
          </div>
        </div>
      ) : (
        <form onSubmit={handleStaffSubmit}>
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="username"
              style={inputCustomStyle}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="password"
              style={inputCustomStyle}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember" style={{ fontSize: 13, color: colors.text.secondary }}>
                Remember me
              </label>
            </div>
            <a href="#" style={{ fontSize: 13, color: colors.primary.main, textDecoration: 'none' }}>
              Forgot password?
            </a>
          </div>

          {error && (
            <div
              style={{
                background: colors.error.background,
                color: colors.error.main,
                padding: "10px 12px",
                borderRadius: 4,
                marginBottom: 14,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            style={{ ...primaryBtnStyle, width: "100%" }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      )}
    </div>
  );
}