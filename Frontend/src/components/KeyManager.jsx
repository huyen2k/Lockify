import React, { useState } from "react";
import { generateRSAKeyPair, exportKeyPairToBase64, importPublicKeyFromBase64 } from "../utils/crypto";
import { createServerKey, getServerPublicKey } from "../api";

export default function KeyManager({ onKeyGenerated }) {
  const [status, setStatus] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [serverKeyId, setServerKeyId] = useState("");
  const [serverPublic, setServerPublic] = useState(null);

  async function handleGen() {
    setStatus("Generating...");
    const kp = await generateRSAKeyPair();
    const exported = await exportKeyPairToBase64(kp);
    setPublicKey(exported.publicKeyBase64);
    setPrivateKey(exported.privateKeyBase64);
    setStatus("Generated.");
    if (onKeyGenerated) onKeyGenerated(kp, exported);
  }

  async function handleFetchServer() {
    if (!serverKeyId) return alert("Nhập id (ví dụ alice)");
    try {
      const resp = await getServerPublicKey(serverKeyId);
      // backend returns {id, publicKeyBase64} or similar
      setServerPublic(resp.publicKeyBase64 || resp.publicKey);
    } catch (e) {
      alert("Không tìm thấy public key server");
    }
  }

  async function handleCreateServer() {
    if (!serverKeyId) return alert("Nhập id");
    try {
      const resp = await createServerKey(serverKeyId);
      setServerPublic(resp.publicKeyBase64 || resp.publicKey);
      alert("Server key created");
    } catch (e) {
      alert("Error tạo key trên server");
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
      <h3>Key manager (client)</h3>
      <button onClick={handleGen}>Generate RSA Key Pair (client)</button>
      <div style={{ marginTop: 8 }}>
        <div><b>Public (base64):</b> <small style={{wordBreak:"break-all"}}>{publicKey}</small></div>
        <div><b>Private (base64):</b> <small style={{wordBreak:"break-all"}}>{privateKey}</small></div>
      </div>

      <hr />
      <div>
        <h4>Server key</h4>
        <input placeholder="server key id (e.g. alice)" value={serverKeyId} onChange={e=>setServerKeyId(e.target.value)} />
        <button onClick={handleCreateServer} style={{marginLeft:8}}>Create on server</button>
        <button onClick={handleFetchServer} style={{marginLeft:8}}>Fetch public key</button>
        <div><b>Server public:</b> <small style={{wordBreak:"break-all"}}>{serverPublic}</small></div>
      </div>
      <div style={{marginTop:8}}><i>{status}</i></div>
    </div>
  );
}
