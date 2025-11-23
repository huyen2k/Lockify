import React, { useState } from "react";
import "../styles/Attack.css";
import { TrialDivision } from "../components/TrialDivision";

export default function TrialDivisions() {
  const [val_e, setValE] = useState("");
  const [val_n, setValN] = useState("");

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
                  <input
                    value={val_n}
                    onChange={(ev) => setValN(ev.target.value)}
                    placeholder="decimal n"
                  />
                </div>
              </div>

              <div className="key-field" style={{ marginTop: 8 }}>
                <label>Public exponent e</label>
                <div className="key-input-row">
                  <input
                    value={val_e}
                    onChange={(ev) => setValE(ev.target.value)}
                    placeholder="decimal e"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Trial Division Section */}
          <div className="card section">
            <TrialDivision e={val_e} n={val_n} />
          </div>
        </div>
      </div>
    </div >
  );
}
