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
            <p className="eyebrow">Validasi impor</p>
            <h2>Konfirmasi data penyewa</h2>
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
            <small>kolom inti lengkap</small>
          </div>
          <div>
            <strong>{preview.rows.length}</strong>
            <small>data untuk diimpor</small>
          </div>
          <div>
            <strong>{preview.completeCells}</strong>
            <small>dari {preview.totalCells} sel terisi</small>
          </div>
        </div>
        <div className="import-warning">
          <strong>Kolom detail belum diisi</strong>
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
                <th>Kontak darurat</th>
                <th>No Parkir</th>
                <th>Ringkasan Excel</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 50).map((row) => (
                <tr key={row.code}>
                  <td>{row.unit || "Belum diisi"}</td>
                  <td>{row.name || "Belum diisi"}</td>
                  <td>{row.area || "Belum diisi"}</td>
                  <td>{row.power || "Belum diisi"}</td>
                  <td>{row.phone || "Belum diisi"}</td>
                  <td>{row.email || "Belum diisi"}</td>
                  <td>{row.emergency || "Belum diisi"}</td>
                  <td>{row.parking || "Belum diisi"}</td>
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
            Menampilkan 50 baris pertama untuk konfirmasi. Semua{" "}
            {preview.rows.length} baris akan diimpor.
          </p>
        )}
        <div className="import-actions">
          <button className="secondary-button" onClick={onCancel}>
            Batal
          </button>
          <button className="primary-button" onClick={onConfirm}>
            Konfirmasi dan impor {preview.rows.length} baris
          </button>
        </div>
      </section>
    </div>
  );
}
