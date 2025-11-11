import React, { useState } from "react";

async function genECDH() {
  return await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
}
async function importRawPublic(rawB64) {
  const raw = Uint8Array.from(atob(rawB64), c => c.charCodeAt(0)).buffer;
  return await window.crypto.subtle.importKey("raw", raw, { name: "ECDH", namedCurve: "P-256" }, true, []);
}
async function deriveAESGCMKey(privKey, peerPubRaw) {
  return await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPubRaw },
    privKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
function ab2b64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i=0;i<bytes.length;i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function b64toab(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i=0;i<len;i++) bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}

export default function SecureComm() {
  const [aPub, setAPub] = useState("");
  const [bPub, setBPub] = useState("");
  const [msg, setMsg] = useState("");
  const [cipher, setCipher] = useState("");
  const [status, setStatus] = useState("");

  const [aPriv, setAPriv] = useState(null);
  const [bPriv, setBPriv] = useState(null);

  async function genA() {
    const kp = await genECDH();
    setAPriv(kp.privateKey);
    const raw = await window.crypto.subtle.exportKey("raw", kp.publicKey);
    setAPub(ab2b64(raw));
  }
  async function genB() {
    const kp = await genECDH();
    setBPriv(kp.privateKey);
    const raw = await window.crypto.subtle.exportKey("raw", kp.publicKey);
    setBPub(ab2b64(raw));
  }

  async function encrypt() {
    try {
      const peerPub = await importRawPublic(bPub);
      const key = await deriveAESGCMKey(aPriv, peerPub);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const enc = await window.crypto.subtle.encrypt({name:"AES-GCM", iv}, key, new TextEncoder().encode(msg));
      setCipher(JSON.stringify({ iv: ab2b64(iv.buffer), ct: ab2b64(enc) }));
      setStatus("Encrypted");
    } catch (e) {
      console.error(e);
      setStatus("Error encrypt");
    }
  }

  async function decrypt() {
    try {
      const obj = JSON.parse(cipher);
      const iv = b64toab(obj.iv);
      const ct = b64toab(obj.ct);
      const peerPub = await importRawPublic(aPub);
      const key = await deriveAESGCMKey(bPriv, peerPub);
      const dec = await window.crypto.subtle.decrypt({name:"AES-GCM", iv: new Uint8Array(iv)}, key, ct);
      setStatus("Decrypted: " + new TextDecoder().decode(dec));
    } catch (e) {
      console.error(e);
      setStatus("Error decrypt");
    }
  }

  return (
    <div>
      <h2>Secure Communication (Demo ECDH + AES-GCM)</h2>
      <div style={{display:"flex", gap:12}}>
        <div style={{flex:1}}>
          <h4>Peer A</h4>
          <button onClick={genA}>Generate A</button>
          <div style={{wordBreak:"break-all"}}><small>{aPub}</small></div>
        </div>
        <div style={{flex:1}}>
          <h4>Peer B</h4>
          <button onClick={genB}>Generate B</button>
          <div style={{wordBreak:"break-all"}}><small>{bPub}</small></div>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <textarea placeholder="Message to encrypt" value={msg} onChange={e=>setMsg(e.target.value)} rows={3} style={{width:"100%"}} />
        <button onClick={encrypt}>Encrypt (A - B)</button>
        <button onClick={decrypt} style={{marginLeft:8}}>Decrypt (B)</button>
      </div>

      <div style={{marginTop:12}}>
        <b>Cipher:</b>
        <pre style={{whiteSpace:"pre-wrap"}}>{cipher}</pre>
        <div><b>Status:</b> {status}</div>
      </div>
    </div>
  );
}
