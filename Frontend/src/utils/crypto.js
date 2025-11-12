// helpers to convert ArrayBuffer <-> Base64
export function ab2b64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
export function b642ab(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function ensureArrayBuffer(data) {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).buffer;
  }
  if (data instanceof Uint8Array) {
    return data.buffer;
  }
  // assume ArrayBuffer already
  return data;
}

// Generate RSA key pair extractable (so we can export)
export async function generateRSAKeyPair(bits = 2048, hashAlgorithm = "SHA-256") {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: bits,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: hashAlgorithm },
    },
    true,
    ["sign", "verify"]
  );
}

// export public key (SPKI) and private key (PKCS8) to base64
export async function exportKeyPairToBase64(keyPair) {
  const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const priv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicKeyBase64: ab2b64(pub),
    privateKeyBase64: ab2b64(priv),
  };
}

// sign ArrayBuffer or Uint8Array or string => returns base64 signature
export async function signData(privateKey, data) {
  // privateKey is expected to be a CryptoKey
  const dataBuf = ensureArrayBuffer(data);
  const sig = await window.crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    dataBuf
  );
  return ab2b64(sig);
}

// verify with publicKey (CryptoKey) and signatureBase64 and data (string or ArrayBuffer)
export async function verifyData(publicKey, data, signatureBase64) {
  const dataBuf = ensureArrayBuffer(data);
  const sigBuf = b642ab(signatureBase64);
  return await window.crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    sigBuf,
    dataBuf
  );
}

// import public key from base64 (SPKI) to CryptoKey
export async function importPublicKeyFromBase64(spkiB64, hashAlgorithm = "SHA-256") {
  return await window.crypto.subtle.importKey(
    "spki",
    b642ab(spkiB64),
    { name: "RSASSA-PKCS1-v1_5", hash: { name: hashAlgorithm } },
    true,
    ["verify"]
  );
}

// import private key from base64 (PKCS8)
export async function importPrivateKeyFromBase64(pkcs8B64, hashAlgorithm = "SHA-256") {
  return await window.crypto.subtle.importKey(
    "pkcs8",
    b642ab(pkcs8B64),
    { name: "RSASSA-PKCS1-v1_5", hash: { name: hashAlgorithm } },
    true,
    ["sign"]
  );
}
