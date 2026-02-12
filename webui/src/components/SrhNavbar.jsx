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
      </div>
    </header>
  );
};

export default SrhNavbar;
