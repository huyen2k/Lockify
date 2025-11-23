const api = import.meta.env.VITE_API_URL;
export const API_BASE = `${api}/api/signature`;

export async function createServerKey(bits, serverKeyId) {
    
    const requestBody = {
        bits: String(bits),
        id: serverKeyId
    };

    const res = await fetch(`${API_BASE}/keygen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody) 
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}

export async function getServerKey(serverKeyId) {
    
    const res = await fetch(`${API_BASE}/${serverKeyId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}

export async function signDocument(signerId, message, hashAlgorithm) {
    
    const requestBody = {
        signerId: signerId,
        message: message,
        hashAlgorithm: hashAlgorithm
    };

    const res = await fetch(`${API_BASE}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody) 
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}

export async function verify(publicKey, message, signature, hashAlgorithm) {
    
    const requestBody = {
        publicKey: publicKey,
        message: message,
        signature: signature,
        hashAlgorithm: hashAlgorithm
    };

    const res = await fetch(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody) 
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}