import React, { useEffect } from 'react';
import './App.css';
import Login from './pages/Login.jsx';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"; // Import useLocation from react-router-dom
import Dashboard from './pages/Dashboard.jsx';
import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';


const App = () => {
  return (
    <BrowserRouter>
      <AppContent /> {/* Render AppContent within BrowserRouter */}
    </BrowserRouter>
  );
};

const AppContent = () => {
  const location = useLocation(); // use useLocation here
  const queryParams = new URLSearchParams(location.search);
  const paramsArray = [...queryParams];
  console.log("Size of URLSearchParams:", paramsArray.length);  

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
     
    const param1 = queryParams.get('access_token');
    const param2 = queryParams.get('email');
    const param3 = queryParams.get('expiry_date');
    const param4 = queryParams.get('refresh_token');
    const param5 = queryParams.get('profile_picture');
    const param6 = queryParams.get('firstname');
    const param7 = queryParams.get('lastname');

    const accessToken = decodeURIComponent(param1);
    const email = decodeURIComponent(param2);
    const expiryDate = decodeURIComponent(param3);
    const refreshToken = decodeURIComponent(param4);
    const profilePicture = decodeURIComponent(param5);
    const firstname = decodeURIComponent(param6);
    const lastname = decodeURIComponent(param7);
    
    if (email  && accessToken) {
      Cookies.set('email', email);
      Cookies.set('access_token', accessToken);
      Cookies.set('expiry_date', expiryDate);
      Cookies.set('refresh_token', refreshToken);
      Cookies.set('profile_picture', profilePicture);
      Cookies.set('firstname', firstname);
      Cookies.set('lastname', lastname);
    }
}, [location]);

 
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={ <Dashboard />} /> {/* Render Dashboard component if access token present, otherwise navigate to login */}
    </Routes>
  );
};

export default App;
