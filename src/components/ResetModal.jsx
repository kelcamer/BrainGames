export default function ResetModal({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <h2 className="display" style={{ fontSize: 20 }}>
          Reset all progress?
        </h2>
        <p style={{ marginTop: 8, fontSize: 13 }}>This clears XP, levels, badges and streak in this browser. It can't be undone.</p>
        <div className="reset-row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn--ghost btn--sm" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--danger btn--sm" onClick={onConfirm}>
            Erase everything
          </button>
        </div>
      </div>
    </div>
  );
}
