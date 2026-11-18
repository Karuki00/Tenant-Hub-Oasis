import { useEffect, useMemo, useState } from "react";
import type { Tenant, TenantRecordType } from "../types/tenant";
import { Brand } from "../components/Brand";
import { TenantDetailModal } from "../components/TenantDetailModal";
import { ImportPreviewModal } from "../components/ImportPreviewModal";
import {
  buildImportPlan,
  type ImportMode,
  type ImportPlan,
  parseExcelFile,
  type ImportPreview,
} from "../services/excelImport";
import { TenantFormModal } from "../components/TenantFormModal";
import { Pagination } from "../components/Pagination";
import { DashboardOverview, type DirectoryFocus } from "./DashboardOverview";
import { AboutModal } from "../components/AboutModal";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { changePassword } from "../services/auth";
import { exportTenantsXlsx } from "../services/tenantDatabase";

export function DashboardPage({
  tenants,
  view,
  onViewChange,
  databaseError,
  onImport,
  onCreate,
  onUpdate,
  onDelete,
  onLogout,
  onLock,
  updateVersion,
  onInstallUpdate,
}: {
  tenants: Tenant[];
  view: "dashboard" | "directory";
  onViewChange: (view: "dashboard" | "directory") => void;
  databaseError?: string;
  onImport: (plan: ImportPlan, mode: ImportMode) => Promise<void>;
  onCreate: (tenant: Tenant) => void;
  onUpdate: (tenant: Tenant) => void;
  onDelete: (code: string) => void;
  onLogout: () => void;
  onLock: () => void;
  updateVersion?: string;
  onInstallUpdate: () => void;
}) {
  type SortKey = "unit" | "name" | "tower" | "status" | "completeness";
  const [query, setQuery] = useState("");
  const [tower, setTower] = useState("All towers");
  const [floor, setFloor] = useState("All floors");
  const [status, setStatus] = useState("All statuses");
  const [recordType, setRecordType] = useState("All types");
  const [quickFilter, setQuickFilter] = useState<DirectoryFocus>("all");
  const [sortBy, setSortBy] = useState<SortKey>("unit");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [formTenant, setFormTenant] = useState<Tenant | null | undefined>(
    undefined,
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(() => new Date());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const floorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tenants
            .map((tenant) => floorLabel(tenant.unit))
            .filter((value) => value !== "Lantai tidak diketahui"),
        ),
      ).sort(),
    [tenants],
  );
  const filtered = useMemo(
    () =>
      tenants.filter((tenant) => {
        if (tenant.archived) return false;
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
        const incomplete =
          !tenant.email ||
          !tenant.phone ||
          !tenant.emergency ||
          !tenant.parking ||
          tenant.power <= 0;
        const matchesQuickFilter =
          quickFilter === "all" ||
          (quickFilter === "incomplete" && incomplete) ||
          (quickFilter === "review" && tenant.status === "Review") ||
          (quickFilter === "vacant" && tenant.status === "Vacant") ||
          (quickFilter === "expired" && tenant.status === "Expired");
        return (
          searchable.includes(query.toLowerCase()) &&
          (tower === "All towers" || tenantTower === tower) &&
          (floor === "All floors" || tenantFloor === floor) &&
          (status === "All statuses" || tenant.status === status) &&
          (recordType === "All types" || tenant.recordType === recordType) &&
          matchesQuickFilter
        );
      }),
    [query, tower, floor, status, recordType, quickFilter, tenants],
  );
  useEffect(() => {
    setPage(1);
  }, [query, tower, floor, status, quickFilter, sortBy]);
  useEffect(() => {
    setLastLoadedAt(new Date());
  }, [tenants]);
  const sorted = useMemo(() => {
    const statusOrder: Record<Tenant["status"], number> = {
      Active: 1,
      Review: 2,
      Pending: 3,
      Vacant: 4,
      Expired: 5,
      Suspended: 6,
    };
    const completenessScore = (tenant: Tenant) =>
      [tenant.phone, tenant.email, tenant.emergency, tenant.parking].filter(Boolean).length +
      (tenant.power > 0 ? 1 : 0);
    return [...filtered].sort((left, right) => {
      if (sortBy === "completeness") return completenessScore(left) - completenessScore(right);
      if (sortBy === "status") return statusOrder[left.status] - statusOrder[right.status];
      const leftValue = sortBy === "unit" ? left.unit : sortBy === "name" ? left.name : towerLabel(left);
      const rightValue = sortBy === "unit" ? right.unit : sortBy === "name" ? right.name : towerLabel(right);
      return leftValue.localeCompare(rightValue, "id", { numeric: true, sensitivity: "base" });
    });
  }, [filtered, sortBy]);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
  if (view === "dashboard")
    return (
      <DashboardOverview
        tenants={tenants}
        databaseError={databaseError}
        updateVersion={updateVersion}
        onInstallUpdate={onInstallUpdate}
        onLogout={onLogout}
        onLock={onLock}
        onOpenSettings={() => setPasswordModalOpen(true)}
        passwordModalOpen={passwordModalOpen}
        onCloseSettings={() => setPasswordModalOpen(false)}
        onChangePassword={(currentPassword, password, confirmation) =>
          changePassword(currentPassword, password, confirmation)
        }
        onOpenDirectory={(focus) => {
          setQuery("");
          setTower("All towers");
          setFloor("All floors");
          setStatus("All statuses");
          setRecordType("All types");
          setQuickFilter(focus ?? "all");
          onViewChange("directory");
        }}
      />
    );
  const handleFile = async (file?: File) => {
    if (!file) return;
    setImportError("");
    setImportSuccess("");
    try {
      setPreview(await parseExcelFile(file));
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "File tidak dapat dibaca.",
      );
    }
  };
  const exportExcel = () => {
    void exportTenantsXlsx()
      .then((path) => setExportMessage(`Ekspor Excel tersimpan di ${path}`))
      .catch((error) =>
        setImportError(error instanceof Error ? error.message : String(error)),
      );
  };
  const resetFilters = () => {
    setQuery("");
    setTower("All towers");
    setFloor("All floors");
    setStatus("All statuses");
    setRecordType("All types");
    setQuickFilter("all");
    setSortBy("unit");
  };
  const activeFilterCount = [
    tower !== "All towers",
    floor !== "All floors",
    status !== "All statuses",
    recordType !== "All types",
    quickFilter !== "all",
  ].filter(Boolean).length;

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
            <small>Terakhir dimuat {formatTime(lastLoadedAt)}</small>
          </div>
          <button className="nav-item" onClick={() => setPasswordModalOpen(true)}>Pengaturan</button>
          <button className="nav-item lock-button" onClick={onLock}>Kunci aplikasi</button>
          <button className="nav-item logout-button" onClick={onLogout}>
            Keluar
          </button>
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
            <p className="muted">
              Kelola data penyewa, impor Excel, dan lakukan CRUD.
            </p>
          </div>
          <div className="top-actions">
            <button
              className={`version-button ${updateVersion ? "update-available" : ""}`}
              onClick={() => setAboutOpen(true)}
            >
              v0.3.0{updateVersion ? ` · v${updateVersion} tersedia` : ""}
            </button>
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
        {exportMessage && <div className="export-success">{exportMessage}</div>}
        {importSuccess && <div className="export-success">{importSuccess}</div>}
        <section className="workspace-card">
          <div className="section-heading">
            <div>
              <h2>Direktori penyewa</h2>
              <p className="muted">
                Cari dan filter data penyewa berdasarkan unit, lantai, atau
                tower.
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
              <button className="secondary-button" onClick={exportExcel}>
                Ekspor Excel
              </button>
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
            <button className={`filter-toggle ${filtersOpen ? "is-open" : ""}`} onClick={() => setFiltersOpen((open) => !open)}>
              Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
          {filtersOpen && (
            <div className="filter-panel">
              <div className="filter-panel-grid">
                <select value={tower} onChange={(event) => setTower(event.target.value)}>
                  <option value="All towers">Semua tower</option>
                  <option>Tower A</option>
                  <option>Tower B</option>
                  <option>Tower C</option>
                </select>
                <select value={floor} onChange={(event) => setFloor(event.target.value)}>
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
                <select value={recordType} onChange={(event) => setRecordType(event.target.value)}>
                  <option value="All types">Semua jenis data</option>
                  <option value="Tenant">Penyewa</option>
                  <option value="Vendor">Vendor / Provider</option>
                  <option value="Contractor">Kontraktor</option>
                  <option value="Operations">Kantor operasional</option>
                  <option value="Facility">Fasilitas / perangkat</option>
                  <option value="Management">Pengelola</option>
                  <option value="Other">Lainnya</option>
                </select>
                <select value={quickFilter} onChange={(event) => setQuickFilter(event.target.value as DirectoryFocus)}>
                  <option value="all">Semua fokus</option>
                  <option value="incomplete">Data belum lengkap</option>
                  <option value="review">Perlu ditinjau</option>
                  <option value="vacant">Unit kosong</option>
                  <option value="expired">Huni kedaluwarsa</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
                  <option value="unit">Urutkan: unit</option>
                  <option value="name">Urutkan: nama</option>
                  <option value="tower">Urutkan: tower</option>
                  <option value="status">Urutkan: status</option>
                  <option value="completeness">Urutkan: kelengkapan</option>
                </select>
              </div>
              <div className="filter-panel-footer">
                <span>{activeFilterCount ? `${activeFilterCount} filter aktif` : "Tidak ada filter aktif"}</span>
                <button className="text-button" onClick={resetFilters}>Reset filter</button>
              </div>
            </div>
          )}
          <div className="directory-meta">
            <span>Menampilkan {sorted.length} dari {tenants.filter((tenant) => !tenant.archived).length} data aktif</span>
            {(query || tower !== "All towers" || floor !== "All floors" || status !== "All statuses" || recordType !== "All types" || quickFilter !== "all") && (
              <button className="text-button" onClick={resetFilters}>Reset filter</button>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Penyewa</th>
                  <th>Lokasi</th>
                  <th>Jenis data</th>
                  <th>Luas / daya</th>
                  <th>No. telepon</th>
                  <th>No. parkir</th>
                  <th>Status</th>
                  <th>Aksi</th>
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
                    <td>{recordTypeLabel(tenant.recordType)}</td>
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
                    <td>
                      <button className="table-action" onClick={(event) => {
                        event.stopPropagation();
                        setFormTenant(tenant);
                      }}>Edit</button>
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
            total={sorted.length}
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
        />
      )}
      {preview && (
        <ImportPreviewModal
          preview={preview}
          plan={buildImportPlan(preview.rows, tenants)}
          onCancel={() => setPreview(null)}
          onConfirm={async (mode) => {
            const plan = buildImportPlan(preview.rows, tenants);
            try {
              await onImport(plan, mode);
              setImportSuccess(
                `Impor selesai: ${plan.counts.new} baru, ${plan.counts.update} diperbarui, ${plan.counts.duplicate} duplikat dilewati.`,
              );
              setPreview(null);
            } catch (error) {
              setImportError(error instanceof Error ? error.message : String(error));
            }
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
      {aboutOpen && (
        <AboutModal
          updateVersion={updateVersion}
          onClose={() => setAboutOpen(false)}
          onInstallUpdate={onInstallUpdate}
        />
      )}
      {passwordModalOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordModalOpen(false)}
          onChangePassword={(currentPassword, password, confirmation) =>
            changePassword(currentPassword, password, confirmation)
          }
        />
      )}
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

function statusLabel(status: Tenant["status"]) {
  return {
    Active: "Aktif",
    Review: "Perlu ditinjau",
    Pending: "Menunggu",
    Vacant: "Kosong",
    Expired: "Kedaluwarsa",
    Suspended: "Ditangguhkan",
  }[status];
}

function recordTypeLabel(type: TenantRecordType) {
  return {
    Tenant: "Penyewa",
    Vendor: "Vendor / Provider",
    Contractor: "Kontraktor",
    Operations: "Kantor operasional",
    Facility: "Fasilitas / perangkat",
    Management: "Pengelola",
    Other: "Lainnya",
  }[type];
}

function formatTime(value: Date) {
  return value.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
