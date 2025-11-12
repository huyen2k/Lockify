import React, { useEffect, useState } from "react";
import {
  generateRSAKeyPair,
  exportKeyPairToBase64,
  verifyData,
  importPublicKeyFromBase64,
  signData,
  importPrivateKeyFromBase64,
} from "../utils/crypto";
import { getServerPublicKey, createServerKey, signDocument, verify } from "../api/signature";

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
          const privKey = await importPrivateKeyFromBase64(clientPrivate, hashAlgorithm);
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
          const resp = await signDocument(serverKeyId, message, hashAlgorithm, algorithm);
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
      const kp = await generateRSAKeyPair(bits || 2048, hashAlgorithm || "SHA-256");
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
        const resp = await verify(pubKey, messageverify || message, signature, algorithm, hashAlgorithm);
        // assuming resp returns { valid: true } or boolean
        const valid = typeof resp === "boolean" ? resp : resp?.valid;
        setValidationResult(valid ? "Valid ✅" : "Invalid ❌");
      } else {
        // client verifies server signature locally
        if (!serverPublic) {
          setValidationResult("No server public key");
          return;
        }
        const imported = await importPublicKeyFromBase64(serverPublic, hashAlgorithm);
        const valid = await verifyData(imported, messageverify || message, signature);
        setValidationResult(valid ? "Valid ✅" : "Invalid ❌");
      }
    } catch (e) {
      console.error("Verify error:", e);
      setValidationResult("Error: " + (e.message || e));
    }
  };

  return (
    <div>
      <h2>Digital Signature</h2>

      <div>
        <div>
          <h3>Client Key Manager</h3>
          <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
            <option value="RSA">RSA</option>
          </select>

          <select value={hashAlgorithm} onChange={(e) => setHashAlgorithm(e.target.value)}>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>

          <input
            type="number"
            placeholder="Key Size (bits)"
            value={bits}
            onChange={(e) => setBits(Number(e.target.value))}
          />
          <button onClick={handleClientGenKey}>Generate Key</button>
          <div>
            <div>
              <label>Public (base64):</label> {clientPublic}
            </div>
            <div>
              <label>Private (base64):</label> {clientPrivate}
            </div>
          </div>
        </div>

        <hr />
        <div>
          <h4>Server Key Manager</h4>
          <input
            placeholder="server key id (e.g. alice)"
            value={serverKeyId}
            onChange={(e) => setServerKeyId(e.target.value)}
          />
          <button onClick={handleCreateServer}>
            Create on server
          </button>
          <button onClick={handleFetchServer}>
            Fetch public key
          </button>
          <div>
            <label>Server public (base64):</label>
            <pre>{serverPublic}</pre>
          </div>
        </div>
      </div>
      <hr />

      <div>
        <h3>Sign document</h3>
        <div>
          <textarea placeholder="Message to sign" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="client">Client-side sign</option>
            <option value="server">Server-side sign</option>
          </select>
        </div>

        <div>
          <label>Signature: </label> {signature}
        </div>
      </div>

      <div>
        <h3>Verify signature</h3>
        <div>
          <textarea
            placeholder="Message to verify (leave empty to use signed message)"
            value={messageverify}
            onChange={(e) => setMessageVerify(e.target.value)}
          />
          <button onClick={() => verifyMessage()}>Verify</button>
        </div>

        {method === "client" ? (
          <div>
            <label>Server verify: </label> {validationResult}
          </div>
        ) : (
          <div>
            <label>Client verify: </label> {validationResult}
          </div>
        )}
      </div>
    </div>
  );
}
