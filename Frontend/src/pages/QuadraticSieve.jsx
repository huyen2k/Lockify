// /mnt/data/QuadraticSieve.jsx
import React, { useState } from "react";
import "../styles/Attack.css";
import Quadratic from "../components/Quadratic";

export default function QuadraticSieve() {
    const [val_e, setValE] = useState("");
    const [val_n, setValN] = useState("");
    const [val_bound, setValBound] = useState("");
    const [val_interval, setValInterval] = useState("");

    return (
        <div className="secure-page">
            <div className="secure-grid">
                <div className="main-column">

                    {/* Input Section */}
                    <div className="card section">
                        <div style={{ marginTop: 12 }}>
                            <div className="key-field">
                                <label>Modulus n = p × q</label>
                                <div className="key-input-row">
                                    <input value={val_n} onChange={(ev) => setValN(ev.target.value)} placeholder="decimal n" />
                                </div>
                            </div>

                            <div className="key-field" style={{ marginTop: 8 }}>
                                <label>Public exponent e</label>
                                <div className="key-input-row">
                                    <input value={val_e} onChange={(ev) => setValE(ev.target.value)} placeholder="decimal e" />
                                </div>
                            </div>

                            <div className="key-field" style={{ marginTop: 8 }}>
                                <label>Factor Base Bound</label>
                                <div className="key-input-row">
                                    <input value={val_bound} onChange={(ev) => setValBound(ev.target.value)} placeholder="should be 10 x bit length of n" />
                                </div>
                            </div>

                            <div className="key-field" style={{ marginTop: 8 }}>
                                <label>Sieve Interval</label>
                                <div className="key-input-row">
                                    <input value={val_interval} onChange={(ev) => setValInterval(ev.target.value)} placeholder="should be 2000" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quadratic Sieve Section */}
                    <div>
                        <Quadratic e={val_e} n={val_n} bound={val_bound} interval={val_interval} />
                    </div>
                </div>
            </div>
        </div >
    );
}
