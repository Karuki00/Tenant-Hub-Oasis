import { useState } from "react";
import type { FormEvent } from "react";

export function ChangePasswordModal({
  onClose,
  onChangePassword,
}: {
  onClose: () => void;
  onChangePassword: (
    currentPassword: string,
    password: string,
    confirmation: string,
  ) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onChangePassword(currentPassword, password, confirmation);
      onClose();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="detail-modal password-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button type="button" className="close-button" onClick={onClose} aria-label="Tutup">X</button>
        <p className="eyebrow">Keamanan akun</p>
        <h2>Ubah password</h2>
        <p className="muted">Gunakan menu ini saat Anda masih bisa login dan ingin mengganti password secara normal.</p>
        {error && <p className="form-error">{error}</p>}
        <label className="form-field">
          Password saat ini
          <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </label>
        <label className="form-field">
          Password baru
          <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" required />
        </label>
        <label className="form-field">
          Konfirmasi password baru
          <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Ulangi password baru" required />
        </label>
        <div className="import-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Batal</button>
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Menyimpan..." : "Simpan password"}</button>
        </div>
      </form>
    </div>
  );
}

function errorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Password tidak dapat diubah.";
}
