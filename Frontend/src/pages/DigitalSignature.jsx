import React, { useEffect, useState } from "react";
import {
  generateRSAKeyPair,
  exportKeyPairToBase64,
  verifyData,
  importPublicKeyFromBase64,
  signData,
  importPrivateKeyFromBase64,
} from "../utils/crypto";
import {
  getServerPublicKey,
  createServerKey,
  signDocument,
  verify,
} from "../api/signature";
import "../styles/DigitalSignature.css";

export default function DigitalSignature() {
  const [serverPublic, setServerPublic] = useState(null);
  const [clientPublic, setClientPublic] = useState(null);
  const [clientPrivate, setClientPrivate] = useState(null);

  const [serverKeyId, setServerKeyId] = useState("");
  const [algorithm, setAlgorithm] = useState("RSA");
  const [bits, setBits] = useState(2048);
  const [hashAlgorithm, setHashAlgorithm] = useState("SHA-256");

  const [message, setMessage] = useState("");
  const [messageverify, setMessageVerify] = useState("");
  const [signature, setSignature] = useState("");
  const [method, setMethod] = useState("client");
  const [validationResult, setValidationResult] = useState(null);

  // whenever method or message or clientPrivate changes, re-sign appropriately
  useEffect(() => {
    async function doSign() {
      if (method === "client") {
        if (!clientPrivate || !message) {
          setSignature("");
          return;
        }
        try {
          const privKey = await importPrivateKeyFromBase64(
            clientPrivate,
            hashAlgorithm
          );
          const sigB64 = await signData(privKey, message);
          setSignature(sigB64);
        } catch (e) {
          console.error("Client sign error:", e);
          setSignature("");
        }
      } else {
        // server-side sign: call API
        if (!serverKeyId || !message) {
          setSignature("");
          return;
        }
        try {
          const resp = await signDocument(
            serverKeyId,
            message,
            hashAlgorithm,
            algorithm
          );
          // assume resp.signatureBase64 exists
          setSignature(resp.signatureBase64 || resp.signature);
        } catch (e) {
          console.error("Server sign error:", e);
          setSignature("");
        }
      }
    }
    doSign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, message, clientPrivate, serverKeyId, hashAlgorithm, algorithm]);

  async function handleClientGenKey() {
    try {
      const kp = await generateRSAKeyPair(
        bits || 2048,
        hashAlgorithm || "SHA-256"
      );
      const exported = await exportKeyPairToBase64(kp);
      setClientPublic(exported.publicKeyBase64);
      setClientPrivate(exported.privateKeyBase64);
    } catch (e) {
      alert("Error generating key: " + e.message);
    }
  }

  async function handleFetchServer() {
    if (!serverKeyId) return alert("Nhập id (ví dụ alice)");
    try {
      const resp = await getServerPublicKey(serverKeyId);
      setServerPublic(resp.publicKeyBase64 || resp.publicKey);
    } catch (e) {
      alert("Không tìm thấy public key server: " + e.message);
    }
  }

  function handleCreateServer() {
    if (!serverKeyId) return alert("Nhập id");
    try {
      const resp = createServerKey(bits, algorithm, serverKeyId);
      setServerPublic(resp.publicKeyBase64);
      console.log("Server key create response:", resp);
      alert("Server key created");
    } catch (e) {
      alert("Error tạo key trên server: " + e.message);
    }
  }

  const verifyMessage = async () => {
    setValidationResult("Checking...");
    try {
      if (!signature) {
        setValidationResult("No signature to verify");
        return;
      }
      if (method === "client") {
        // server verifies client signature via API (you already have a server verify endpoint)
        // we're assuming `verify` is an API call that accepts (pubKey, message, signature, algorithm, hash)
        // If verify is client-side, you'd import key and call verifyData instead.
        const pubKey = clientPublic;
        const resp = await verify(
          pubKey,
          messageverify || message,
          signature,
          algorithm,
          hashAlgorithm
        );
        // assuming resp returns { valid: true } or boolean
        const valid = typeof resp === "boolean" ? resp : resp?.valid;
        setValidationResult(valid ? "Valid ✅" : "Invalid ❌");
      } else {
        // client verifies server signature locally
        if (!serverPublic) {
          setValidationResult("No server public key");
          return;
        }
        const imported = await importPublicKeyFromBase64(
          serverPublic,
          hashAlgorithm
        );
        const valid = await verifyData(
          imported,
          messageverify || message,
          signature
        );
        setValidationResult(valid ? "Valid ✅" : "Invalid ❌");
      }
    } catch (e) {
      console.error("Verify error:", e);
      setValidationResult("Error: " + (e.message || e));
    }
  };

  return (
    <div className="digital-page">
      <h2>Digital Signature</h2>

      <div className="digital-grid">
        {/* LEFT: main controls */}
        <div className="card">
          {/* Client Key Manager */}
          <div className="group">
            <h3>Client Key Manager</h3>

            <div className="form-row">
              <label>Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
              >
                <option value="RSA">RSA</option>
              </select>

              <label>Hash</label>
              <select
                value={hashAlgorithm}
                onChange={(e) => setHashAlgorithm(e.target.value)}
              >
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-384">SHA-384</option>
                <option value="SHA-512">SHA-512</option>
              </select>

              <label>Key Size (bits)</label>
              <input
                type="number"
                placeholder="Key Size (bits)"
                min={512}
                max={4096}
                step={256}
                value={bits}
                onChange={(e) => setBits(Number(e.target.value))}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleClientGenKey}
                >
                  Generate Key
                </button>
              </div>
            </div>

            {/* KEY INPUTS - PUBLIC / PRIVATE */}
            <div style={{ marginTop: 12 }}>
              <div className="key-field">
                <label>Public Key</label>
                <div className="key-input-row">
                  <input
                    type="text"
                    value={clientPublic}
                    placeholder="Input or generated public key"
                    onChange={(e) => setClientPublic(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary copy-btn"
                    onClick={() => navigator.clipboard.writeText(clientPublic)}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="key-field">
                <label>Private Key</label>
                <div className="key-input-row">
                  <input
                    type="text"
                    value={clientPrivate}
                    placeholder="Input or generated private key"
                    onChange={(e) => setClientPrivate(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary copy-btn"
                    onClick={() => navigator.clipboard.writeText(clientPrivate)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              height: 1,
              background: "rgba(15,23,42,0.04)",
              margin: "16px 0",
            }}
          />

          {/* Server Key Manager */}
          <div className="group">
            <h4>Server Key Manager</h4>

            <div className="form-row">
              <label>Server Key Id</label>
              <input
                placeholder="server key id (e.g. alice)"
                value={serverKeyId}
                onChange={(e) => setServerKeyId(e.target.value)}
              />
            </div>

            <div className="server-actions">
              <button className="btn btn-primary" onClick={handleCreateServer}>
                Create on server
              </button>
              <button className="btn btn-ghost" onClick={handleFetchServer}>
                Fetch public key
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ fontWeight: 600, color: "var(--muted)" }}>
                Server public (base64):
              </label>
              <div className="key-block">
                {serverPublic || (
                  <span style={{ color: "var(--muted)" }}>—</span>
                )}
              </div>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              height: 1,
              background: "rgba(15,23,42,0.04)",
              margin: "16px 0",
            }}
          />

          {/* Sign document */}
          <div className="group">
            <h3>Sign document</h3>

            <div style={{ marginTop: 10 }}>
              <textarea
                placeholder="Message to sign"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="form-row" style={{ marginTop: 10 }}>
              <label>Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="client">Client-side sign</option>
                <option value="server">Server-side sign</option>
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 600 }}>Signature:</div>
              <div className="key-block">
                {signature || <span style={{ color: "var(--muted)" }}>—</span>}
              </div>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              height: 1,
              background: "rgba(15,23,42,0.04)",
              margin: "16px 0",
            }}
          />

          {/* Verify signature */}
          <div className="group">
            <h3>Verify signature</h3>

            <div style={{ marginTop: 8 }}>
              <textarea
                placeholder="Message to verify (leave empty to use signed message)"
                value={messageverify}
                onChange={(e) => setMessageVerify(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => verifyMessage()}
              >
                Verify
              </button>
            </div>

            <div className="verify-result">
              <div style={{ fontWeight: 600 }}>
                {method === "client" ? "Server verify:" : "Client verify:"}
              </div>
              <div className="status">
                {validationResult ?? (
                  <span style={{ color: "var(--muted)" }}>—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
