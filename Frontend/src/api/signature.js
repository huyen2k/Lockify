export const API_BASE = "http://localhost:8080/api/signature";

export async function createServerKey(bits, algorithm, serverKeyId) {
    
    const requestBody = {
        bits: String(bits),
        algorithm: algorithm,
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

export async function getServerPublicKey(serverKeyId) {
    
    const res = await fetch(`${API_BASE}/public/${serverKeyId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}

export async function signDocument(signerId, message, hashAlgorithm, algorithm) {
    
    const requestBody = {
        signerId: signerId,
        message: message,
        hashAlgorithm: hashAlgorithm,
        algorithm: algorithm
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

export async function verify(publicKey, message, signature, algorithm, hashAlgorithm) {
    
    const requestBody = {
        publicKey: publicKey,
        message: message,
        signature: signature,
        algorithm: algorithm,
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