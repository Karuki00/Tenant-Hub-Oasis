import { useState } from "react";
import type { FormEvent } from "react";
import oasisLogo from "../assets/LOGO_OASIS_V1-removebg-preview.png";

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Silakan masukkan nama pengguna dan kata sandi.");
      return;
    }
    onLogin();
  };
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img
          className="login-logo"
          src={oasisLogo}
          alt="Oasis Apartment Mitra Sarana"
        />
        <h1>OASIS Enterprise Hub</h1>
        <p className="login-subtitle">Masuk dengan kredensial divisi Anda</p>
        <label>
          Nama pengguna
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Masukkan nama pengguna"
          />
        </label>
        <label>
          Kata sandi
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan kata sandi"
          />
        </label>
        <div className="login-options">
          <label>
            <input type="checkbox" /> Ingat saya
          </label>
          <div>
            <button type="button">Lupa nama pengguna?</button>
            <button type="button">Atur ulang kata sandi</button>
          </div>
        </div>
        {error && <p className="login-error">{error}</p>}
        <button className="primary-button login-submit" type="submit">
          Login
        </button>
        {import.meta.env.DEV && (
          <button className="quick-login" type="button" onClick={onLogin}>
            Masuk cepat untuk pengembangan
          </button>
        )}
      </form>
    </main>
  );
}
