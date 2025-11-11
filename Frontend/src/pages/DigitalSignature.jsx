import React, { useState } from "react";
import KeyManager from "../components/KeyManager";
import Signer from "../components/Signer";
import Verifier from "../components/Verifier";

export default function DigitalSignature() {
  const [clientPrivate, setClientPrivate] = useState(null);

  const handleKeyGenerated = (_, exported) => {
    // exported contains {publicKeyBase64, privateKeyBase64}
    setClientPrivate(exported.privateKeyBase64);
  };

  return (
    <div>
      <h2>Digital Signature Module</h2>
      <KeyManager onKeyGenerated={handleKeyGenerated} />
      <Signer clientPrivateKeyBase64={clientPrivate} />
      <Verifier />
    </div>
  );
}
