import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import oasisLogo from "../assets/LOGO_OASIS_V1-removebg-preview.png";
import {
  getAuthStatus,
  login,
  resetPassword,
  setupAuth,
} from "../services/auth";

type LoginMode = "loading" | "setup" | "login" | "recovery" | "code";

function errorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return "Operasi autentikasi gagal.";
}

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<LoginMode>("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [masterCode, setMasterCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getAuthStatus()
      .then((status) => setMode(status.setupRequired ? "setup" : "login"))
      .catch((reason) => {
        setError(errorMessage(reason));
        setMode("login");
      });
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "setup") {
        setRecoveryCode(await setupAuth(username, password, confirmation));
        setMode("code");
      } else if (mode === "recovery") {
        setRecoveryCode(
          await resetPassword(masterCode, password, confirmation),
        );
        setMode("code");
      } else {
        await login(username, password);
        onLogin();
      }
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const heading =
    mode === "setup"
      ? "Buat akses aplikasi"
      : mode === "recovery"
        ? "Reset password"
        : "OASIS Enterprise Hub";
  const subtitle =
    mode === "setup"
      ? "Buat username dan password untuk penggunaan internal."
      : mode === "recovery"
        ? "Gunakan master code untuk membuat password baru."
        : "Masuk dengan kredensial divisi Anda";

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img
          className="login-logo"
          src={oasisLogo}
          alt="Oasis Apartment Mitra Sarana"
        />
        {mode === "code" ? (
          <>
            <h1>Master code Anda</h1>
            <p className="login-subtitle">
              Simpan kode ini di tempat yang aman. Kode ini diperlukan jika
              password terlupa.
            </p>
            <div className="master-code">{recoveryCode}</div>
            <p className="login-warning">
              Kode hanya ditampilkan sekarang dan akan berubah setelah reset
              password berikutnya.
            </p>
            <button
              className="primary-button login-submit"
              type="button"
              onClick={() => {
                setMode("login");
                setPassword("");
                setConfirmation("");
              }}
            >
              Lanjut ke login
            </button>
          </>
        ) : (
          <>
            <h1>{heading}</h1>
            <p className="login-subtitle">{subtitle}</p>
            {mode !== "recovery" && (
              <label>
                Nama pengguna
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Masukkan nama pengguna"
                />
              </label>
            )}
            {mode === "recovery" && (
              <label>
                Master code
                <input
                  value={masterCode}
                  onChange={(event) => setMasterCode(event.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                />
              </label>
            )}
            <label>
              {mode === "recovery"
                ? "Password baru"
                : mode === "setup"
                  ? "Password"
                  : "Kata sandi"}
              <input
                autoComplete={
                  mode === "recovery" || mode === "setup"
                    ? "new-password"
                    : "current-password"
                }
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </label>
            {(mode === "setup" || mode === "recovery") && (
              <label>
                Konfirmasi password
                <input
                  autoComplete="new-password"
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Ulangi password"
                />
              </label>
            )}
            {mode === "login" && (
              <div className="login-options">
                <span />
                <button
                  type="button"
                  onClick={() => {
                    setMode("recovery");
                    setError("");
                  }}
                >
                  Lupa password?
                </button>
              </div>
            )}
            {error && <p className="login-error">{error}</p>}
            <button
              className="primary-button login-submit"
              type="submit"
              disabled={busy || mode === "loading"}
            >
              {busy
                ? "Memproses..."
                : mode === "setup"
                  ? "Buat akses"
                  : mode === "recovery"
                    ? "Reset password"
                    : "Login"}
            </button>
            {mode === "recovery" && (
              <button
                className="secondary-button login-secondary-action"
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Kembali ke login
              </button>
            )}
            {import.meta.env.DEV && mode === "login" && (
              <button className="quick-login" type="button" onClick={onLogin}>
                Masuk cepat untuk pengembangan
              </button>
            )}
          </>
        )}
      </form>
    </main>
  );
}
