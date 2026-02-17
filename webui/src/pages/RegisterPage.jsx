import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/ToastProvider";
import "../styles/LoginPage.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8020/api/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast(
        `Account created (${res.data?.assignedRole || "viewer"}). Please sign in.`,
        "success"
      );
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-mark">SRH Project Hub</div>
        <h1>
          Join the
          <br />
          Project Community.
        </h1>
        <p>
          Create an account to explore projects and comment on submissions.
          Domain-based roles are assigned automatically.
        </p>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={onRegister}>
          <h2>Create Account</h2>
          <p>Sign up to view and discuss projects.</p>

          <label>Full Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="auth-switch-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

