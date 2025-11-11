import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import DigitalSignature from "./pages/DigitalSignature";
import SecureComm from "./pages/SecureComm";

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "Inter, Arial" }}>
      <h1>Lockify</h1>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/signature" style={{ marginRight: 12 }}>Digital Signature</Link>
        <Link to="/secure">Secure Communication</Link>
      </nav>

      <Routes>
        <Route path="/" element={<DigitalSignature />} />
        <Route path="/signature" element={<DigitalSignature />} />
        <Route path="/secure" element={<SecureComm />} />
      </Routes>
    </div>
  );
}
