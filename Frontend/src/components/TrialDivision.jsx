// TrialDivision.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "../styles/TrialDivision.css";

const api = import.meta.env.VITE_API_URL;
export const API_BASE = `${api}/api/attack`;
async function runTrial(e, n) {
    const requestBody = { e: String(e), n: String(n) };
    const resp = await fetch(`${API_BASE}/trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });
    if (!resp.ok) throw new Error(`API call failed with status: ${resp.status}`);
    return resp.json();
}

export function TrialDivision({ e, n }) {
    const [steps, setSteps] = useState([]);
    const [index, setIndex] = useState(0);
    const [auto, setAuto] = useState(false);
    const [speedMs, setSpeedMs] = useState(300);
    const [status, setStatus] = useState("idle");
    const [filterType, setFilterType] = useState("all");
    const [runDurationMs, setRunDurationMs] = useState(null);

    const timerRef = useRef(null);
    const boxRef = useRef(null);
    const startRef = useRef(null);

    // auto-scroll khi index/steps thay đổi
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        try { el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }
        catch { el.scrollTop = el.scrollHeight; }
    }, [index, steps]);

    // autoplay
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
        return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
    }, [auto, index, steps.length, speedMs]);

    // phím tắt
    useEffect(() => {
        const handler = (ev) => {
            if (ev.key === " ") { ev.preventDefault(); setAuto(a => !a); }
            else if (ev.key === "ArrowRight") setIndex(i => Math.min(i + 1, steps.length));
            else if (ev.key === "ArrowLeft") setIndex(i => Math.max(i - 1, 0));
            else if (ev.key === "c" || ev.key === "C") clearAll();
            else if (ev.key === "r" || ev.key === "R") run();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [steps.length]);

    // run trial (gọi API)
    const run = useCallback(async () => {
        setStatus("running");
        setAuto(false);
        setIndex(0);
        setSteps([]);
        setRunDurationMs(null);
        try {
            startRef.current = performance.now();
            const res = await runTrial(e, n);
            const dur = Math.round(performance.now() - startRef.current);
            setRunDurationMs(dur);
            if (!res || !Array.isArray(res.steps)) throw new Error("Invalid response from API");
            const normalized = res.steps.map((s, i) => ({ __idx: i + 1, ...s }));
            setSteps(normalized);
            setIndex(0);
            setStatus("idle");
        } catch (err) {
            const dur = startRef.current ? Math.round(performance.now() - startRef.current) : null;
            setRunDurationMs(dur);
            setSteps([{ type: "error", message: String(err?.message ?? err) }]);
            setIndex(1);
            setStatus("error");
        }
    }, [e, n]);

    const next = () => setIndex(i => Math.min(i + 1, steps.length));
    const prev = () => setIndex(i => Math.max(i - 1, 0));
    const clearAll = () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setAuto(false); setStatus("idle"); setSteps([]); setIndex(0); setRunDurationMs(null);
    };

    const downloadLog = () => {
        const lines = steps.map(renderStepText).slice(0, index);
        const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `trial-log-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url);
    };

    const copyLog = async () => {
        const lines = steps.map(renderStepText).slice(0, index);
        try { await navigator.clipboard.writeText(lines.join("\n")); setStatus("copied"); setTimeout(() => setStatus("idle"), 800); }
        catch { setStatus("error"); setTimeout(() => setStatus("idle"), 1500); }
    };

    function renderStepText(s) {
        if (!s) return "";
        switch (s.type) {
            case "test": return `trial i=${s.i} → divisible=${s.divisible ? "YES" : "NO"}${s.rem != null ? ` (rem=${s.rem})` : ""}`;
            case "found": return `→ Found factor p=${s.p}, q=${s.q}`;
            case "done": return `→ DONE: d = ${s.d}${s.p && s.q ? ` (p=${s.p} × q=${s.q})` : ""}`;
            case "info": return `ℹ️ ${s.message || s.text || ""}`;
            case "error": return `⚠️ ERROR: ${s.message || s.text || ""}`;
            default: return String(s.message ?? JSON.stringify(s));
        }
    }

    const visible = steps.slice(0, index).filter(s => (filterType === "all" ? true : s.type === filterType));
    const currentStep = index > 0 ? steps[index - 1] : null;

    function CurrentCard() {
        if (!currentStep) return (
            <div className="trial-cli-current empty">
                <div className="title">No step selected</div>
                <div className="sub">Press Run or Next</div>
            </div>
        );

        if (currentStep.type === "test") {
            return (
                <div className="trial-cli-current test">
                    <div className="title">Testing divisor</div>
                    <div className="row"><strong>i:</strong> <span className="mono">{currentStep.i}</span></div>
                    <div className="row"><strong>divisible:</strong> {currentStep.divisible ? <span className="yes">YES</span> : <span className="no">NO</span>}</div>
                    {currentStep.rem != null && <div className="row small">remainder: {currentStep.rem}</div>}
                </div>
            );
        }
        if (currentStep.type === "found") {
            return (
                <div className="trial-cli-current found">
                    <div className="title">Factor found</div>
                    <div className="row"><strong>p:</strong> <span className="mono">{currentStep.p}</span></div>
                    <div className="row"><strong>q:</strong> <span className="mono">{currentStep.q}</span></div>
                    {runDurationMs != null && <div className="row small">runtime: {runDurationMs} ms</div>}
                </div>
            );
        }
        if (currentStep.type === "done") {
            return (
                <div className="trial-cli-current done">
                    <div className="title">Done</div>
                    <div className="row"><strong>d:</strong> <span className="mono">{currentStep.d}</span></div>
                    {currentStep.p && currentStep.q && <div className="row small">p: {currentStep.p} • q: {currentStep.q}</div>}
                </div>
            );
        }
        return (
            <div className="trial-cli-current info">
                <div className="title">{currentStep.type}</div>
                <div className="row small">{currentStep.message ?? JSON.stringify(currentStep)}</div>
            </div>
        );
    }

    return (
        <div className="trial-cli-root" data-trial-cli="1">
            <header className="trial-cli-header">
                <div>
                    <h3 className="trial-title">Trial Division</h3>
                    <div className="trial-meta">e: <span className="mono">{String(e ?? "—")}</span> • n: <span className="mono">{String(n ?? "—")}</span>
                        {runDurationMs != null && <span className="run-meta"> • runtime: {runDurationMs} ms</span>}
                    </div>
                </div>
            </header>

            {/* Moved explanation block ra ngoài - tiếng Việt */}
            <div className="trial-explain card">
                <h4>Giải thích thuật toán Trial Division</h4>
                <p className="muted">Thuật toán Trial Division thử chia n cho các số i nhỏ từ 2 đến √n để tìm ước.</p>
                <ol>
                    <li>Kiểm tra chia hết cho 2 (n % 2 == 0).</li>
                    <li>Kiểm tra các i lẻ: 3,5,7,... đến √n.</li>
                    <li>Nếu n % i == 0 → tìm được p = i và q = n / i.</li>
                </ol>
                <p className="muted">Lưu ý: Thuật toán sẽ chậm nếu n rất lớn; dùng n nhỏ (≤ 64-bit) để demo.</p>
            </div>

            <div className="trial-cli-controls">
                <div className="controls-left">
                    <button className="btn-t primary" onClick={run}>Run</button>
                    <button className="btn-t" onClick={prev}>Prev</button>
                    <button className="btn-t" onClick={next}>Next</button>
                    <button className={`btn-t ${auto ? "active" : ""}`} onClick={() => setAuto(a => !a)}>{auto ? "Auto ON" : "Auto OFF"}</button>
                </div>

                <div className="controls-right">
                    <label className="speed">Speed
                        <input type="range" min="50" max="2000" value={speedMs} onChange={(ev) => setSpeedMs(Number(ev.target.value))} />
                        <span className="speed-val">{speedMs}ms</span>
                    </label>

                    <select className="filter" value={filterType} onChange={(ev) => setFilterType(ev.target.value)}>
                        <option value="all">All</option>
                        <option value="test">Test</option>
                        <option value="found">Found</option>
                        <option value="done">Done</option>
                        <option value="info">Info</option>
                        <option value="error">Error</option>
                    </select>

                    <button className="btn-t" onClick={clearAll}>Clear</button>
                    <button className="btn-t" onClick={copyLog}>Copy</button>
                    <button className="btn-t" onClick={downloadLog}>Download</button>
                </div>
            </div>

            <main className="trial-cli-main">
                <section className="cli-left">
                    <div className="cli-log" ref={boxRef} role="log" aria-live="polite">
                        {visible.length === 0 ? (
                            <div className="log-empty">No steps yet — press Run</div>
                        ) : (
                            visible.map((s, i) => (
                                <div key={i} className={`log-line log-${s.type || "info"} ${i === visible.length - 1 ? "current" : ""}`}>
                                    <pre>{renderStepText(s)}</pre>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cli-bottom">
                        <div className="current-wrap">
                            <CurrentCard />
                        </div>

                        {/* giữ phần giải thích nội bộ rút gọn nếu muốn */}
                        <div className="explain-small">
                            <h4>Ghi chú</h4>
                            <p className="muted">Sử dụng n nhỏ để theo dõi chi tiết từng bước.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="trial-cli-footer">
                <div className="status">Status: <strong>{status}</strong></div>
                <div className="count">{index}/{steps.length} steps</div>
            </footer>
        </div>
    );
}

export default TrialDivision;
