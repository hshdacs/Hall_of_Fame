import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { saveSession } from "../lib/session";
import { getLanguage, onLanguageChange, t } from "../lib/preferences";
import { useToast } from "../components/ToastProvider";
import "../styles/LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getLanguage());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => onLanguageChange(setLanguage), []);

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
        user: res.data.user,
      });
      navigate("/landing");
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || t(language, "loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onSsoPlaceholder = (provider) => {
    toast(`${provider} ${t(language, "ssoPlaceholder")}`, "info");
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-mark">SRH Project Hub</div>
        <h1>
          {t(language, "loginHeroTitleTop")}
          <br />
          {t(language, "loginHeroTitleBottom")}
        </h1>
        <p>{t(language, "loginHeroText")}</p>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={onLogin}>
          <h2>{t(language, "welcomeBack")}</h2>
          <p>{t(language, "signInContinue")}</p>

          <label>{t(language, "srhEmail")}</label>
          <input
            type="email"
            placeholder={t(language, "emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>{t(language, "password")}</label>
          <input
            type="password"
            placeholder={t(language, "passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? t(language, "signingIn") : t(language, "signIn")}
          </button>

          <div className="divider">{t(language, "orSignInWith")}</div>

          <div className="sso-row">
            <button type="button" onClick={() => onSsoPlaceholder("Microsoft")}>
              Microsoft
            </button>
            <button type="button" onClick={() => onSsoPlaceholder("OpenID")}>
              OpenID
            </button>
          </div>

          <p className="auth-switch-text">
            {t(language, "newHere")} <Link to="/register">{t(language, "createViewerAccount")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
