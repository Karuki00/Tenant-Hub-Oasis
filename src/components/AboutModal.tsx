import oasisLogo from "../assets/LOGO_OASIS_V2.png";
import { openUrl } from "@tauri-apps/plugin-opener";

const repositoryUrl = "https://github.com/Karuki00/Tenant-Hub-Oasis";

export function AboutModal({ onClose, updateVersion, onInstallUpdate }: {
  onClose: () => void;
  updateVersion?: string;
  onInstallUpdate: () => void;
}) {
  const openRepository = async () => {
    try {
      await openUrl(repositoryUrl);
    } catch {
      window.open(repositoryUrl, "_blank", "noopener,noreferrer");
    }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="detail-modal about-modal" onClick={(event) => event.stopPropagation()}>
        <div className="about-hero">
          <button className="about-close" onClick={onClose} aria-label="Tutup">X</button>
          <img className="about-logo" src={oasisLogo} alt="OASIS Mitra Sarana" />
          <p className="about-brand">OASIS One</p>
          <p className="about-tagline">Platform Tenant Relation Apartemen Mitra Oasis Sarana</p>
          <span className="about-version">v0.3.0</span>
        </div>
        <div className="about-content">
          <div className="about-summary">
            <div><strong>Pengembang:</strong><span>Apartemen Oasis Mitra Sarana</span></div>
            <div><strong>Arsitektur:</strong><span>Local-First Desktop App</span></div>
            <div><strong>Database:</strong><span>SQLite (AppData Managed)</span></div>
          </div>
          <h3 className="about-section-title">Teknologi terpasang</h3>
          <div className="technology-grid">
            <div><strong>Tauri v2</strong><span>Desktop App Framework</span></div>
            <div><strong>Rust & rusqlite</strong><span>Backend Core & Local Database</span></div>
            <div><strong>React & Vite</strong><span>Frontend UI Engine</span></div>
            <div><strong>CSS Theme</strong><span>Styling & UI Components</span></div>
            <div><strong>SQLite</strong><span>Local-First Storage (AppData)</span></div>
          </div>
          <div className="about-footer">
            <p>© 2026 Apartemen Oasis Mitra Sarana. All rights reserved.</p>
            <button className="github-link" type="button" onClick={() => void openRepository()}>Link Repository GitHub</button>
          </div>
        </div>
        {updateVersion && <button className="update-action" onClick={onInstallUpdate}>Pembaruan v{updateVersion} tersedia - instal sekarang</button>}
        <div className="about-actions"><button className="secondary-button" onClick={onClose}>Tutup</button></div>
      </section>
    </div>
  );
}
