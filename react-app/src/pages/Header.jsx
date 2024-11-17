import React from 'react';
import UserPopover from './UserPopover.jsx'; 
import appLogo from '../assets/logoJobpilot.png'; // Adjust the path as needed
import '../styles/Header.css';

const Header = ({ onSelection, currentPage }) => {
  const isCurrentPage = (pageName) => currentPage === pageName;

  return (
    <div className="header-container">
      <img src={appLogo} alt="App Logo" className="app-logo" onClick={() => onSelection('Home')} />

      <div className="right-section">
        <div className="header-buttons">
          <button className={`header-button ${isCurrentPage('Home') ? 'active' : ''}`} onClick={() => onSelection('Home')}>Home</button>
          <button className={`header-button ${isCurrentPage('MyJob') ? 'active' : ''}`} onClick={() => onSelection('MyJob')}>My Job</button>
          <button className={`header-button ${isCurrentPage('AssistantAI') ? 'active' : ''}`} onClick={() => onSelection('AssistantAI')}>Assistant AI</button>
          <button className={`header-button ${isCurrentPage('AboutUs') ? 'active' : ''}`} onClick={() => onSelection('AboutUs')}>About Us</button>
        </div>
        
        <div className="profile-section" onClick={() => onSelection('UserPopover')}>
        <UserPopover />
        </div>
      </div>
    </div>
  );
};

export default Header;