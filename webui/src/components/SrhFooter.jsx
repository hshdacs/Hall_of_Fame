import React from "react";
import "../styles/SrhFooter.css";

const SrhFooter = () => {
  return (
    <footer className="srh-footer">
      <div className="footer-left">
        <div className="footer-logo">srh</div>
        <p>SRH Hochschulen GmbH</p>
        <p>Ludwig Guttmann Str. 6</p>
        <p>69123 Heidelberg</p>
        <a href="#privacy">Privacy Policy</a>
      </div>

      <div className="footer-right">
        <div className="footer-icons">
          <span>IG</span>
          <span>FB</span>
          <span>YT</span>
          <span>IN</span>
        </div>
        <p>+49 30 515650 200</p>
        <p>info.hsg@srh.de</p>
        <a href="#contacts">Open Contact List</a>
      </div>
    </footer>
  );
};

export default SrhFooter;
