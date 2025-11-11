import React, { useState } from "react";
import { b642ab, importPublicKeyFromBase64 } from "../utils/crypto";
import { serverVerify } from "../api";

function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

export default function Verifier() {
  const [file, setFile] = useState(null);
  const [publicKeyBase64, setPublicKeyBase64] = useState("");
  const [signatureBase64, setSignatureBase64] = useState("");
  const [result, setResult] = useState(null);

  async function verifyClient() {
    if (!file || !publicKeyBase64 || !signatureBase64) return alert("Thiếu input");
    const arr = await fileToArrayBuffer(file);
    const pub = await importPublicKeyFromBase64(publicKeyBase64);
    const ok = await window.crypto.subtle.verify("RSASSA-PKCS1-v1_5", pub, b642ab(signatureBase64), arr)
      .catch(e => { console.error(e); return false; });
    setResult({ method: "client", valid: ok });
  }

  async function verifyServer() {
    if (!file || !publicKeyBase64 || !signatureBase64) return alert("Thiếu input");
    const arr = await fileToArrayBuffer(file);
    const docB64 = btoa(String.fromCharCode(...new Uint8Array(arr)));
    const resp = await serverVerify(publicKeyBase64, docB64, signatureBase64);
    setResult({ method: "server", valid: resp.valid });
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12 }}>
      <h3>Verify signature</h3>
      <div>
        <input type="file" onChange={e => setFile(e.target.files?.[0]||null)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <textarea placeholder="public key base64 (spki)" value={publicKeyBase64} onChange={e=>setPublicKeyBase64(e.target.value)} rows={4} style={{width:"100%"}} />
      </div>
      <div style={{ marginTop: 8 }}>
        <textarea placeholder="signature base64" value={signatureBase64} onChange={e=>setSignatureBase64(e.target.value)} rows={3} style={{width:"100%"}} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={verifyClient} style={{ marginRight: 12 }}>Verify locally</button>
        <button onClick={verifyServer}>Verify on server</button>
      </div>

      {result && (
        <div style={{ marginTop: 12 }}>
          <b>Result ({result.method}): </b> {result.valid ? "Valid ✅" : "Invalid ❌"}
        </div>
      )}
    </div>
  );
}
