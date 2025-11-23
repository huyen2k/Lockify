const api = import.meta.env.VITE_API_URL;
export const API_BASE = `${api}/api/rsa`;

export async function genKeyRSA(bits) {
    
    const requestBody = {
        bits: String(bits)
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

export async function encrypt(publicKey, message) {
    
    const requestBody = {
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

export async function decrypt(privateKey, encryptedText) {
    
    const requestBody = {
        privateKey: privateKey,
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

export async function validatePrime(prime) {

    const res = await fetch(`${API_BASE}/checkPrime/${prime}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }
    return res.json();
}

export async function computeE(phi_n) {

    const res = await fetch(`${API_BASE}/calculateE/${phi_n}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    }); 
    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }
    return res.json();
}

export async function computeD(e, phi_n) {
    const res = await fetch(`${API_BASE}/calculateD/${e}/${phi_n}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }
    return res.json();
}