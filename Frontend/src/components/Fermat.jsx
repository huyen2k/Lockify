// src/components/Fermat.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "../styles/Fermat.css";

const api = import.meta.env.VITE_API_URL;
export const API_BASE = `${api}/api/attack`;

async function runFermatApi(e, n) {
    const resp = await fetch(`${API_BASE}/fermat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e: String(e), n: String(n) }),
    });
    if (!resp.ok) throw new Error(`API call failed with status: ${resp.status}`);
    return resp.json();
}

/**
 * Fermat component
 * - Giữ nguyên logic, chỉ dịch & đưa phần giải thích sang tiếng Việt
 * - Thêm hiển thị thời gian chạy (ms) — thời gian nhận phản hồi từ API
 * - Nút đặt ngang hàng
 */
export default function Fermat({ e, n }) {
    const [steps, setSteps] = useState([]);
    const [index, setIndex] = useState(0);
    const [auto, setAuto] = useState(false);
    const [speedMs, setSpeedMs] = useState(300);
    const [status, setStatus] = useState("idle");
    const [filterType, setFilterType] = useState("all");

    const [runDurationMs, setRunDurationMs] = useState(null); // <-- thời gian chạy (ms)

    const boxRef = useRef(null);
    const timerRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        try { el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }
        catch { el.scrollTop = el.scrollHeight; }
    }, [index, steps]);

    useEffect(() => {
        if (!auto) {
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
            return;
        }
        if (index >= steps.length) {
            setAuto(false);
            setStatus("finished");
            return;
        }
        setStatus("running");
        timerRef.current = setTimeout(() => setIndex(i => Math.min(i + 1, steps.length)), speedMs);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [auto, index, steps.length, speedMs]);

    useEffect(() => {
        const handler = ev => {
            if (ev.key === " ") { ev.preventDefault(); setAuto(a => !a); }
            else if (ev.key === "ArrowRight") setIndex(i => Math.min(i + 1, steps.length));
            else if (ev.key === "ArrowLeft") setIndex(i => Math.max(i - 1, 0));
            else if (ev.key === "c" || ev.key === "C") clearAll();
            else if (ev.key === "r" || ev.key === "R") run();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [steps.length]);

    // run now records start time and compute duration
    const run = useCallback(async () => {
        setStatus("running");
        setAuto(false);
        setIndex(0);
        setSteps([]);
        setRunDurationMs(null);
        startRef.current = performance.now();
        try {
            const result = await runFermatApi(e, n);
            const dur = Math.round(performance.now() - startRef.current);
            setRunDurationMs(dur);
            if (!result || !Array.isArray(result.steps)) {
                throw new Error("Invalid response from server");
            }
            setSteps(result.steps);
            setIndex(0);
            setStatus("idle");
        } catch (err) {
            const dur = startRef.current ? Math.round(performance.now() - startRef.current) : null;
            setRunDurationMs(dur);
            console.error("Fermat API failed", err);
            setSteps([{ type: "error", message: String(err?.message ?? err) }]);
            setIndex(1);
            setStatus("error");
        }
    }, [e, n]);

    const next = () => setIndex(i => Math.min(i + 1, steps.length));
    const prev = () => setIndex(i => Math.max(i - 1, 0));
    const clearAll = () => { setAuto(false); setStatus("idle"); setSteps([]); setIndex(0); setRunDurationMs(null); };

    const downloadLog = () => {
        const lines = steps.slice(0, index).map(renderStepText);
        const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fermat-log-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyLog = async () => {
        const lines = steps.slice(0, index).map(renderStepText);
        try {
            await navigator.clipboard.writeText(lines.join("\n"));
            setStatus("copied");
            setTimeout(() => setStatus("idle"), 800);
        } catch {
            // ignore
        }
    };

    function renderStepText(s) {
        if (!s) return "";
        switch (s.type) {
            case "start":
                return `ℹ️ ${s.message ?? "Fermat started"}`;
            case "test":
                return `$ test a=${s.a} → a² - n = ${s.x2_minus_n} → isSquare=${s.isSquare ? "YES" : "NO"}`;
            case "found":
                return `→ FOUND: p=${s.p}, q=${s.q}`;
            case "done":
                return s.d ? `→ DONE: d = ${s.d}` : `→ DONE: ${s.message ?? ""}`;
            case "info":
                return `ℹ️ ${s.message ?? ""}`;
            case "error":
                return `⚠️ ERROR: ${s.message ?? ""}`;
            default:
                return JSON.stringify(s);
        }
    }

    const visible = steps.slice(0, index).filter(s => (filterType === "all" ? true : s.type === filterType));
    const currentStep = steps[index - 1] ?? null;

    return (
        <div className="fermat-ui" data-fermat-ui="1">
            <div className="fermat-layout">
                {/* LEFT: CLI */}
                <div className="fd-wrapper" aria-live="polite">
                    <div className="fd-header">
                        <div>
                            <div className="fd-title">Fermat Factorization - Step by Step</div>
                            <div className="fd-meta">
                                e: <span className="mono">{String(e ?? "—")}</span> &nbsp;|&nbsp; n: <span className="mono">{String(n ?? "—")}</span>
                                {runDurationMs != null && <span className="run-meta"> • Thời gian phản hồi: <strong>{runDurationMs} ms</strong></span>}
                            </div>
                        </div>
                    </div>

                    <div className="fd-controls">
                        <div className="fd-buttons" role="toolbar">
                            <button className="btn" onClick={run} title="Run (R)">Run</button>
                            <button className="btn" onClick={prev} title="Prev (←)">Prev</button>
                            <button className="btn" onClick={next} title="Next (→)">Next</button>
                            <button className={`btn ${auto ? "active" : ""}`} onClick={() => setAuto(a => !a)} title="Auto (Space)">
                                {auto ? "Auto: ON" : "Auto: OFF"}
                            </button>
                            <button className="btn" onClick={clearAll} title="Clear (C)">Clear</button>
                            <button className="btn" onClick={copyLog} title="Copy">Copy</button>
                            <button className="btn" onClick={downloadLog} title="Download">Download</button>
                        </div>

                        <div className="fd-controls-right">
                            <label className="speed">Speed
                                <input type="range" min="50" max="2000" value={speedMs} onChange={ev => setSpeedMs(+ev.target.value)} />
                                <span className="speed-val">{speedMs}ms</span>
                            </label>

                            <select value={filterType} onChange={ev => setFilterType(ev.target.value)} className="filter" aria-label="Filter steps">
                                <option value="all">All</option>
                                <option value="test">Test</option>
                                <option value="found">Found</option>
                                <option value="done">Done</option>
                                <option value="info">Info</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                    </div>

                    <div className="fd-box" ref={boxRef}>
                        {visible.length === 0 ? (
                            <div className="fd-empty">No steps yet — press Run</div>
                        ) : (
                            visible.map((s, i) => (
                                <div
                                    key={i}
                                    className={`fd-line fd-${s.type || "info"} ${i === visible.length - 1 ? "fd-current" : ""}`}
                                >
                                    <pre>{renderStepText(s)}</pre>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="fd-footer">
                        <div className="fd-status">Status: {status}</div>
                        <div className="fd-count">{index}/{steps.length} steps</div>
                    </div>
                </div>

                {/* RIGHT: Explanation (đã dịch sang tiếng Việt) + current step details */}
                <aside className="fd-panel" aria-label="Giải thích và chi tiết">
                    <div className="panel-card">
                        <h3>📘 Fermat Factorization</h3>
                        <p className="muted">Fermat cố gắng biểu diễn <code>n = a² − b²</code>. Thuật toán nhanh khi p và q gần nhau.</p>

                        <div className="explain-block">
                            <h4>Các bước chính</h4>
                            <ol>
                                <li>Tính <code>a = ⌈√n⌉</code>.</li>
                                <li>Tính <code>b² = a² − n</code>.</li>
                                <li>Nếu <code>b²</code> là số chính phương thì ta có: <code>n = (a − b)(a + b)</code> và tìm được p, q.</li>
                            </ol>
                            <p className="muted">Thuật toán hiệu quả khi p và q có kích thước tương tự (|p−q| nhỏ).</p>
                        </div>

                        <hr />

                        <h4>Chi tiết bước hiện tại</h4>
                        {!currentStep ? (
                            <div className="muted">Chưa có bước chọn</div>
                        ) : (
                            <div className="step-details">
                                <div className="detail-row"><strong>Loại bước:</strong> <span>{currentStep.type}</span></div>
                                {currentStep.message && <div className="detail-row"><strong>Thông báo:</strong> <span>{currentStep.message}</span></div>}
                                {currentStep.a && <div className="detail-row"><strong>a:</strong> <span className="mono">{currentStep.a}</span></div>}
                                {currentStep.x2_minus_n && <div className="detail-row"><strong>a² − n:</strong> <span className="mono">{currentStep.x2_minus_n}</span></div>}
                                {typeof currentStep.isSquare !== "undefined" && <div className="detail-row"><strong>Là số chính phương:</strong> <span>{String(currentStep.isSquare)}</span></div>}
                                {currentStep.p && <div className="detail-row"><strong>p:</strong> <span className="mono">{currentStep.p}</span></div>}
                                {currentStep.q && <div className="detail-row"><strong>q:</strong> <span className="mono">{currentStep.q}</span></div>}
                                {currentStep.d && <div className="detail-row"><strong>d:</strong> <span className="mono">{currentStep.d}</span></div>}
                            </div>
                        )}

                        <hr />

                        <h4>Mẹo & Ghi chú</h4>
                        <ol className="hints">
                            <li>Hiệu quả nhất khi p và q gần nhau (|p − q| nhỏ).</li>
                            <li>Nếu thuật toán lặp quá nhiều bước, tăng giới hạn bước ở backend hoặc chuyển sang QS.</li>
                            <li>Để demo, dùng n nhỏ (khoảng 64–128 bits) để dễ quan sát từng bước.</li>
                        </ol>
                    </div>
                </aside>
            </div>
        </div>
    );
}
