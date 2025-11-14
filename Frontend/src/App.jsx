import React from "react";
import { Navigate, NavLink, Routes, Route } from "react-router-dom";
import logo from "./assets/logo.png";
import "./styles/LockifyHeader.css";
import DigitalSignature from "./pages/DigitalSignature";
import SecureComm from "./pages/SecureComm";

function App() {
  return (
    <div>
      {/* HEADER */}
      <header className="lockify-header">
  <div className="lockify-header__inner">

    {/* TOP ROW: logo + app title */}
    <div className="lockify-top">
      <div className="lockify-logo">
        <img src={logo} alt="Lockify Logo" />
      </div>

      <div className="lockify-title">
        <h1>Lockify</h1>
        {/*<div className="subtitle-top">Digital Signature · Secure Communication</div>*/}
      </div>
    </div>

    {/* MIDDLE ROW: key info (Key with RSA) */}
    <div className="lockify-keyline">
      Key with RSA
    </div>

    {/* BOTTOM ROW: nav links (left) + actions (right) */}
    <div className="lockify-navbar">
            <div className="lockify-nav-links">
              <NavLink to="/secure" className={({isActive}) => isActive ? 'active' : ''}>
                Secure Communication
              </NavLink>
              <NavLink to="/signature" className={({isActive}) => isActive ? 'active' : ''}>
                Digital Signature
              </NavLink>
      </div>
    </div>

  </div>
</header>

      {/* REST OF YOUR APP — giữ nguyên */}
      <Routes>
        <Route path="/" element={
          <Navigate to="/secure" replace /> 
        }/>
        <Route path="/secure" element={<SecureComm />} />
        <Route path="/signature" element={<DigitalSignature />} />
      </Routes>
    </div>
  );
}

export default App;
