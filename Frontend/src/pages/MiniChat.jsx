import React, { useEffect, useRef, useState } from "react";
import { createServerKey, signDocument, verify } from "../api/signature";
import { encrypt, decrypt } from "../api/rsa";
import { sendMessage, getMessage } from "../api/message";
import { MessageBubble } from "../components/MessageBubble";
import { AnimatePresence } from "framer-motion";
import { Composer } from "../components/Composer";
import "../styles/Minichat.css"; // đảm bảo đường dẫn đúng

export default function Minichat() {
    const [apublic, setApublic] = useState("");
    const [aprivate, setAprivate] = useState("");
    const [bpublic, setBpublic] = useState("");
    const [bprivate, setBprivate] = useState("");

    const [bits, setBits] = useState(16);
    const [aid, setAid] = useState("");
    const [bid, setBid] = useState("");
    const [hashAlgorithm, setHashAlgorithm] = useState("SHA-256");
    const [algorithm, setAlgorithm] = useState("RSA");

    const [commandList, setCommandList] = useState([]);
    const [messagesText, setMessagesText] = useState([]);
    const [textB, setTextB] = useState("");
    const [textA, setTextA] = useState("");

    const [loggedA, setLoggedA] = useState(false);
    const [loggedB, setLoggedB] = useState(false);

    // refs
    const messagesListRefA = useRef(null);
    const messagesListRefB = useRef(null);
    const commandsListRef = useRef(null);

    // scroll messages when messagesText changes (A & B)
    useEffect(() => {
        if (messagesListRefA?.current) {
            messagesListRefA.current.scrollTop = messagesListRefA.current.scrollHeight;
        }
        if (messagesListRefB?.current) {
            messagesListRefB.current.scrollTop = messagesListRefB.current.scrollHeight;
        }
    }, [messagesText]);

    // scroll commands when commandList changes
    useEffect(() => {
        if (commandsListRef?.current) {
            commandsListRef.current.scrollTop = commandsListRef.current.scrollHeight;
        }
    }, [commandList]);

    // Khi cả A & B đều đã login và có id, load lại lịch sử.
    useEffect(() => {
        if (loggedA && loggedB && aid && bid) {
            loadConversation(aid, bid);
        }
    }, [loggedA, loggedB, aid, bid]);

    async function loadConversation(aId, bId) {
        try {
            console.log("Loading conversation for:", aId, bId);

            // Gọi API cả hai chiều (an toàn nếu backend trả 1 chiều)
            const respAB = await getMessage(aId, bId).catch((e) => {
                console.warn("getMessage(a->b) failed", e);
                return null;
            });
            const respBA = await getMessage(bId, aId).catch((e) => {
                console.warn("getMessage(b->a) failed", e);
                return null;
            });

            const arrA = Array.isArray(respAB) ? respAB : respAB ? [respAB] : [];
            const arrB = Array.isArray(respBA) ? respBA : respBA ? [respBA] : [];

            // Gộp kết quả và loại bỏ giá trị falsy
            let combined = [...arrA, ...arrB].filter(Boolean);

            // Helper: parse createdAt có thể là ISO string hoặc object { seconds, nanos }
            const parseTime = (t) => {
                if (!t) return 0;
                // ISO string
                if (typeof t === "string") {
                    const v = Date.parse(t);
                    return isNaN(v) ? 0 : v;
                }
                // object like { seconds, nanos }
                if (typeof t === "object") {
                    if (typeof t.seconds === "number") {
                        return t.seconds * 1000 + (t.nanos ? Math.floor(t.nanos / 1e6) : 0);
                    }
                    // fallback: try toString
                    const s = String(t);
                    const v = Date.parse(s);
                    return isNaN(v) ? 0 : v;
                }
                // number (epoch ms or s)
                if (typeof t === "number") {
                    // heuristics: if seconds (10 digits) -> *1000
                    return t > 1e12 ? t : t > 1e10 ? Math.floor(t) : Math.floor(t * 1000);
                }
                return 0;
            };

            // Sắp xếp theo createdAt (cũ -> mới)
            combined.sort((x, y) => {
                const tx = parseTime(x.createdAt ?? x.time ?? x.timestamp);
                const ty = parseTime(y.createdAt ?? y.time ?? y.timestamp);
                return tx - ty;
            });

            console.log("Loaded messages (combined):", combined);

            // Chuẩn hoá shape cho UI; nếu plaintext null -> dùng placeholder hoặc giải mã nếu có hàm decrypt
            const normalized = combined.map((r) => {
                // nếu bạn có function decryptCipher(cipherBase64) để giải mã trên client,
                // thay phần `text` bên dưới bằng: const text = r.plaintext ?? (r.cipherBase64 ? decryptCipher(r.cipherBase64) : "");
                const textVal = r.plaintext ?? "";
                const text = textVal !== "" ? textVal : (r.cipherBase64 ? "[encrypted]" : "");

                return {
                    id: r.id ?? `${Date.now()}-${Math.random()}`,
                    sender: r.fromId ?? r.sender ?? null,
                    to: r.toId ?? r.to ?? null,
                    text,
                    signature: r.signatureBase64 ?? null,
                    createdAt: r.createdAt ?? r.time ?? r.timestamp ?? null,
                    raw: r,
                };
            });

            console.log("normalized messages:", normalized);

            setMessagesText(normalized);
        } catch (err) {
            console.error("loadConversation error:", err);
            // giữ prev hoặc set rỗng tuỳ ý — ở đây đặt rỗng để rõ ràng
            setMessagesText([]);
        }

    }

    // login handlers (CHANGED: auto-generate key on login)
    function handleLoginA() {
        if (!aid?.trim()) return;
        const id = aid.trim();
        setAid(id);
        setLoggedA(true);
        getKeyUserA();
    }
    function handleLogoutA() {
        setLoggedA(false);
        setAid("");
        setApublic("");
        setAprivate("");
    }

    function handleLoginB() {
        if (!bid?.trim()) return;
        const id = bid.trim();
        setBid(id);
        setLoggedB(true);
        getKeyUserB();
        console.log("B logged in" + bpublic + "\n" + bprivate);
    }
    function handleLogoutB() {
        setLoggedB(false);
        setBid("");
        setBpublic("");
        setBprivate("");
    }

    // key generation helpers
    async function getKeyUserA() {
        console.log("Generating key for A with id:", aid);
        if (!aid) {
            setCommandList((p) => [...p, "Set A id before generating key."]);
            return;
        }
        const user = await createServerKey(bits, aid);
        setApublic(user.publicKey);
        setAprivate(user.privateKey);
        setCommandList((prev) => [...prev, `Public Key for ${aid}: ${user.publicKey}`]);
    }

    async function getKeyUserB() {
        if (!bid) {
            setCommandList((p) => [...p, "Set B id before generating key."]);
            return;
        }
        const user = await createServerKey(bits, bid);
        setBpublic(user.publicKey);
        setBprivate(user.privateKey);
        setCommandList((prev) => [...prev, `Public Key for ${bid}: ${user.publicKey}`]);
    }

    async function createMessage(encryptedText, signatureBase64, plaintext, fromId, toId) {
        try {
            const resp = await sendMessage(encryptedText, signatureBase64, plaintext, fromId, toId);

            const records = Array.isArray(resp) ? resp : [resp];
            const newMsgs = records.map((record) => ({
                id: record.id || `${Date.now()}-${Math.random()}`,
                sender: record.fromId || fromId,
                text: record.plaintext || plaintext,
            }));

            setMessagesText((prev) => [...prev, ...newMsgs]);
        } catch (e) {
            alert("Không tạo được tin nhắn. " + (e?.message || e));
        }
    }

    async function verifyMessage(publicKey, message, signature) {
        const verification = await Promise.resolve(verify(publicKey, message, signature, hashAlgorithm));
        const valid = typeof verification === "boolean" ? verification : verification?.valid;
        return !!valid;
    }

    async function signMessage(signerId, message) {
        const signature = await Promise.resolve(signDocument(signerId, message, hashAlgorithm));
        return signature?.signature;
    }

    async function encryptMessage(message, publicKey) {
        const encrypted = await Promise.resolve(encrypt(publicKey, message));
        return encrypted?.encryptedText;
    }

    async function decryptMessage(message, privateKey) {
        const decrypted = await Promise.resolve(decrypt(privateKey, message));
        return decrypted?.decryptedText;
    }

    async function handleSend(text, fromId) {
        if (!text || !text.trim()) return;

        if (fromId === aid) {
            if (!bid) {
                setCommandList((p) => [...p, "Set B id before sending."]);
                return;
            }
            const encryptedMessage = await encryptMessage(text, bpublic);
            setCommandList((prev) => [...prev, `User ${aid} gửi đến ${bid}: ${encryptedMessage}`]);
            const signatureA = await signMessage(aid, text);
            console.log("Signature A:", signatureA);
            setCommandList((prev) => [...prev, `User ${aid} ký thông điệp: ${signatureA}`]);

            const decryptedText = await decryptMessage(encryptedMessage, bprivate);
            setCommandList((prev) => [...prev, `User ${bid} giải mã thông điệp: ${decryptedText}`]);

            const validation = await verifyMessage(apublic, decryptedText, signatureA);
            if (validation) {
                setCommandList((prev) => [...prev, `User ${bid} đã xác thực chữ ký của ${aid}.`]);
                setCommandList((prev) => [...prev, `User ${aid} gửi thành công đến ${bid}: ${decryptedText}`]);
                await createMessage(encryptedMessage, signatureA, decryptedText, aid, bid);
                setTextA("");
            } else {
                setCommandList((prev) => [...prev, `User ${bid} xác thực chữ ký lỗi.`]);
                setCommandList((prev) => [...prev, `User ${aid} gửi thất bại đến ${bid}`]);
            }
        } else if (fromId === bid) {
            if (!aid) {
                setCommandList((p) => [...p, "Set A id before sending."]);
                return;
            }
            const encryptedMessage = await encryptMessage(text, apublic, algorithm);
            setCommandList((prev) => [...prev, `User ${bid} gửi đến ${aid}: ${encryptedMessage}`]);
            const signatureB = await signMessage(bid, text);
            console.log("Signature B:", signatureB);
            setCommandList((prev) => [...prev, `User ${bid} ký thông điệp: ${signatureB}`]);

            const decryptedText = await decryptMessage(encryptedMessage, aprivate);
            setCommandList((prev) => [...prev, `User ${aid} giải mã thông điệp: ${decryptedText}`]);

            const validation = await verifyMessage(bpublic, decryptedText, signatureB, hashAlgorithm);
            if (validation) {
                setCommandList((prev) => [...prev, `User ${bid} đã xác thực chữ ký của ${aid}.`]);
                setCommandList((prev) => [...prev, `User ${bid} gửi thành công đến ${aid}: ${decryptedText}`]);
                await createMessage(encryptedMessage, signatureB, decryptedText, bid, aid);
                setTextB("");
            } else {
                setCommandList((prev) => [...prev, `User ${aid} xác thực chữ ký lỗi.`]);
                setCommandList((prev) => [...prev, `User ${bid} gửi thất bại đến ${aid}`]);
            }
        }
    }

    function handleKeyDown(e, text, fromId) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(text, fromId);
        }
    }

    return (
        <div className="minichat-page">
            {/* === GIẢI THÍCH HỆ THỐNG MINI-CHAT (TIẾNG VIỆT) === */}
            <div className="minichat-explain card">
                <h3>Giải thích cơ chế MiniChat</h3>

                <p className="mt8">
                    MiniChat mô phỏng lại cách hai người dùng (A và B) trao đổi thông tin an toàn
                    bằng cách kết hợp giữa:
                </p>

                <ul>
                    <li><strong>RSA Encryption:</strong> Mã hóa tin nhắn bằng public key của người nhận.</li>
                    <li><strong>RSA Signature:</strong> Ký digital signature bằng private key của người gửi.</li>
                    <li><strong>Verification:</strong> Người nhận dùng public key của người gửi để xác thực.</li>
                </ul>

                <h4>1. Cơ chế mã hóa tin nhắn (Encryption)</h4>
                <p>
                    Mỗi lần A gửi tin nhắn cho B:
                </p>
                <div className="formula-block">
                    <code>cipher = mᵉ mod n</code>
                    <p className="small muted">Trong đó m là nội dung tin nhắn đã chuyển thành số.</p>
                </div>

                <h4>2. Ký số (Digital Signature)</h4>
                <p>
                    Trước khi gửi, A ký tin nhắn:
                </p>
                <div className="formula-block">
                    <code>signature = mᵈᴬ mod nᴬ</code>
                    <p className="small muted">B dùng public key của A để xác thực chữ ký:</p>
                    <code>m = signatureᵉᴬ mod nᴬ</code>
                </div>

                <h4>3. Giải mã (Decryption)</h4>
                <p>Khi nhận được cipher, B giải mã bằng private key của mình:</p>
                <div className="formula-block">
                    <code>m = cipherᵈᴮ mod nᴮ</code>
                </div>

                <h4>4. Quy trình gửi của A → B</h4>
                <ol>
                    <li>A nhập tin nhắn.</li>
                    <li>A ký tin nhắn bằng private key của chính mình.</li>
                    <li>A mã hóa tin nhắn bằng public key của B.</li>
                    <li>Server lưu lại tin đã mã hóa + chữ ký.</li>
                    <li>B tải tin về và giải mã bằng private key.</li>
                    <li>B xác thực chữ ký bằng public key của A.</li>
                </ol>

                <p className="muted mt12">
                    MiniChat giúp bạn quan sát <strong>toàn bộ quá trình mã hóa – giải mã – ký – xác thực</strong>
                    diễn ra theo đúng chuẩn RSA nhưng trong giao diện trực quan.
                </p>
            </div>

            {/* TOP: options*/}
            <div className="minichat-options">
                <div className="opt">
                    <label>Algorithm</label>
                    <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                        <option value="RSA">RSA</option>
                    </select>
                </div>

                <div className="opt">
                    <label>Hash</label>
                    <select value={hashAlgorithm} onChange={(e) => setHashAlgorithm(e.target.value)}>
                        <option value="SHA-256">SHA-256</option>
                        <option value="SHA-384">SHA-384</option>
                        <option value="SHA-512">SHA-512</option>
                    </select>
                </div>

                <div className="opt">
                    <label>Key Size (bits)</label>
                    <input
                        type="number"
                        min={512}
                        max={4096}
                        step={256}
                        value={bits}
                        onChange={(e) => setBits(Number(e.target.value))}
                    />
                </div>

                {/* Note: Gen A / Gen B buttons removed as requested */}
            </div>

            {/* MAIN GRID: A | CLI | B */}
            <div className="minichat-grid">
                {/* --- LEFT: User A (login or chat) */}
                <div className="chat-col scrollable">
                    <div className="col-header">
                        <div className="left">
                            <h4>{loggedA ? `User A — ${aid}` : "User A"}</h4>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>
                                {loggedA ? "Logged in" : "Not logged"}
                            </div>
                        </div>
                        <div>
                            {loggedA ? (
                                <button className="btn btn-ghost" onClick={handleLogoutA}>
                                    Logout
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        value={aid}
                                        onChange={(e) => setAid(e.target.value)}
                                        placeholder="id for A"
                                        style={{ padding: 8, borderRadius: 8, border: "1px solid #e6edf3" }}
                                    />
                                    <button className="btn btn-primary" onClick={handleLoginA}>
                                        Login
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {loggedA ? (
                        <>
                            <div ref={messagesListRefA} className="chat-list">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {messagesText.map((m) => (
                                        <MessageBubble key={m.id} message={m.text} meId={aid} senderId={m.sender} />
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="composer">
                                <input
                                    className="composer-input"
                                    value={textA}
                                    onChange={(e) => setTextA(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, textA, aid)}
                                    placeholder="A: Write a message..."
                                />
                                <button className="composer-send" onClick={() => handleSend(textA, aid)}>
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ marginTop: 18, color: "var(--muted)" }}>
                            Please login to show messages and keys for A.
                        </div>
                    )}
                </div>

                {/* --- CENTER: CLI / command log --- */}
                <div className="cli-shell scrollable">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700 }}>Transmission Log</div>
                        <div style={{ fontSize: 12, color: "#9fbbe0" }}>Live · {commandList.length} events</div>
                    </div>

                    <div ref={commandsListRef} className="command-list">
                        <AnimatePresence initial={false} mode="popLayout">
                            {commandList.map((line, idx) => (
                                <div key={idx} className="command-item">
                                    {line}
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>

                </div>

                {/* --- RIGHT: User B (login or chat) */}
                <div className="chat-col scrollable">
                    <div className="col-header">
                        <div className="left">
                            <h4>{loggedB ? `User B — ${bid}` : "User B"}</h4>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>{loggedB ? "Logged in" : "Not logged"}</div>
                        </div>
                        <div>
                            {loggedB ? (
                                <button className="btn btn-ghost" onClick={handleLogoutB}>
                                    Logout
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        value={bid}
                                        onChange={(e) => setBid(e.target.value)}
                                        placeholder="id for B"
                                        style={{ padding: 8, borderRadius: 8, border: "1px solid #e6edf3" }}
                                    />
                                    <button className="btn btn-primary" onClick={handleLoginB}>
                                        Login
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {loggedB ? (
                        <>
                            <div ref={messagesListRefB} className="chat-list">
                                <AnimatePresence initial={false} mode="popLayout">
                                    {messagesText.map((m) => (
                                        <MessageBubble key={m.id} message={m.text} meId={bid} senderId={m.sender} />
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="composer">
                                <Composer text={textB} setText={setTextB} onSend={() => handleSend(textB, bid)} onKeyDown={(e) => handleKeyDown(e, textB, bid)} />
                            </div>
                        </>
                    ) : (
                        <div style={{ marginTop: 18, color: "var(--muted)" }}>Please login to show messages and keys for B.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
