import React, { useState } from "react";
import { ab2b64, signData, importPrivateKeyFromBase64 } from "../utils/crypto";
import { serverSign } from "../api";

function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

export default function Signer({ clientPrivateKeyBase64 /* optional */ }) {
  const [file, setFile] = useState(null);
  const [method, setMethod] = useState("client"); // or "server"
  const [signature, setSignature] = useState(null);
  const [serverResp, setServerResp] = useState(null);
  const [signerId, setSignerId] = useState(""); // for server-side sign

  async function handleSign() {
    if (!file) return alert("Chọn file");
    const arr = await fileToArrayBuffer(file);
    const dataB64 = ab2b64(arr);

    if (method === "client") {
      if (!clientPrivateKeyBase64) return alert("Cần privateKey client (generate trước)");
      const privKey = await importPrivateKeyFromBase64(clientPrivateKeyBase64);
      const sigB64 = await signData(privKey, arr);
      setSignature(sigB64);
      setServerResp(null);
    } else {
      // server-side sign (server saves document + signature)
      if (!signerId) return alert("Nhập signerId (id key trên server)");
      const resp = await serverSign(signerId, dataB64, file.name);
      setServerResp(resp);
      setSignature(resp.signatureBase64 || resp.signature); // depends on backend shape
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
      <h3>Sign document</h3>
      <div>
        <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <label>
          <input type="radio" checked={method==="client"} onChange={()=>setMethod("client")} />
          Sign locally (client)
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" checked={method==="server"} onChange={()=>setMethod("server")} />
          Sign on server
        </label>
      </div>

      {method==="server" && (
        <div style={{ marginTop:8 }}>
          <input placeholder="signerId on server (e.g. alice)" value={signerId} onChange={e=>setSignerId(e.target.value)} />
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button onClick={handleSign}>Sign</button>
      </div>

      {signature && (
        <div style={{ marginTop: 12 }}>
          <b>Signature (base64):</b>
          <div style={{ wordBreak: "break-all" }}>{signature}</div>
        </div>
      )}

      {serverResp && (
        <div style={{ marginTop: 8 }}>
          <b>Server response:</b>
          <pre>{JSON.stringify(serverResp, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
