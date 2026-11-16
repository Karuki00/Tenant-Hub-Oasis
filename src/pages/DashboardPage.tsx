import { useEffect, useMemo, useState } from "react";
import type { Tenant } from "../types/tenant";
import { Brand } from "../components/Brand";
import { TenantDetailModal } from "../components/TenantDetailModal";
import { ImportPreviewModal } from "../components/ImportPreviewModal";
import { parseExcelFile, type ImportPreview } from "../services/excelImport";
import { TenantFormModal } from "../components/TenantFormModal";
import { Pagination } from "../components/Pagination";
import { DashboardOverview } from "./DashboardOverview";
import { AboutModal } from "../components/AboutModal";

export function DashboardPage({
  tenants,
  view,
  onViewChange,
  databaseError,
  onImport,
  onCreate,
  onUpdate,
  onDelete,
  onArchive,
  onLogout,
  updateVersion,
  onInstallUpdate,
}: {
  tenants: Tenant[];
  view: "dashboard" | "directory";
  onViewChange: (view: "dashboard" | "directory") => void;
  databaseError?: string;
  onImport: (rows: Tenant[]) => void;
  onCreate: (tenant: Tenant) => void;
  onUpdate: (tenant: Tenant) => void;
  onDelete: (code: string) => void;
  onArchive: (tenant: Tenant) => void;
  onLogout: () => void;
  updateVersion?: string;
  onInstallUpdate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tower, setTower] = useState("All towers");
  const [floor, setFloor] = useState("All floors");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState("");
  const [formTenant, setFormTenant] = useState<Tenant | null | undefined>(
    undefined,
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const floorOptions = useMemo(
    () => Array.from(new Set(tenants.map((tenant) => floorLabel(tenant.unit)).filter((value) => value !== "Lantai tidak diketahui"))).sort(),
    [tenants],
  );
  const filtered = useMemo(
    () =>
      tenants.filter((tenant) => {
        const searchable = [
          tenant.name,
          tenant.code,
          tenant.unit,
          tenant.phone,
          tenant.email,
          tenant.parking,
        ]
          .join(" ")
          .toLowerCase();
        const tenantTower = towerLabel(tenant);
        const tenantFloor = floorLabel(tenant.unit);
        return (
          searchable.includes(query.toLowerCase()) &&
          (tower === "All towers" || tenantTower === tower) &&
          (floor === "All floors" || tenantFloor === floor) &&
          (status === "All statuses" || tenant.status === status)
        );
      }),
    [query, tower, floor, status, tenants],
  );
  useEffect(() => {
    setPage(1);
  }, [query, tower, floor, status]);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  if (view === "dashboard")
    return (
      <DashboardOverview
        tenants={tenants}
        databaseError={databaseError}
        updateVersion={updateVersion}
        onInstallUpdate={onInstallUpdate}
        onLogout={onLogout}
        onOpenDirectory={() => onViewChange("directory")}
      />
    );
  const handleFile = async (file?: File) => {
    if (!file) return;
    setImportError("");
    try {
      setPreview(await parseExcelFile(file));
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "File tidak dapat dibaca.",
      );
    }
  };
  const downloadBackup = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { schemaVersion: 1, exportedAt: new Date().toISOString(), tenants },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tenant-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const restoreBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const rows = Array.isArray(parsed) ? parsed : parsed.tenants;
      if (
        !Array.isArray(rows) ||
        !rows.every((row) => row.code && row.unit && row.name)
      )
        throw new Error("Cadangan ini tidak berisi data penyewa yang valid.");
      if (
        window.confirm(
          `Restore ${rows.length} tenant records and replace the current database?`,
        )
      )
        onImport(rows as Tenant[]);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Cadangan tidak dapat dipulihkan.",
      );
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          <button
            className="nav-item"
            onClick={() => onViewChange("dashboard")}
          >
            Dasbor
          </button>
          <button className="nav-item active">Direktori penyewa</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sync-card">
            <span className="online-dot" /> Database SQLite tersinkron
            <small>Terakhir diperiksa baru saja</small>
          </div>
          <button className="nav-item">Pengaturan</button>
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
            <p className="eyebrow">Tenant Relation</p>
            <h1>Direktori Penyewa</h1>
            <p className="muted">Kelola data penyewa, impor Excel, dan lakukan CRUD.</p>
          </div>
          <div className="top-actions">
            <button className={`version-button ${updateVersion ? "update-available" : ""}`} onClick={() => setAboutOpen(true)}>v0.1.0{updateVersion ? ` · v${updateVersion} tersedia` : ""}</button>
            <button
              className="primary-button"
              onClick={() => setFormTenant(null)}
            >
              Tambah penyewa
            </button>
          </div>
        </header>
        {databaseError && (
          <div className="import-error">
            Database tidak tersedia: {databaseError}
          </div>
        )}
        <section className="workspace-card">
          <div className="section-heading">
            <div>
              <h2>Direktori penyewa</h2>
              <p className="muted">
                Cari dan filter data penyewa berdasarkan unit, lantai, atau tower.
              </p>
            </div>
            <div className="directory-actions">
              <label className="secondary-button import-button">
                Impor
                <input
                  type="file"
                  accept=".xls,.html,.csv,text/html,text/csv"
                  onChange={(event) => {
                    void handleFile(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button className="secondary-button" onClick={downloadBackup}>
                Cadangkan
              </button>
              <label className="secondary-button import-button">
                Pulihkan
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    void restoreBackup(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button className="secondary-button">Ekspor</button>
            </div>
          </div>
          <div className="filter-row">
            <label className="search-box">
              Cari{" "}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, unit, telepon, email..."
              />
            </label>
            <select
              value={tower}
              onChange={(event) => setTower(event.target.value)}
            >
              <option value="All towers">Semua tower</option>
              <option>Tower A</option>
              <option>Tower B</option>
              <option>Tower C</option>
            </select>
            <select
              value={floor}
              onChange={(event) => setFloor(event.target.value)}
            >
              <option value="All floors">Semua lantai</option>
              {floorOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="All statuses">Semua status</option>
              <option value="Active">Aktif</option>
              <option value="Review">Perlu ditinjau</option>
              <option value="Pending">Menunggu</option>
              <option value="Vacant">Kosong</option>
              <option value="Expired">Kedaluwarsa</option>
              <option value="Suspended">Ditangguhkan</option>
            </select>
            <button className="filter-button">Filter</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Penyewa</th>
                  <th>Lokasi</th>
                  <th>Luas / daya</th>
                  <th>No. telepon</th>
                  <th>No. parkir</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((tenant) => (
                  <tr key={tenant.code} onClick={() => setSelected(tenant)}>
                    <td>
                      <strong>{tenant.unit}</strong>
                      <small>{tenant.code}</small>
                    </td>
                    <td>
                      <strong>{tenant.name}</strong>
                      <small>{tenant.email || "Email belum diisi"}</small>
                    </td>
                    <td>
                      {tenant.tower}
                      <small>{floorLabel(tenant.unit)}</small>
                    </td>
                    <td>
                      {tenant.area.toFixed(1)} m2
                      <small>{tenant.power.toLocaleString()} W</small>
                    </td>
                    <td>{tenant.phone}</td>
                    <td>{tenant.parking}</td>
                    <td>
                      <span className={`status ${tenant.status.toLowerCase()}`}>
                        {statusLabel(tenant.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">No tenants match your search.</div>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </section>
      </main>
      {importError && <div className="import-error">{importError}</div>}
      {selected && (
        <TenantDetailModal
          tenant={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setFormTenant(selected);
            setSelected(null);
          }}
          onDelete={() => {
            if (window.confirm(`Hapus data ${selected.name}?`)) {
              onDelete(selected.code);
              setSelected(null);
            }
          }}
          onArchive={() => {
            onArchive({ ...selected, archived: !selected.archived });
            setSelected(null);
          }}
        />
      )}
      {preview && (
        <ImportPreviewModal
          preview={preview}
          onCancel={() => setPreview(null)}
          onConfirm={() => {
            onImport(preview.rows);
            setPreview(null);
          }}
        />
      )}
      {formTenant !== undefined && (
        <TenantFormModal
          tenant={formTenant}
          existingTenants={tenants}
          onClose={() => setFormTenant(undefined)}
          onSave={(tenant) => {
            if (formTenant) onUpdate(tenant);
            else onCreate(tenant);
            setFormTenant(undefined);
          }}
        />
      )}
      {aboutOpen && <AboutModal updateVersion={updateVersion} onClose={() => setAboutOpen(false)} onInstallUpdate={onInstallUpdate} />}
    </div>
  );
}

function towerLabel(tenant: Tenant) {
  const unitTower = tenant.unit.split("/")[0]?.trim().toUpperCase();
  if (["A", "B", "C"].includes(unitTower)) return `Tower ${unitTower}`;
  const source = tenant.tower.trim().toUpperCase();
  const match = source.match(/(?:TOWER\s*)?([ABC])\b/);
  return match ? `Tower ${match[1]}` : "Lainnya";
}

function floorLabel(unit: string) {
  const floor = unit.split("/")[1]?.trim();
  return floor ? `Floor ${floor.toUpperCase()}` : "Lantai tidak diketahui";
}

function statusLabel(status: Tenant["status"]) { return ({ Active: "Aktif", Review: "Perlu ditinjau", Pending: "Menunggu", Vacant: "Kosong", Expired: "Kedaluwarsa", Suspended: "Ditangguhkan" })[status]; }
