export const API_BASE = "http://localhost:8080/api";

export async function createServerKey(id) {
  const res = await fetch(`${API_BASE}/signature/keygen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  return res.json();
}

export async function getServerPublicKey(id) {
  const res = await fetch(`${API_BASE}/signature/public/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("No public key");
  return res.json(); // returns { id, publicKeyBase64 }
}

export async function serverSign(signerId, docBase64, filename) {
  const res = await fetch(`${API_BASE}/signature/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signerId, documentBase64: docBase64, filename })
  });
  return res.json();
}

export async function serverVerify(publicKeyBase64, documentBase64, signatureBase64) {
  const res = await fetch(`${API_BASE}/signature/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKeyBase64, documentBase64, signatureBase64 })
  });
  return res.json(); // { valid: true/false }
}
