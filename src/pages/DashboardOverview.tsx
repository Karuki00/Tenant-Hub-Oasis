import { useState } from "react";
import type { Tenant } from "../types/tenant";
import { Brand } from "../components/Brand";
import { AboutModal } from "../components/AboutModal";
import { ChangePasswordModal } from "../components/ChangePasswordModal";

export type DirectoryFocus = "all" | "incomplete" | "review" | "vacant" | "expired";

export function DashboardOverview({
  tenants,
  onOpenDirectory,
  databaseError,
  updateVersion,
  onInstallUpdate,
  onLogout,
  onLock,
  onOpenSettings,
  passwordModalOpen,
  onCloseSettings,
  onChangePassword,
}: {
  tenants: Tenant[];
  onOpenDirectory: (focus?: DirectoryFocus) => void;
  databaseError?: string;
  updateVersion?: string;
  onInstallUpdate: () => void;
  onLogout: () => void;
  onLock: () => void;
  onOpenSettings: () => void;
  passwordModalOpen: boolean;
  onCloseSettings: () => void;
  onChangePassword: (currentPassword: string, password: string, confirmation: string) => Promise<void>;
}) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const currentTenants = tenants.filter((tenant) => !tenant.archived);
  const active = currentTenants.filter((tenant) => tenant.status === "Active").length;
  const incomplete = currentTenants.filter(
    (tenant) =>
      !tenant.email ||
      !tenant.phone ||
      !tenant.emergency ||
      !tenant.parking ||
      tenant.power <= 0,
  ).length;
  const area = currentTenants.reduce((sum, tenant) => sum + tenant.area, 0);
  const completeness = currentTenants.length
    ? Math.round(((currentTenants.length - incomplete) / currentTenants.length) * 100)
    : 0;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          <button className="nav-item active">Dasbor</button>
          <button className="nav-item" onClick={() => onOpenDirectory()}>
            Direktori penyewa
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sync-card">
            <span className="online-dot" /> SQLite database
            <small>{currentTenants.length} data aktif dimuat</small>
          </div>
          <button className="nav-item" onClick={onOpenSettings}>Pengaturan</button>
          <button className="nav-item lock-button" onClick={onLock}>Kunci aplikasi</button>
          <button className="nav-item logout-button" onClick={onLogout}>Keluar</button>
          <div className="user-card">
            <span className="avatar">TR</span>
            <div>
              <strong>Tenant Relation</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ruang kerja Tenant Relation</p>
            <h1>Dashboard</h1>
            <p className="muted">
              Akses cepat dan kondisi data secara ringkas.
            </p>
          </div>
          <button
            className={`version-button ${updateVersion ? "update-available" : ""}`}
            onClick={() => setAboutOpen(true)}
          >
            v0.3.0{updateVersion ? ` · v${updateVersion} tersedia` : ""}
          </button>
        </header>
        {databaseError && (
          <div className="import-error">
            Database tidak tersedia: {databaseError}
          </div>
        )}
        <section className="stats-grid">
          <OverviewStat
            label="Data penyewa"
            value={String(currentTenants.length)}
            detail="Tersimpan di SQLite"
            tone="blue"
          />
          <OverviewStat
            label="Data aktif"
            value={String(active)}
            detail="Status penyewa saat ini"
            tone="green"
          />
          <OverviewStat
            label="Total luas"
            value={`${area.toLocaleString(undefined, { maximumFractionDigits: 1 })} m2`}
            detail="Luas unit yang diimpor"
            tone="orange"
          />
          <OverviewStat
            label="Kelengkapan data"
            value={`${completeness}%`}
            detail={`${incomplete} data perlu ditinjau`}
            tone="red"
          />
        </section>
        <section className="dashboard-quick-grid">
          <div className="workspace-card quick-access-card">
            <div className="section-heading">
              <div>
                <h2>Akses cepat</h2>
                <p className="muted">
                  Buka alur kerja Tenant Relation yang paling sering digunakan.
                </p>
              </div>
            </div>
            <button className="quick-access-button" onClick={() => onOpenDirectory()}>
              <strong>Direktori Penyewa</strong>
              <span>Cari, filter, impor, dan kelola data penyewa</span>
              <b>Buka</b>
            </button>
          </div>
          <div className="workspace-card completeness-card">
            <div className="section-heading">
              <div>
                <h2>Kelengkapan data</h2>
                <p className="muted">Kolom detail penyewa yang wajib diisi</p>
              </div>
              <strong className="percentage-value">{completeness}%</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-value"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <div className="quality-row">
              <span className="quality-icon orange-bg">!</span>
              <div>
              <strong>{incomplete} data perlu ditinjau</strong>
                <small>
                  No. telepon, email, kontak darurat, parkir, atau daya belum
                  lengkap
                </small>
              </div>
            </div>
            <button className="secondary-button" onClick={() => onOpenDirectory("incomplete")}>
              Tinjau data
            </button>
          </div>
        </section>
      </main>
      {aboutOpen && (
        <AboutModal
          updateVersion={updateVersion}
          onClose={() => setAboutOpen(false)}
          onInstallUpdate={onInstallUpdate}
        />
      )}
      {passwordModalOpen && (
        <ChangePasswordModal
          onClose={onCloseSettings}
          onChangePassword={onChangePassword}
        />
      )}
    </div>
  );
}

function OverviewStat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>Info</div>
      <p className="muted">{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
