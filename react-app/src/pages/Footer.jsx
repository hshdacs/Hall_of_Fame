import React from 'react';
import '../styles/Footer.css'; 

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} JobPilot.</p>
        {/* Add any additional footer content here */}
      </div>
    </footer>
  );
};

export default Footer;
