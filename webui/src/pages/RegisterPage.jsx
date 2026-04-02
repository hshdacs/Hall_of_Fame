import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getLanguage, onLanguageChange, t, translateRole } from "../lib/preferences";
import { useToast } from "../components/ToastProvider";
import "../styles/LoginPage.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState(getLanguage());
  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => onLanguageChange(setLanguage), []);

  const onRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError(t(language, "nameRequired"));
      return;
    }
    if (!form.email.trim()) {
      setError(t(language, "emailRequired"));
      return;
    }
    if (!form.dob) {
      setError(t(language, "dobRequired"));
      return;
    }
    if (form.password.length < 6) {
      setError(t(language, "passwordMin"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t(language, "passwordsNoMatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8020/api/auth/register", {
        name: form.name.trim(),
        dob: form.dob,
        email: form.email.trim(),
        password: form.password,
      });
      toast(
        `${t(language, "accountCreated")} (${translateRole(res.data?.assignedRole || "viewer", language)}). ${t(language, "pleaseSignIn")}`,
        "success"
      );
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || t(language, "registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-mark">SRH Project Hub</div>
        <h1>
          {t(language, "registerHeroTitleTop")}
          <br />
          {t(language, "registerHeroTitleBottom")}
        </h1>
        <p>{t(language, "registerHeroText")}</p>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={onRegister}>
          <h2>{t(language, "createAccount")}</h2>
          <p>{t(language, "signUpHint")}</p>

          <label>{t(language, "fullNameLabel")}</label>
          <input
            type="text"
            placeholder={t(language, "fullNamePlaceholder")}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <label>{t(language, "email")}</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />

          <label>{t(language, "dateOfBirth")}</label>
          <input
            type="date"
            value={form.dob}
            onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))}
            required
          />

          <label>{t(language, "password")}</label>
          <input
            type="password"
            placeholder={t(language, "minPasswordPlaceholder")}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          <label>{t(language, "confirmPassword")}</label>
          <input
            type="password"
            placeholder={t(language, "confirmPasswordPlaceholder")}
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? t(language, "creating") : t(language, "createAccount")}
          </button>

          <p className="auth-switch-text">
            {t(language, "alreadyHaveAccount")} <Link to="/login">{t(language, "signIn")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

