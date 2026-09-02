import { SUBCORTICAL_VOLUME, CORTICAL_THICKNESS, CORTICAL_SURFACE_AREA, DISCARDED_ARTIFACTS } from "../data/scanData.js";

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
        <p style={{ fontSize: 12 }}>30F · FreeSurfer + Potvin 2016 + CentileBrain 2024 · audited by 3 independent verification passes.</p>

        <div className="scan-section">
          <h4>Subcortical volume</h4>
          <Table head={["Structure", "Left", "%ile L", "Right", "%ile R"]} rows={SUBCORTICAL_VOLUME} />
        </div>

        <div className="scan-section">
          <h4>Cortical thickness</h4>
          <Table head={["Region", "Left", "%ile L", "Right", "%ile R"]} rows={CORTICAL_THICKNESS} />
        </div>

        <div className="scan-section">
          <h4>Cortical surface area</h4>
          <Table head={["Region", "Left", "%ile L", "Right", "%ile R"]} rows={CORTICAL_SURFACE_AREA} />
        </div>

        <div className="scan-section">
          <h4>Discarded as artifacts</h4>
          <Table head={["Region", "%ile L", "%ile R", "Reason"]} rows={DISCARDED_ARTIFACTS} pctlCols={[1, 2]} />
        </div>

        <div className="note-box">
          <strong>Overall pattern:</strong> thick, extreme association cortex (frontal + lateral temporal + inferior parietal) alongside thin primary sensory cortex (occipital). Matches the
          published sensorimotor-to-association cortical axis — a coherent whole-brain pattern, not scattered noise.
          <br />
          <br />
          <strong>Best-replicated (verified 3+ ways):</strong> (1) thalamus — extreme, two normative datasets + a dedicated re-verification tool; (2) left auditory/insular region — found 3
          independent ways; (3) widespread association-cortex thickening across frontal, temporal, and parietal lobes.
        </div>
      </div>
    </div>
  );
}
