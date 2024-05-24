import React from 'react';
import '../styles/Header.css';
import srhIcon from '../assets/srh.png';

const Header = () => {

    return (
        <div>
            <div className="header-container">
            </div>
            <div className="header2">
            <img src={srhIcon} alt="App Logo" className="app-logo"/>
            </div>
        </div>
    );
};

export default Header;