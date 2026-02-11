import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, getRole, isLoggedIn } from "../lib/session";
import "../styles/SrhNavbar.css";

const SrhNavbar = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const role = getRole();

  const onLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <header className="srh-nav">
      <div className="srh-brand">
        <span className="srh-logo">SRH</span>
        <div>
          <div className="srh-title">Project Hub</div>
          <div className="srh-sub">Applied Sciences</div>
        </div>
      </div>

      <nav className="srh-links">
        <Link to="/landing">Home</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/admin/monitoring">Monitor</Link>
      </nav>

      <div className="srh-actions">
        {loggedIn ? (
          <>
            <span className="role-chip">{role || "user"}</span>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <button onClick={() => navigate("/login")}>Login</button>
        )}
      </div>
    </header>
  );
};

export default SrhNavbar;
