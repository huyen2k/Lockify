import React from "react";
import { Navigate, NavLink, Routes, Route } from "react-router-dom";
import logo from "./assets/logo.png";
import "./styles/LockifyHeader.css";
import SecureComm from "./pages/SecureComm";
import Minichat from "./pages/MiniChat";
import TrialDivisions from "./pages/TrialDivisions";
import FermatDivisions from "./pages/FermatDivision";
import QuadraticSieve from "./pages/QuadraticSieve";

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
            Have fun with RSA Encryption!
          </div>

          {/* BOTTOM ROW: nav links (left) + actions (right) */}
          <div className="lockify-navbar">
            <div className="lockify-nav-links">
              <NavLink to="/secure" className={({ isActive }) => isActive ? 'active' : ''}>
                Secure
              </NavLink>
              <NavLink to="/minichat" className={({ isActive }) => isActive ? 'active' : ''}>
                MiniChat
              </NavLink>
              <NavLink to="/trial" className={({ isActive }) => isActive ? 'active' : ''}>
                Trial Division
              </NavLink>
              <NavLink to="/fermat" className={({ isActive }) => isActive ? 'active' : ''}>
                Fermat Factorization
              </NavLink>
              <NavLink to="/quadratic" className={({ isActive }) => isActive ? 'active' : ''}>
                Quadratic Sieve
              </NavLink>
            </div>
          </div>

        </div>
      </header>

      {/* REST OF YOUR APP — giữ nguyên */}
      <Routes>
        <Route path="/" element={
          <Navigate to="/secure" replace />
        } />
        <Route path="/secure" element={<SecureComm />} />
        <Route path="/minichat" element={<Minichat />} />
        <Route path="/trial" element={<TrialDivisions />} />
        <Route path="/fermat" element={<FermatDivisions />} />
        <Route path="/quadratic" element={<QuadraticSieve />} />
      </Routes>
    </div>
  );
}

export default App;
