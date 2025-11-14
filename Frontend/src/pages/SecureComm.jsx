import React, { useState } from "react";
import { genKeyRSA, encrypt, decrypt } from "../api/rsa";
import "../styles/SecureComm.css";

export default function SecureComm() {
  const [bits, setBits] = useState(2048);
  const [algorithm, setAlgorithm] = useState("RSA");
  const [message, setMessage] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const generateKey = async () => {
    if (algorithm !== "RSA") {
      alert("Chỉ hỗ trợ RSA tại thời điểm này.");
      return;
    }

    const keySize = Number(bits) || 512;
    try {
      const result = await genKeyRSA(keySize, algorithm);
      const pub = result?.publicKeyBase64 ?? result?.publicKey ?? "";
      const priv = result?.privateKeyBase64 ?? result?.privateKey ?? "";
      setPublicKey(pub);
      setPrivateKey(priv);
    } catch (err) {
      console.error("Key generation failed:", err);
      alert(`Key generation failed: ${err?.message ?? err}`);
    }
  };

  const encryptMessage = async () => {
    if (!publicKey) return alert("Chưa có public key để mã hóa.");
    if (!message) return alert("Nhập message để mã hóa.");
    try {
      const resp = await encrypt(algorithm, publicKey, message);
      const c = resp?.encryptedText ?? "";
      setEncryptedText(c);
    } catch (err) {
      console.error("Encryption failed:", err);
      alert(`Encryption failed: ${err?.message ?? err}`);
    }
  };

  const decryptMessage = async () => {
    if (!privateKey) return alert("Chưa có private key để giải mã.");
    if (!encryptedText) return alert("Chưa có dữ liệu để giải mã.");
    try {
      const resp = await decrypt(privateKey, algorithm, encryptedText);
      const plain = resp?.decryptedText ?? "";
      setDecryptedMessage(plain);
    } catch (err) {
      console.error("Decryption failed:", err);
      alert(`Decryption failed: ${err?.message ?? err}`);
    }
  };

  return (
    <div className="secure-page">
      <h2>Secure Communication</h2>

      <div className="secure-grid">
        {/* MAIN COLUMN */}
        <div className="main-column">
          {/* Key Generation card */}
          <div className="card section">
            <h4>Key Generation</h4>

            {/* --- Nhóm chọn Algorithm + Key Size trong 1 khung --- */}
            <div className="value-grid">
              <div>
                <label>Algorithm:</label>
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                  <option value="RSA">RSA</option>
                </select>
              </div>

              <div>
                <label>Key Size (bits):</label>
                <input
                  type="number"
                  min={512}
                  max={4096}
                  step={256}
                  value={bits}
                  onChange={(e) => setBits(Number(e.target.value))}
                />
              </div>

              <div style={{ alignSelf: 'end' }}>
                <button className="btn btn-primary" onClick={generateKey}>Generate</button>
              </div>
            </div>

            {/* KEY INPUTS - PUBLIC / PRIVATE */}
            <div style={{ marginTop: 12 }}>
              <div className="key-field">
                <label>Public Key</label>
                <div className="key-input-row">
                  <input
                    type="text"
                    value={publicKey}
                    placeholder="Input or generated public key"
                    onChange={(e) => setPublicKey(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary copy-btn"
                    onClick={() => navigator.clipboard.writeText(publicKey)}
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
                    value={privateKey}
                    placeholder="Input or generated private key"
                    onChange={(e) => setPrivateKey(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary copy-btn"
                    onClick={() => navigator.clipboard.writeText(privateKey)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Encrypt card */}
          <div className="card section">
            <h4>Encrypt</h4>

            <textarea
              placeholder="Message to encrypt"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />

            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={encryptMessage}>Encrypt</button>
            </div>

            <div className="result" style={{ marginTop: 12 }}>
              <strong>Encrypted Message:</strong>
              <div style={{ marginTop: 8 }}>{encryptedText || <span style={{ color: 'var(--muted)' }}>—</span>}</div>
            </div>
          </div>

          {/* Decrypt card */}
          <div className="card section">
            <h4>Decrypt</h4>

            <div style={{ marginTop: 6 }}>
              <button className="btn btn-primary" onClick={decryptMessage}>Decrypt</button>
            </div>

            <div className="result" style={{ marginTop: 12 }}>
              <strong>Decrypted Message:</strong>
              <div style={{ marginTop: 8 }}>{decryptedMessage || <span style={{ color: 'var(--muted)' }}>—</span>}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
