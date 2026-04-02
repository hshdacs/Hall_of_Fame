import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, getRole, getUserProfile, isLoggedIn } from "../lib/session";
import { getLanguage, onLanguageChange, setLanguage, t, translateRole } from "../lib/preferences";
import "../styles/SrhNavbar.css";

const getInitials = (name, email) => {
  const source = String(name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

const SrhNavbar = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const loggedIn = isLoggedIn();
  const role = getRole();
  const profile = getUserProfile();
  const [language, setLanguageState] = useState(getLanguage());
  const [menuOpen, setMenuOpen] = useState(false);
  const canUpload = ["student", "faculty", "admin"].includes(role);
  const canSeeMyProjects = role === "student";

  useEffect(() => onLanguageChange(setLanguageState), []);

  useEffect(() => {
    const handleClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = useMemo(
    () => getInitials(profile?.name, profile?.email),
    [profile?.email, profile?.name]
  );

  const onLogout = () => {
    clearSession();
    setMenuOpen(false);
    navigate("/login");
  };

  const chooseLanguage = (next) => {
    setLanguage(next);
    setMenuOpen(false);
  };

  return (
    <header>
      <div className="srh-top-strip" />
      <div className="srh-nav">
        <div className="srh-brand">
          <img
            className="srh-brand-logo"
            src="https://ecampus.srh-university.de/pluginfile.php/1/core_admin/logo/0x59/1770367721/University_neu.png"
            alt="SRH University"
          />
        </div>

        <nav className="srh-links">
          <Link to="/landing">{t(language, "home")}</Link>
          <Link to="/projects">{t(language, "projects")}</Link>
          {canUpload && <Link to="/upload">{t(language, "upload")}</Link>}
          {role === "admin" && <Link to="/admin/monitoring">{t(language, "monitor")}</Link>}
        </nav>

        <div className="srh-actions">
          {loggedIn ? (
            <>
              <span className="role-chip">{translateRole(role || "viewer", language)}</span>
              <div className="account-menu-wrap" ref={dropdownRef}>
                <button
                  type="button"
                  className="account-trigger"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="account-avatar">{initials}</span>
                  <span className="account-caret" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
                      <path
                        d="M7 10l5 5 5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {menuOpen && (
                  <div className="account-menu" role="menu">
                    <button type="button" onClick={() => { setMenuOpen(false); navigate("/profile"); }}>
                      {t(language, "profile")}
                    </button>
                    {canSeeMyProjects && (
                      <button type="button" onClick={() => { setMenuOpen(false); navigate("/my-projects"); }}>
                        {t(language, "myProjects")}
                      </button>
                    )}
                    <div className="account-menu-section">
                      <span>{t(language, "language")}</span>
                      <div className="language-options">
                        <button
                          type="button"
                          className={language === "de" ? "active" : ""}
                          onClick={() => chooseLanguage("de")}
                        >
                          {t(language, "german")}
                        </button>
                        <button
                          type="button"
                          className={language === "en" ? "active" : ""}
                          onClick={() => chooseLanguage("en")}
                        >
                          {t(language, "english")}
                        </button>
                      </div>
                    </div>
                    <div className="account-menu-section">
                      <button
                        type="button"
                        className="account-logout-item"
                        onClick={onLogout}
                      >
                        {t(language, "logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={() => navigate("/login")}>{t(language, "login")}</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default SrhNavbar;
