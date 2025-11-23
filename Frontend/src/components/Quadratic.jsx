// /mnt/data/Quadratic.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/QuadraticSieve.css";

const api = import.meta.env.VITE_API_URL;
export const API_BASE = `${api}/api/attack`;

async function runQS(e, n, bound, interval) {
    const requestBody = { e: String(e), n: String(n), bound: String(bound), interval: String(interval) };
    const resp = await fetch(`${API_BASE}/sieve/${bound}/${interval}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });
    if (!resp.ok) throw new Error(`API call failed with status: ${resp.status}`);
    return resp.json();
}

function maskToBits(mask, length = 0) {
    if (!mask) return "";
    if (/^[01]+$/.test(mask)) {
        const s = mask; return length ? s.padStart(length, "0") : s;
    }
    const compact = mask.replace(/\s+/g, "");
    if (/^[0-9a-fA-F]+$/.test(compact)) {
        let bits = "";
        for (let i = 0; i < compact.length; i += 2) {
            const byte = parseInt(compact.substr(i, 2), 16);
            bits += byte.toString(2).padStart(8, "0");
        }
        return length ? bits.padStart(length, "0") : bits;
    }
    return mask.toString();
}

function expsToMask(exps) {
    if (!Array.isArray(exps)) return "";
    return exps.map(v => (v & 1) ? "1" : "0").reverse().join("");
}

// convert BigInt -> bitstring MSB left length=FB
function bigIntToBits(bi, length) {
    let s = "";
    for (let j = 0; j < length; j++) {
        s = (((bi >> BigInt(j)) & 1n) ? "1" : "0") + s;
    }
    return s;
}

export function Quadratic({ e, n, bound, interval }) {
    const [steps, setSteps] = useState([]);
    const [index, setIndex] = useState(0);
    const [auto, setAuto] = useState(false);
    const [speedMs, setSpeedMs] = useState(300);
    const [status, setStatus] = useState("idle");
    const [localOverrides, setLocalOverrides] = useState({});
    const [gaussState, setGaussState] = useState(null);
    const [runDurationMs, setRunDurationMs] = useState(null);

    const timerRef = useRef(null);
    const boxRef = useRef(null);

    useEffect(() => {
        if (!boxRef.current) return;
        try { boxRef.current.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }); } catch { boxRef.current.scrollTop = boxRef.current.scrollHeight; }
    }, [index, steps]);

    useEffect(() => {
        if (!auto) {
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
            return;
        }
        if (index >= steps.length) { setAuto(false); setStatus("finished"); return; }
        setStatus("running");
        timerRef.current = setTimeout(() => setIndex(i => Math.min(i + 1, steps.length)), speedMs);
        return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
    }, [auto, index, steps.length, speedMs]);

    const getStep = useCallback((i) => {
        const s = steps[i];
        if (!s) return null;
        const o = localOverrides[i];
        return o ? { ...s, ...o } : s;
    }, [steps, localOverrides]);

    const run = useCallback(async () => {
        setStatus("running"); setAuto(false); setIndex(0); setSteps([]); setGaussState(null); setRunDurationMs(null);
        try {
            const t0 = performance.now();
            const result = await runQS(e, n, bound, interval);
            const t1 = performance.now();
            setRunDurationMs(Math.round(t1 - t0));
            if (!result || !Array.isArray(result.steps)) throw new Error("Invalid result from server");
            const normalized = result.steps.map(s => ({ type: s.type ?? "info", ...s }));
            setSteps(normalized);
            setIndex(0);
            setStatus("idle");
        } catch (err) {
            console.error("QS failed", err);
            setSteps([{ type: "error", message: String(err?.message ?? err) }]);
            setIndex(1);
            setStatus("error");
        }
    }, [e, n, bound, interval]);

    // derive relations and factorBase size from steps
    const { relations, FB } = useMemo(() => {
        const rels = [];
        let fb = null;
        for (let s of steps) {
            if (s.type === "relation") {
                rels.push({
                    x: s.x,
                    Qx: s.Qx,
                    exponents: Array.isArray(s.exponents) ? s.exponents.slice() : null,
                    stepIndex: null,
                });
                if (Array.isArray(s.exponents)) fb = s.exponents.length;
            }
        }
        for (let i = 0, ri = 0; i < steps.length; i++) {
            if (steps[i].type === "relation") {
                if (rels[ri]) rels[ri].stepIndex = i;
                ri++;
            }
        }
        return { relations: rels, FB: fb ?? 0 };
    }, [steps]);

    // rowMasks strings from relations
    const rowMasksStr = useMemo(() => relations.map((r) => {
        const s = steps[r.stepIndex];
        if (Array.isArray(r.exponents)) return expsToMask(r.exponents);
        if (s && s.mask) return maskToBits(s.mask, FB);
        return "0".repeat(FB);
    }), [relations, steps, FB]);

    // re-init gauss automatically if relations length changed (keeps gaussState in-sync)
    useEffect(() => {
        if (relations.length === 0) { setGaussState(null); return; }
        // if gaussState is missing or sizes mismatch -> reinit
        if (!gaussState || (gaussState && gaussState.rowMasks.length !== relations.length)) {
            initGaussSimulation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [relations.length]);

    function initGaussSimulation() {
        const rowMasks = rowMasksStr.map(bits => {
            let bi = 0n;
            // bits currently MSB-left; reverse so index0 maps to LSB
            const s = bits.split("").reverse().join("");
            for (let j = 0; j < s.length; j++) if (s[j] === "1") bi |= (1n << BigInt(j));
            return bi;
        });
        const trans = rowMasks.map((_, i) => (1n << BigInt(i)));
        setGaussState({ rowMasks, trans, row: 0, col: 0, history: [] });
    }

    function gaussStepForward() {
        if (!gaussState) return;
        const rm = gaussState.rowMasks.slice();
        const tr = gaussState.trans.slice();
        let { row, col, history } = gaussState;
        const Rlen = rm.length;
        // find next pivot column
        let pivotCol = -1;
        for (let c = col; c < FB; c++) {
            let sel = -1;
            for (let r = row; r < Rlen; r++) if ((rm[r] >> BigInt(c)) & 1n) { sel = r; break; }
            if (sel !== -1) { pivotCol = c; break; }
        }
        if (pivotCol === -1) { setGaussState(gs => ({ ...gs, row: row, col: FB, history })); return; }
        // find selected row
        let selIdx = -1;
        for (let r = row; r < Rlen; r++) if ((rm[r] >> BigInt(pivotCol)) & 1n) { selIdx = r; break; }
        if (selIdx === -1) { setGaussState(gs => ({ ...gs, col: pivotCol + 1 })); return; }
        // swap if needed
        if (selIdx !== row) {
            const tmpMask = rm[row]; rm[row] = rm[selIdx]; rm[selIdx] = tmpMask;
            const tmpTrans = tr[row]; tr[row] = tr[selIdx]; tr[selIdx] = tmpTrans;
            history.push({ op: "swap", a: row, b: selIdx, col: pivotCol });
        } else {
            history.push({ op: "pivot", row: row, col: pivotCol });
        }
        // eliminate
        for (let r = 0; r < Rlen; r++) {
            if (r !== row && ((rm[r] >> BigInt(pivotCol)) & 1n)) {
                rm[r] = rm[r] ^ rm[row];
                tr[r] = tr[r] ^ tr[row];
                history.push({ op: "xor", src: row, tgt: r, col: pivotCol });
            }
        }
        row++;
        col = pivotCol + 1;
        setGaussState({ rowMasks: rm.slice(), trans: tr.slice(), row, col, history });
    }

    function gaussReset() { setGaussState(null); }

    // Render mask tiles
    function MaskTiles({ bits }) {
        if (!bits) return null;
        return (
            <div className="qs-mask-tiles" aria-hidden>
                {bits.split("").map((b, i) => <div key={i} className={`tile ${b === "1" ? "on" : "off"}`}></div>)}
            </div>
        );
    }

    // Relation table (same as before)
    function RelationTable() {
        return (
            <div className="qs-relations">
                <h4>Relations ({relations.length})</h4>
                <div className="qs-rel-table">
                    <div className="qs-rel-head qs-row">
                        <div>#</div><div className="mono">x</div><div className="mono">|Q(x)|</div><div>exponents</div><div>parity</div><div>action</div>
                    </div>
                    {relations.map((r, idx) => {
                        const stepIdx = r.stepIndex;
                        const step = getStep(stepIdx) || {};
                        const bits = Array.isArray(r.exponents) ? expsToMask(r.exponents) : (step.mask ? maskToBits(step.mask, FB) : "");
                        return (
                            <div key={idx} className="qs-row qs-rel-row">
                                <div>{idx}</div>
                                <div className="mono small">{String(r.x).slice(0, 24)}</div>
                                <div className="mono small">{String(r.Qx).slice(0, 24)}</div>
                                <div className="mono small">{Array.isArray(r.exponents) ? "[" + r.exponents.join(",") + "]" : "-"}</div>
                                <div><MaskTiles bits={bits} /></div>
                                <div>
                                    <button className="btn tiny" onClick={() => { setIndex(stepIdx + 1); }}>View</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Parity matrix: when gaussState present render it, else render original rowMasksStr
    function ParityMatrix() {
        if (relations.length === 0 || FB === 0) return <div className="qs-matrix-empty">No matrix to display</div>;
        const rowsToRender = gaussState ? gaussState.rowMasks.map(bi => bigIntToBits(bi, FB)) : rowMasksStr;
        return (
            <div className="qs-matrix">
                <h4>Parity Matrix</h4>
                <div className="matrix-wrapper">
                    <div className="matrix-grid" style={{ gridTemplateColumns: `40px repeat(${Math.max(1, FB)}, 20px)` }}>
                        <div className="matrix-header">#</div>
                        {Array.from({ length: FB }).map((_, j) => (<div key={j} className="matrix-header mono small">{j}</div>))}
                        {rowsToRender.map((bits, i) => (
                            <React.Fragment key={i}>
                                <div className="matrix-row-index">{i}</div>
                                {bits.split("").map((b, j) => (
                                    <div key={j} className={`matrix-cell ${b === "1" ? "one" : "zero"}`}></div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="qs-matrix-controls">
                    <button className="btn" onClick={initGaussSimulation}>Init Gauss</button>
                    <button className="btn" onClick={gaussStepForward} disabled={!gaussState}>Step Gauss</button>
                    <button className="btn" onClick={gaussReset} disabled={!gaussState}>Reset Gauss</button>
                </div>

                {gaussState && (
                    <div className="qs-gauss-state">
                        <div>Row: {gaussState.row} • Col: {gaussState.col} • Rows total: {gaussState.rowMasks.length}</div>
                        <div className="qs-gauss-history">
                            {gaussState.history.slice(-12).map((h, idx) => (
                                <div key={idx} className="gauss-item">
                                    <div><strong>{h.op?.toUpperCase()}</strong></div>
                                    {h.src !== undefined && <div className="mono small">src: {h.src}</div>}
                                    {h.tgt !== undefined && <div className="mono small">tgt: {h.tgt}</div>}
                                    {h.a !== undefined && h.b !== undefined && <div className="mono small">swap: {h.a} ↔ {h.b}</div>}
                                    {h.col !== undefined && <div className="mono small">col: {h.col}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Explanation panel - replaces step editor
    function ExplanationPanel() {
        const cur = index > 0 ? getStep(index - 1) : null;

        // dynamic computed displays for current step
        let parityDisplay = null;
        if (cur && Array.isArray(cur.exponents)) {
            parityDisplay = expsToMask(cur.exponents);
        }

        let combineInfo = null;
        if (cur && cur.type === "combine") {
            combineInfo = {
                Xprod: cur.x,
                Yprod: cur.Qx,
                note: "Xprod and Yprod provided by backend; Yprod = ∏ p^(totalExp[j]/2) mod n (requires factor base primes)."
            };
        }

        return (
            <div className="qs-editor explanation">
                <h4>Quadratic Sieve — Giải thích & trạng thái</h4>
                <div className="explain-block">
                    <strong>Mục tiêu:</strong> tìm tập relations sao cho khi nhân lại các Q(x) theo exponent, mọi exponent đều chẵn → tạo được X² ≡ Y² (mod n) → gcd(X±Y, n) đưa ra p hoặc q.
                </div>

                <div className="explain-block">
                    <strong>Luồng mô phỏng:</strong>
                    <ol>
                        <li><em>Collect relations</em>: tìm x sao cho Q(x) = x² − n phân tích hết theo factor base → lưu exponents (mảng số nguyên).</li>
                        <li><em>Parity matrix</em>: mỗi relation → vector parity (exponents mod 2). Ma trận R×B.</li>
                        <li><em>Gaussian elimination (mod 2)</em>: tìm dependency (rowMasks == 0). Khi một hàng trở về 0 nghĩa là tổ hợp các relations tạo square.</li>
                        <li><em>Combine</em>: nhân X_i của relations được chọn → Xprod; tính Yprod từ tổng exponent (chia 2) → thử gcd(X±Y, n).</li>
                    </ol>
                </div>

                <div className="explain-block">
                    <strong>Mapping QSStep → UI:</strong>
                    <ul>
                        <li><code>test</code>: đang kiểm tra x, hiển thị x và Q(x).</li>
                        <li><code>relation</code>: relation mới; UI thêm hàng vào bảng relations và ma trận parity.</li>
                        <li><code>gauss</code>: thông báo bắt đầu/hoàn tất Gaussian elimination.</li>
                        <li><code>dependency</code>: phát hiện dependency; field <code>mask</code> chứa bitmask các relation kết hợp.</li>
                        <li><code>combine</code>: backend đã tính Xprod và Yprod; UI hiển thị và giải thích bước gcd tiếp theo.</li>
                        <li><code>found</code>: tìm thấy p & q.</li>
                        <li><code>done</code>: kết thúc (thành công/không thành công).</li>
                        <li><code>error</code>: lỗi (hiển thị message).</li>
                    </ul>
                </div>

                <div className="explain-block">
                    <strong>Step hiện tại:</strong>
                    {!cur ? <div>Chưa chọn bước</div> : (
                        <>
                            <div className="mono"><strong>{cur.type?.toUpperCase()}</strong> {cur.message ? " - " + cur.message : ""}</div>
                            {cur.type === "relation" && parityDisplay && (
                                <div style={{ marginTop: 8 }}>
                                    <div><strong>exponents:</strong> <span className="mono small">[{cur.exponents.join(",")}]</span></div>
                                    <div style={{ marginTop: 6 }}><strong>parity (mod 2):</strong> <span className="mono small">{parityDisplay}</span></div>
                                </div>
                            )}
                            {cur.type === "combine" && combineInfo && (
                                <div style={{ marginTop: 8 }}>
                                    <div><strong>Xprod:</strong> <span className="mono small">{combineInfo.Xprod}</span></div>
                                    <div><strong>Yprod:</strong> <span className="mono small">{combineInfo.Yprod}</span></div>
                                    <div style={{ marginTop: 6, color: "#cfe6ff" }}>{combineInfo.note}</div>
                                </div>
                            )}
                            {cur.mask && (
                                <div style={{ marginTop: 8 }}>
                                    <div><strong>mask:</strong> <span className="mono small">{String(cur.mask)}</span></div>
                                    <div style={{ marginTop: 6 }}><strong>Giải thích:</strong> bitmask cho biết relations nào được kết hợp (bit i = 1 → lấy relation i).</div>
                                </div>
                            )}
                            {cur.type === "info" && cur.message && cur.message.startsWith("gcd(") && (
                                <div style={{ marginTop: 8 }}>
                                    <div><strong>GCD result:</strong> <span className="mono small">{cur.message}</span></div>
                                    <div style={{ marginTop: 6 }}>Nếu gcd != 1 và != n → tìm được factor non-trivial.</div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="explain-block">
                    <strong>Ghi chú vận hành (UI):</strong>
                    <ul>
                        <li>Nhấn <em>Init Gauss</em> sau khi đủ relations để khởi tạo simulation.</li>
                        <li>Sử dụng <em>Step Gauss</em> để mô phỏng pivot/swap/xor từng bước; phía dưới sẽ hiển thị lịch sử (swap/xor).</li>
                        <li>Nếu backend trả <code>combine</code> với Xprod/Yprod, UI hiển thị chi tiết và bạn có thể kiểm tra gcd.</li>
                        <li>Factor base primes không trả về trong step — để tính Yprod thực tế bạn cần list primes; hiện UI chỉ hiển thị công thức & các giá trị do backend cung cấp.</li>
                    </ul>
                </div>
            </div>
        );
    }

    const visible = steps.slice(0, index).filter(s => s.type !== "hidden");
    const current = index > 0 ? getStep(index - 1) : null;

    return (
        <div className="qs-root">
            <ExplanationPanel />
            {/* TOP */}
            <div className="qs-top split">
                <div className="qs-controls-left">
                    <button className="btn" onClick={run}>Run</button>
                    <button className="btn" onClick={() => setIndex(i => Math.max(0, i - 1))}>Prev</button>
                    <button className="btn" onClick={() => setIndex(i => Math.min(steps.length, i + 1))}>Next</button>
                    <button className={`btn ${auto ? "active" : ""}`} onClick={() => setAuto(a => !a)}>{auto ? "Auto: ON" : "Auto: OFF"}</button>
                </div>

                <div className="qs-controls-right">
                    <div className="qs-meta-line">
                        <div className="mono small">e: <strong>{String(e ?? "—")}</strong></div>
                        <div className="mono small" style={{ marginLeft: 12 }}>n: <strong>{String(n ?? "—")}</strong></div>
                        {runDurationMs != null && <div className="mono small" style={{ marginLeft: 12, color: "#9fd0ff" }}>Run time: <strong>{runDurationMs} ms</strong></div>}
                    </div>
                    <div className="speed-control">
                        <label className="small">Speed</label>
                        <input type="range" min="50" max="2000" value={speedMs} onChange={ev => setSpeedMs(Number(ev.target.value))} />
                        <div className="small muted">{speedMs}ms</div>
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="qs-body">
                <div className="qs-left" ref={boxRef}>
                    <div className="qs-log">
                        {visible.length === 0 ? <div className="qs-empty">No steps — press Run</div> : visible.map((s, i) => (
                            <div key={i} className={`qs-line qs-${s.type} ${i === visible.length - 1 ? "qs-current" : ""}`}>
                                <pre className="mono">{i + 1}. {s.type.toUpperCase()}{s.message ? " - " + s.message : ""}</pre>
                                {s.type === "relation" && Array.isArray(s.exponents) && (
                                    <div className="qs-rel-details">
                                        <div><strong>x:</strong> <span className="mono small">{String(s.x).slice(0, 32)}</span></div>
                                        <div><strong>Q(x):</strong> <span className="mono small">{String(s.Qx).slice(0, 32)}</span></div>
                                        <div><strong>exponents:</strong> <span className="mono small">{s.exponents.join(",")}</span></div>
                                    </div>
                                )}
                                {s.mask && <div className="qs-mask-row"><MaskTiles bits={maskToBits(s.mask, FB)} /></div>}
                            </div>
                        ))}
                    </div>

                    <div className="qs-bottom" style={{ marginTop: 12 }}>
                        <div className="qs-left-panels">
                            <RelationTable />
                            <ParityMatrix />
                        </div>

                        <div className="qs-right-panels">
                            <div className="qs-current-card">
                                {!current ? <div>No step</div> : (
                                    <>
                                        <div className="mono"><strong>{current.type?.toUpperCase()}</strong> {current.relationIndex !== undefined ? `#${current.relationIndex}` : ""}</div>
                                        {current.message && <div className="muted">{current.message}</div>}
                                        {current.x && <div><strong>x:</strong> <span className="mono small">{String(current.x).slice(0, 40)}</span></div>}
                                        {current.Qx && <div><strong>Q(x):</strong> <span className="mono small">{String(current.Qx).slice(0, 40)}</span></div>}
                                        {current.exponents && <div><strong>exponents:</strong> <span className="mono small">{current.exponents.join(",")}</span></div>}
                                        {current.mask && <div><strong>mask:</strong> <span className="mono small">{String(current.mask).slice(0, 80)}</span></div>}
                                        {current.p && <div><strong>p:</strong> <span className="mono small">{current.p}</span> <strong style={{ marginLeft: 8 }}>q:</strong> <span className="mono small">{current.q}</span></div>}
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <footer className="qs-footer">
                <div>Status: <strong>{status}</strong></div>
                <div>{index}/{steps.length} steps</div>

                <div>
                    Result: <strong>
                        {steps.length === 0
                            ? "—"
                            : `${steps[steps.length - 1].type} - ${steps[steps.length - 1].message ?? ""}`
                        }
                    </strong>
                </div>
            </footer>

        </div>
    );
}

export default Quadratic;
