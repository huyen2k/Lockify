// src/components/SecureComm.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { genKeyRSA, encrypt, decrypt } from "../api/rsa";
import "../styles/SecureComm.css";

/**
 * SecureComm - giữ nguyên giao diện & logic; chỉ VIỆT HÓA phần giải thích
 */

export default function SecureComm() {
  const [bits, setBits] = useState(16);
  const [val_p, setValP] = useState("");
  const [val_q, setValQ] = useState("");
  const [val_e, setValE] = useState("");
  const [val_d, setValD] = useState("");
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);

  const [message, setMessage] = useState("");
  const [cipherText, setCipherText] = useState("");
  const [cipherError, setCipherError] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const [log, setLog] = useState([]);
  const logRef = useRef(null);

  const nBig = useMemo(() => {
    try {
      if (!val_p || !val_q) return null;
      const p = BigInt(val_p);
      const q = BigInt(val_q);
      if (p <= 1n || q <= 1n) return null;
      return p * q;
    } catch {
      return null;
    }
  }, [val_p, val_q]);

  useEffect(() => {
    if (!logRef.current) return;
    try {
      logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    } catch {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const pushLog = (txt) => {
    setLog((s) => [...s, { time: new Date().toLocaleTimeString(), text: txt }]);
  };

  const handleGenerate = async () => {
    try {
      pushLog(`Đang tạo cặp khóa RSA (${bits} bits)...`);
      const res = await genKeyRSA(Number(bits));
      if (!res) throw new Error("Key generation returned no result");
      const p = res.val_p ?? res.p ?? "";
      const q = res.val_q ?? res.q ?? "";
      const pub = res.publicKey ?? res.pub ?? null;
      const priv = res.privateKey ?? res.priv ?? null;

      setValP(String(p));
      setValQ(String(q));
      if (pub) setValE(String(pub[1] ?? ""));
      if (priv) setValD(String(priv[1] ?? ""));
      setPublicKey(pub || null);
      setPrivateKey(priv || null);

      pushLog("Tạo khóa hoàn tất.");
    } catch (err) {
      console.error(err);
      pushLog(`LỖI: Tạo khóa thất bại — ${err?.message ?? err}`);
    }
  };

  useEffect(() => {
    if (!publicKey) return;
    try {
      const nFromKey = publicKey && publicKey[0] ? BigInt(publicKey[0]) : null;
      if (!nBig || !nFromKey || nBig !== nFromKey) {
        setPublicKey(null);
        setPrivateKey(null);
        setValE("");
        setValD("");
        pushLog("p hoặc q thay đổi — các khóa đã tạo trước đó bị vô hiệu hóa.");
      }
    } catch {
      setPublicKey(null);
      setPrivateKey(null);
      setValE("");
      setValD("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val_p, val_q]);

  // JS tương đương với hàm Java bạn đưa
  function transformMessageToCipherValues(messageStr, nBigInt) {
    if (!messageStr) return [];
    if (!nBigInt) throw new Error("Invalid modulus n");

    // tính bitLength của n
    const bitLen = nBigInt.toString(2).length;
    const blockSize = Math.floor(bitLen / 8) - 1;
    if (blockSize <= 0) throw new Error("Modulus n too small. Use larger key.");

    const encoder = new TextEncoder();
    const allBytes = encoder.encode(messageStr); // Uint8Array toàn bộ message UTF-8

    const out = [];
    for (let offset = 0; offset < allBytes.length; offset += blockSize) {
      const len = Math.min(blockSize, allBytes.length - offset);
      let m = 0n;
      for (let j = 0; j < len; j++) {
        m = (m << 8n) + BigInt(allBytes[offset + j]);
      }
      if (m >= nBigInt) {
        throw new Error(`Block value >= n. Increase key size.`);
      }
      out.push(m);
    }
    return out;
  }


  useEffect(() => {
    if (!message) {
      setCipherText("");
      setCipherError("");
      return;
    }
    if (!nBig) {
      setCipherText("");
      setCipherError("Vui lòng nhập p và q hợp lệ (hoặc nhấn Generate).");
      return;
    }
    try {
      const arr = transformMessageToCipherValues(message, nBig);
      setCipherText(arr.map((bi) => bi.toString()).join(" "));
      setCipherError("");
    } catch (err) {
      setCipherText("");
      setCipherError(String(err?.message ?? err));
    }
  }, [message, nBig]);

  const handleEncrypt = async () => {
    if (!publicKey) {
      pushLog("Hủy mã hóa: chưa có public key (nhấn Generate trước).");
      alert("Chưa có public key — nhấn Generate để tạo key trước khi mã hóa.");
      return;
    }
    if (!message) {
      pushLog("Hủy mã hóa: nội dung rỗng.");
      alert("Nhập message để mã hóa.");
      return;
    }
    try {
      pushLog("Đang mã hóa...");
      const resp = await encrypt(publicKey, message);
      const enc = resp?.encryptedText ?? resp?.ciphertext ?? "";
      setEncryptedText(enc);
      pushLog("Mã hóa hoàn tất.");
    } catch (err) {
      console.error(err);
      pushLog(`LỖI: Mã hóa thất bại — ${err?.message ?? err}`);
    }
  };

  const handleDecrypt = async () => {
    if (!privateKey) {
      pushLog("Hủy giải mã: chưa có private key.");
      alert("Chưa có private key (Generate trước).");
      return;
    }
    if (!encryptedText) {
      pushLog("Hủy giải mã: chưa có dữ liệu mã hóa.");
      alert("Chưa có encrypted text để giải mã.");
      return;
    }
    try {
      pushLog("Đang giải mã...");
      const resp = await decrypt(privateKey, encryptedText);
      const plain = resp?.decryptedText ?? resp?.plaintext ?? "";
      setDecryptedMessage(plain);
      pushLog("Giải mã hoàn tất.");
    } catch (err) {
      console.error(err);
      pushLog(`LỖI: Giải mã thất bại — ${err?.message ?? err}`);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    pushLog("Đã sao chép vào clipboard.");
  };

  const handleClear = () => {
    setMessage("");
    setCipherText("");
    setCipherError("");
    setEncryptedText("");
    setDecryptedMessage("");
    setLog([]);
    pushLog("Đã xóa tất cả.");
  };

  return (
    <div className="secure-comm-root">
      <div className="secure-comm-inner kept-layout">
        <div className="left-col">
          <div className="card key-card">
            <div className="card-head">
              <h3>Key Generation</h3>
            </div>

            <div className="compact-grid">
              <div className="field">
                <label>Key Size (bits)</label>
                <input type="number" min={8} max={4096} step={32} value={bits} onChange={(e) => setBits(Number(e.target.value || 0))} />
              </div>

              <div className="field">
                <label>Prime p</label>
                <input type="text" value={val_p} placeholder="enter prime p" onChange={(e) => setValP(e.target.value.trim())} />
              </div>

              <div className="field">
                <label>Prime q</label>
                <input type="text" value={val_q} placeholder="enter prime q" onChange={(e) => setValQ(e.target.value.trim())} />
              </div>

              <div className="field actions">
                <button className="btn primary" onClick={handleGenerate}>Generate</button>
                <button className="btn" onClick={() => { setPublicKey(null); setPrivateKey(null); setValE(""); setValD(""); pushLog("Cleared generated keys."); }}>Clear Keys</button>
              </div>
            </div>

            <div className="key-info">
              <div className="info-row">
                <div className="label">Modulus n</div>
                <div className="value">{nBig ? nBig.toString() : "—"}</div>
              </div>
              <div className="info-row">
                <div className="label">e (public)</div>
                <div className="value">{val_e || (publicKey ? String(publicKey[1] ?? "—") : "—")}</div>
              </div>
              <div className="info-row">
                <div className="label">d (private)</div>
                <div className="value">{val_d || (privateKey ? String(privateKey[1] ?? "—") : "—")}</div>
              </div>
            </div>
          </div>

          <div className="card cipher-card">
            <div className="card-head">
              <h3>Encrypt / Decrypt</h3>
              <div className="sub">Cipher preview updates live while typing</div>
            </div>

            <div className="field full">
              <label>Message</label>
              <textarea placeholder="Type message to encrypt — cipher updates live" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
            </div>

            <div className="field">
              <label>Cipher text (decimal blocks)</label>
              <div className="cipher-box">
                {cipherError ? <div className="cipher-error">{cipherError}</div> : <div className="cipher-value">{cipherText || <span className="muted">—</span>}</div>}
              </div>
            </div>

            <div className="btn-row">
              <button className="btn primary" onClick={handleEncrypt}>Encrypt</button>
              <button className="btn" onClick={handleDecrypt}>Decrypt</button>
              <button className="btn" onClick={() => copyToClipboard(cipherText)}>Copy Cipher</button>
              <button className="btn" onClick={() => copyToClipboard(encryptedText)}>Copy Encrypted</button>
            </div>

            <div className="result-row">
              <div className="label">Encrypted (API)</div>
              <pre className="result-box">{encryptedText || <span className="muted">—</span>}</pre>
            </div>

            <div className="result-row">
              <div className="label">Decrypted (API)</div>
              <pre className="result-box">{decryptedMessage || <span className="muted">—</span>}</pre>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button className="btn" onClick={handleClear}>Clear All</button>
            </div>
          </div>
        </div>

        <div className="right-col">
          <div className="card log-card">
            <div className="log-head">
              <h3>Operation Log</h3>
              <div className="log-actions">
                <button className="btn" onClick={() => { setLog([]); pushLog("Log cleared."); }}>Clear</button>
                <button className="btn" onClick={() => navigator.clipboard.writeText(log.map(l => `[${l.time}] ${l.text}`).join("\n"))}>Copy</button>
              </div>
            </div>

            <div className="log-box" ref={logRef} role="log" aria-live="polite">
              {log.length === 0 ? (
                <div className="log-empty">No operations yet — try Generate / Encrypt</div>
              ) : (
                log.map((l, idx) => (
                  <div className="log-line" key={idx}>
                    <div className="log-time">{l.time}</div>
                    <div className="log-text">{l.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="log-footer">
              <div className="log-note muted">Tip: Changing p or q invalidates generated keys. Use Generate to (re)create keys.</div>
            </div>
          </div>

          <div className="card explain-card">
            <h3>RSA — giải thích & công thức</h3>

            <div className="explain">
              <p><strong>Ý tưởng chính:</strong> RSA dựa trên tính khó của việc phân tích tích hai số nguyên tố lớn. Chọn hai số nguyên tố <code>p</code>, <code>q</code>, giữ bí mật; công bố <code>n = p × q</code> và mũ công khai <code>e</code>.</p>

              <div className="formula-block">
                <div className="formula-title">Tạo khóa</div>
                <div className="formula-line"><code>n = p × q</code></div>
                <div className="formula-line"><code>φ(n) = (p − 1) × (q − 1)</code></div>
                <div className="formula-line"><code>chọn e sao cho gcd(e, φ(n)) = 1</code></div>
                <div className="formula-line"><code>d = e⁻¹ mod φ(n)</code> <span className="muted"> (tức là d·e ≡ 1 (mod φ(n)))</span></div>
                <div className="formula-note muted">Khóa công khai: <code>(n, e)</code> — Khóa bí mật: <code>(n, d)</code></div>
              </div>

              <div className="formula-block">
                <div className="formula-title">Mã hóa / Giải mã</div>
                <div className="formula-line"><code>m (số nguyên) &lt; n</code></div>
                <div className="formula-line"><code>c = mᵉ mod n</code> <span className="muted"> (mã hóa)</span></div>
                <div className="formula-line"><code>m = cᵈ mod n</code> <span className="muted"> (giải mã)</span></div>
                <div className="formula-note muted">Trong giao diện: mỗi ký tự → bytes → số nguyên m; yêu cầu mỗi block <code>m &lt; n</code>.</div>
              </div>

              <p className="muted small">Lưu ý: triển khai thực tế cần padding (ví dụ OAEP) và chia message thành block; UI này hiển thị bản đồ toán học thô để bạn hiểu cách hoạt động.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
