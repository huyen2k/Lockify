export const API_BASE = "http://localhost:8080/api/rsa";

export async function genKeyRSA(bits, algorithm) {
    
    const requestBody = {
        bits: String(bits),
        algorithm: algorithm 
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

export async function encrypt(algorithm, publicKey, message) {
    
    const requestBody = {
        algorithm: algorithm,
        publicKey: publicKey,
        message: message
    };

    const res = await fetch(`${API_BASE}/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody) 
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}

export async function decrypt(privateKey, algorithm, encryptedText) {
    
    const requestBody = {
        privateKey: privateKey,
        algorithm: algorithm,
        encryptedText: encryptedText
    };

    const res = await fetch(`${API_BASE}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody) 
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}