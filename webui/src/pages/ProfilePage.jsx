import React, { useEffect, useMemo, useState } from "react";
import SrhNavbar from "../components/SrhNavbar";
import { getLanguage, onLanguageChange, t, translateRole } from "../lib/preferences";
import { getUserProfile } from "../lib/session";
import "../styles/ProfilePage.css";

const formatDate = (value, language) => {
  if (!value) return t(language, "notAvailable");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return t(language, "notAvailable");
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
};

const getInitials = (name, email) => {
  const source = String(name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

const ProfilePage = () => {
  const [language, setLanguageState] = useState(getLanguage());
  const profile = getUserProfile();

  useEffect(() => onLanguageChange(setLanguageState), []);

  const details = useMemo(
    () => [
      { label: t(language, "fullName"), value: profile?.name || t(language, "notAvailable") },
      { label: t(language, "email"), value: profile?.email || t(language, "notAvailable") },
      { label: t(language, "role"), value: translateRole(profile?.role, language) },
      { label: t(language, "dob"), value: formatDate(profile?.dob, language) },
      { label: t(language, "timezone"), value: "Europe/Berlin" },
    ],
    [language, profile]
  );

  const academicDetails = useMemo(
    () => [
      { label: t(language, "regNumber"), value: profile?.regNumber || t(language, "notAvailable") },
      { label: t(language, "batch"), value: profile?.batch || t(language, "notAvailable") },
      { label: t(language, "course"), value: profile?.course || t(language, "notAvailable") },
    ],
    [language, profile]
  );

  return (
    <div className="profile-page">
      <SrhNavbar />
      <main className="profile-shell">
        <section className="profile-hero">
          <div className="profile-avatar">{getInitials(profile?.name, profile?.email)}</div>
          <div className="profile-hero-copy">
            <h1>{profile?.name || t(language, "profile")}</h1>
            <p>{t(language, "profileSubtitle")}</p>
          </div>
        </section>

        <section className="profile-grid">
          <article className="profile-card">
            <h2>{t(language, "userDetails")}</h2>
            <div className="profile-list">
              {details.map((item) => (
                <div key={item.label} className="profile-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="profile-card">
            <h2>{t(language, "academicDetails")}</h2>
            <div className="profile-list">
              {academicDetails.map((item) => (
                <div key={item.label} className="profile-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
