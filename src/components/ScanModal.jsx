import {
  RECORD_DATE,
  N_OASIS_SAME,
  N_AOMIC_SAME,
  DEEP_VOLUME,
  CORTICAL_SURFACE_AREA,
  TEMPORAL_LOBE,
  SMALL_STRUCTURES,
  VOLBRAIN_BOTH_REPORTS,
  WITHDRAWN,
} from "../data/scanData.js";

const OASIS = `${N_OASIS_SAME} OASIS · same software`;
const AOMIC = `${N_AOMIC_SAME} AOMIC · same software`;

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
          Age 27 · female · plain size vs healthy women (1 = smaller than almost all, 99 = bigger than almost all) · every "L / R" is left / right · updated {RECORD_DATE}.
          Where the OASIS (1.5T) and AOMIC (3T) groups agree, that is the answer. Trust: ✓ high · ~ uncertain · ⚠ border / label effect · ✗ unreliable.
        </p>

        <div className="scan-section">
          <h4>Whole brain &amp; deep structures (volume)</h4>
          <Table head={["Structure", "483 women", "70 women", "Trust"]} rows={DEEP_VOLUME} pctlCols={[1, 2]} />
        </div>

        <div className="scan-section">
          <h4>Cortex surface area · the two same-software columns are the more exact ones</h4>
          <Table
            head={["Region", "483 women", OASIS, AOMIC, "Trust"]}
            rows={CORTICAL_SURFACE_AREA.map((r) => r.slice(0, 5))}
            pctlCols={[1, 2, 3]}
          />
        </div>

        <div className="scan-section">
          <h4>Temporal lobe</h4>
          <Table head={["Measure", "483 women", OASIS, AOMIC, "Notes"]} rows={TEMPORAL_LOBE} pctlCols={[1, 2, 3]} />
        </div>

        <div className="scan-section">
          <h4>Thalamus sections &amp; small structures</h4>
          <Table head={["Section / area", OASIS, AOMIC, "Notes"]} rows={SMALL_STRUCTURES} pctlCols={[1, 2]} />
        </div>

        <div className="scan-section">
          <h4>volBrain — flagged in both reports</h4>
          <Table head={["Region", "Verdict"]} rows={VOLBRAIN_BOTH_REPORTS} pctlCols={[1]} />
        </div>

        <div className="scan-section">
          <h4>Replaced or withdrawn</h4>
          <Table head={["Old number", "Why"]} rows={WITHDRAWN} pctlCols={[]} />
        </div>

        <div className="note-box">
          <strong>Cortical thickness:</strong> not measurable on this scan type (post-contrast T1 SPACE), so no thickness percentiles are listed.
          <br />
          <br />
          <strong>Main patterns:</strong> (1) deep structures large — thalamus 97–99 in every group, large even for head size (the most solid finding); hypothalamus 90–99;
          (2) cortex region sizes typical overall — fewer extreme regions than the typical woman; (3) large: visual cortex (pericalcarine), left parietal (supramarginal, superior
          parietal), left insula; (4) small in both same-software groups, all mild and mostly left: entorhinal, parahippocampal (area only — its volume is large), lateral
          orbitofrontal, caudal middle frontal (border), plus right pars orbitalis and right temporal front tip.
          <br />
          <br />
          <strong>What would give certainty:</strong> one standard 3D T1 MPRAGE (no dye, ideally 3T, 1 mm) through standard FreeSurfer.
        </div>
      </div>
    </div>
  );
}
