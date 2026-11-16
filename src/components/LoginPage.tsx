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
      setError("Please enter your username and password.");
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
        <p className="login-subtitle">
          Please sign in with your department credentials
        </p>
        <label>
          Username
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username"
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
        </label>
        <div className="login-options">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <div>
            <button type="button">Forgot username?</button>
            <button type="button">Reset password</button>
          </div>
        </div>
        {error && <p className="login-error">{error}</p>}
        <button className="primary-button login-submit" type="submit">
          Log In
        </button>
        {import.meta.env.DEV && (
          <button className="quick-login" type="button" onClick={onLogin}>
            Quick development login
          </button>
        )}
      </form>
    </main>
  );
}
