import React, { useState } from "react";
import { genKeyRSA, encrypt, decrypt } from "../api/rsa";

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
    <div>
      <h2>Secure Communication</h2>

      <section>
        <h4>Key Generation</h4>
        <div>
          <label>
            Algorithm:&nbsp;
            <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
              <option value="RSA">RSA</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Key Size (bits):&nbsp;
            <input
              type="number"
              min={512}
              step={256}
              value={bits}
              onChange={(e) => setBits(Number(e.target.value))}
            />
          </label>
        </div>

        <button onClick={generateKey}>Generate</button>

        <div>
          <div>
            <strong>Public Key:</strong>
            <pre>{publicKey}</pre>
          </div>
          <div>
            <strong>Private Key:</strong>
            <pre>{privateKey}</pre>
          </div>
        </div>
      </section>

      <section>
        <h4>Encrypt</h4>
        <textarea
          placeholder="Message to encrypt"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <div>
          <button onClick={encryptMessage}>Encrypt</button>
        </div>
        <div>
          <strong>Encrypted Message:</strong>
          <pre>{encryptedText}</pre>
        </div>
      </section>

      <section>
        <h4>Decrypt</h4>
        <div>
          <button onClick={decryptMessage}>Decrypt</button>
        </div>
        <div>
          <strong>Decrypted Message:</strong>
          <pre>{decryptedMessage}</pre>
        </div>
      </section>
    </div>
  );
}
