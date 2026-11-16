import type { ImportPreview } from "../services/excelImport";

export function ImportPreviewModal({
  preview,
  onCancel,
  onConfirm,
}: {
  preview: ImportPreview;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const percentage = preview.totalCells
    ? Math.round((preview.completeCells / preview.totalCells) * 100)
    : 0;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section
        className="import-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Import validation</p>
            <h2>Confirm tenant data</h2>
            <p className="muted">
              {preview.fileName} · {preview.rows.length} rows found
            </p>
          </div>
          <button className="close-button" onClick={onCancel}>
            X
          </button>
        </div>
        <div className="import-summary">
          <div>
            <strong>{percentage}%</strong>
            <small>core fields complete</small>
          </div>
          <div>
            <strong>{preview.rows.length}</strong>
            <small>records to import</small>
          </div>
          <div>
            <strong>{preview.completeCells}</strong>
            <small>of {preview.totalCells} cells filled</small>
          </div>
        </div>
        <div className="import-warning">
          <strong>Missing detail fields</strong>
          <span>
            {Object.entries(preview.missingByField)
              .filter(([, count]) => count > 0)
              .map(([field, count]) => `${field}: ${count}`)
              .join(" · ")}
          </span>
        </div>
        <div className="import-table-wrap">
          <table>
            <thead>
              <tr>
                <th>No. Unit</th>
                <th>Nama</th>
                <th>Luas</th>
                <th>Daya</th>
                <th>No. tlp</th>
                <th>Email</th>
                <th>Emergency</th>
                <th>No Parkir</th>
                <th>Excel summary</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 50).map((row) => (
                <tr key={row.code}>
                  <td>{row.unit || "Missing"}</td>
                  <td>{row.name || "Missing"}</td>
                  <td>{row.area || "Missing"}</td>
                  <td>{row.power || "Missing"}</td>
                  <td>{row.phone || "Missing"}</td>
                  <td>{row.email || "Missing"}</td>
                  <td>{row.emergency || "Missing"}</td>
                  <td>{row.parking || "Missing"}</td>
                  <td>
                    <small>
                      {row.code}
                      <br />
                      {row.tower} · {row.occupancyPeriod}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.rows.length > 50 && (
          <p className="muted import-note">
            Showing the first 50 rows for confirmation. All{" "}
            {preview.rows.length} rows will be imported.
          </p>
        )}
        <div className="import-actions">
          <button className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" onClick={onConfirm}>
            Confirm and import {preview.rows.length} rows
          </button>
        </div>
      </section>
    </div>
  );
}
