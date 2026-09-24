import { SUBCORTICAL_VOLUME, CORTICAL_SURFACE_AREA, VOLBRAIN_BOTH_REPORTS, WITHDRAWN } from "../data/scanData.js";

function Table({ head, rows, pctlCols = [2, 4] }) {
  return (
    <div className="table-scroll">
      <table className="scan-table">
        <tbody>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={pctlCols.includes(j) ? "pctl" : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ScanModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2 className="display" style={{ fontSize: 22 }}>
            Full Scan Data
          </h2>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            Close
          </button>
        </div>
        <p style={{ fontSize: 12 }}>
          Age 27 · female · percentiles vs healthy women this age · CentileBrain, cross-checked against 483 healthy women measured the same way · audited 24 Sep 2026.
        </p>

        <div className="scan-section">
          <h4>Subcortical volume (percentile)</h4>
          <Table head={["Structure", "CentileBrain L", "CentileBrain R", "483 women L", "483 women R"]} rows={SUBCORTICAL_VOLUME} pctlCols={[1, 2]} />
        </div>

        <div className="scan-section">
          <h4>Cortical surface area (percentile) · ⚠ = conversion only good to ±11–25%</h4>
          <Table head={["Region", "CentileBrain L", "CentileBrain R", "483 women L", "483 women R"]} rows={CORTICAL_SURFACE_AREA} pctlCols={[1, 2]} />
        </div>

        <div className="scan-section">
          <h4>volBrain — flagged in both reports</h4>
          <Table head={["Region", "Verdict"]} rows={VOLBRAIN_BOTH_REPORTS} pctlCols={[1]} />
        </div>

        <div className="scan-section">
          <h4>Withdrawn</h4>
          <Table head={["Old number", "Why"]} rows={WITHDRAWN} pctlCols={[]} />
        </div>

        <div className="note-box">
          <strong>Cortical thickness:</strong> not measurable on this scan type (post-contrast T1 SPACE), so no thickness percentiles are listed.
          <br />
          <br />
          <strong>Main patterns:</strong> (1) thalamus high — the most solid finding; (2) putamen and caudate above average; (3) left parietal / language-side surface large —
          supramarginal, superior parietal, insula; (4) visual cortex surface large — pericalcarine, cuneus; (5) left medial temporal and orbitofrontal surface small —
          parahippocampal, entorhinal, temporal pole, orbitofrontal; (6) left touch cortex (postcentral) small — CentileBrain plus both volBrain reports.
          <br />
          <br />
          <strong>What would give certainty:</strong> one standard 3D T1 MPRAGE (no dye, ideally 3T, 1 mm) through standard FreeSurfer and CentileBrain.
        </div>
      </div>
    </div>
  );
}
