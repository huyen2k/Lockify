export const API_BASE = "http://localhost:8080/api/messages";

export async function sendMessage(cipherBase64, signatureBase64, plaintext, fromId, toId) {
    
    const requestBody = {
        toId: toId,
        fromId: fromId,
        cipherBase64: cipherBase64,
        signatureBase64: signatureBase64,
        plaintext: plaintext
    };

    const res = await fetch(`${API_BASE}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody) 
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}

export async function getMessage(fromId, toId) {

    const res = await fetch(`${API_BASE}/inbox/${toId}/${fromId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}

export async function deleteMessage(fromId, toId) {
    
    const requestBody = {
        toId: toId,
        fromId: fromId
    };

    const res = await fetch(`${API_BASE}/inbox/clear/${toId}/${fromId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody) 
    });

    if (!res.ok) {
        throw new Error(`API call failed with status: ${res.status}`);
    }

    return res.json();
}