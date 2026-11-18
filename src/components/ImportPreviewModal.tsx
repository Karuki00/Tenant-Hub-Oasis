import { useState } from "react";
import type { ImportMode, ImportPlan, ImportPreview } from "../services/excelImport";

export function ImportPreviewModal({
  preview,
  plan,
  onCancel,
  onConfirm,
}: {
  preview: ImportPreview;
  plan: ImportPlan;
  onCancel: () => void;
  onConfirm: (mode: ImportMode) => void;
}) {
  const [mode, setMode] = useState<ImportMode>("merge");
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const percentage = preview.totalCells
    ? Math.round((preview.completeCells / preview.totalCells) * 100)
    : 0;
  const canConfirm = mode !== "replace" || replaceConfirmed;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section className="import-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Validasi impor</p>
            <h2>Konfirmasi data penyewa</h2>
            <p className="muted">
              {preview.fileName} · {preview.rows.length} baris ditemukan
            </p>
          </div>
          <button className="close-button" onClick={onCancel} aria-label="Tutup">
            X
          </button>
        </div>

        <div className="import-summary import-summary-wide">
          <SummaryValue value={percentage} label="% kolom inti lengkap" />
          <SummaryValue value={plan.counts.new} label="data baru" />
          <SummaryValue value={plan.counts.update} label="data diperbarui" />
          <SummaryValue value={plan.counts.unchanged} label="tidak berubah" />
          <SummaryValue value={plan.counts.duplicate} label="duplikat file" />
          <SummaryValue value={plan.counts.conflict} label="perlu ditinjau" />
        </div>

        <div className="import-warning">
          <strong>Data Excel adalah ringkasan</strong>
          <span>
            Kolom kontak, daya, darurat, dan parkir yang kosong tidak akan
            menghapus data manual yang sudah ada saat menggunakan Gabungkan.
          </span>
        </div>

        <div className="import-mode-panel">
          <strong>Pilih cara impor</strong>
          <label>
            <input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} />
            <span><b>Gabungkan dengan data sekarang</b><small>Tambah data baru dan perbarui kecocokan tanpa menghapus data lain.</small></span>
          </label>
          <label>
            <input type="radio" checked={mode === "add"} onChange={() => setMode("add")} />
            <span><b>Tambahkan data baru saja</b><small>Data yang sudah cocok atau bermasalah tidak diubah.</small></span>
          </label>
          <label className="import-danger-option">
            <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
            <span><b>Ganti seluruh data</b><small>Data SQLite saat ini akan diganti dengan isi file, kecuali baris duplikat persis.</small></span>
          </label>
          {mode === "replace" && (
            <label className="import-confirm-check">
              <input type="checkbox" checked={replaceConfirmed} onChange={(event) => setReplaceConfirmed(event.target.checked)} />
              Saya mengerti bahwa data penyewa yang sekarang akan diganti.
            </label>
          )}
        </div>

        {(plan.counts.duplicate > 0 || plan.counts.conflict > 0 || plan.totalReplacedFields > 0) && (
          <div className="import-warning import-warning-secondary">
            <strong>Perhatian sebelum menyimpan</strong>
            <span>
              {plan.counts.duplicate > 0 && `${plan.counts.duplicate} baris duplikat akan dilewati. `}
              {plan.counts.conflict > 0 && `${plan.counts.conflict} baris konflik perlu diperiksa dan tidak akan digabungkan. `}
              {plan.totalReplacedFields > 0 && `${plan.totalReplacedFields} nilai pada data yang cocok akan diperbarui.`}
            </span>
          </div>
        )}

        <div className="import-table-wrap">
          <table>
            <thead>
              <tr><th>Status</th><th>No. Unit</th><th>Nama</th><th>Kode / kecocokan</th><th>Kolom diganti</th></tr>
            </thead>
            <tbody>
              {plan.classifications.slice(0, 50).map((item, index) => (
                <tr key={`${item.row.code}-${index}`}>
                  <td><span className={`import-status import-status-${item.kind}`}>{statusLabel(item.kind)}</span></td>
                  <td>{item.row.unit || "Belum diisi"}</td>
                  <td>{item.row.name || "Belum diisi"}</td>
                  <td><small>{item.row.code}{item.matchReason ? ` · ${item.matchReason}` : ""}</small></td>
                  <td>{item.replacedFields.length ? item.replacedFields.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {plan.classifications.length > 50 && (
          <p className="muted import-note">Menampilkan 50 baris pertama untuk pemeriksaan. Semua {plan.classifications.length} baris akan dianalisis.</p>
        )}

        <div className="import-actions">
          <button className="secondary-button" onClick={onCancel}>Batal</button>
          <button className="primary-button" disabled={!canConfirm} onClick={() => onConfirm(mode)}>
            {mode === "replace" ? "Ganti dan impor data" : mode === "add" ? "Tambahkan data baru" : "Gabungkan dan impor"}
          </button>
        </div>
      </section>
    </div>
  );
}

function SummaryValue({ value, label }: { value: number; label: string }) {
  return <div><strong>{value}</strong><small>{label}</small></div>;
}

function statusLabel(status: ImportPlan["classifications"][number]["kind"]) {
  return { new: "Baru", update: "Diperbarui", unchanged: "Tetap", duplicate: "Duplikat", conflict: "Konflik" }[status];
}
