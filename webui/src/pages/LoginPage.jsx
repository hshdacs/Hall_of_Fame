import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { saveSession } from "../lib/session";
import "../styles/LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:8020/api/auth/login", {
        email,
        password,
      });
      saveSession({
        token: res.data.token,
        role: res.data.role,
        email,
      });
      navigate("/landing");
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onSsoPlaceholder = (provider) => {
    alert(`${provider} SSO will be wired once SRH credentials are provided.`);
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-mark">SRH Project Hub</div>
        <h1>
          Elevate Your
          <br />
          Academic Journey.
        </h1>
        <p>
          Collaborate, review, and innovate with your peers and professors on
          the SRH Applied Sciences platform.
        </p>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={onLogin}>
          <h2>Welcome Back</h2>
          <p>Sign in to continue to SRH Project Hub.</p>

          <label>SRH Email</label>
          <input
            type="email"
            placeholder="e.g. student@stud.hochschule-heidelberg.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="divider">or sign in with</div>

          <div className="sso-row">
            <button type="button" onClick={() => onSsoPlaceholder("Microsoft")}>
              Microsoft
            </button>
            <button type="button" onClick={() => onSsoPlaceholder("OpenID")}>
              OpenID
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
