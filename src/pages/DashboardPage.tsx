import { useEffect, useMemo, useState } from "react";
import type { Tenant } from "../types/tenant";
import { Brand } from "../components/Brand";
import { TenantDetailModal } from "../components/TenantDetailModal";
import { ImportPreviewModal } from "../components/ImportPreviewModal";
import { parseExcelFile, type ImportPreview } from "../services/excelImport";
import { TenantFormModal } from "../components/TenantFormModal";
import { Pagination } from "../components/Pagination";
import { DashboardOverview } from "./DashboardOverview";

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
}) {
  const [query, setQuery] = useState("");
  const [tower, setTower] = useState("All towers");
  const [floor, setFloor] = useState("All floors");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState("");
  const [formTenant, setFormTenant] = useState<Tenant | null | undefined>(
    undefined,
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
        const tenantFloor = `Floor ${tenant.unit.split("/")[1]}`;
        return (
          searchable.includes(query.toLowerCase()) &&
          (tower === "All towers" || tenant.tower === tower) &&
          (floor === "All floors" || tenantFloor === floor)
        );
      }),
    [query, tower, floor, tenants],
  );
  useEffect(() => {
    setPage(1);
  }, [query, tower, floor]);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  if (view === "dashboard")
    return (
      <DashboardOverview
        tenants={tenants}
        databaseError={databaseError}
        onOpenDirectory={() => onViewChange("directory")}
      />
    );
  const missingCount = tenants.filter(
    (tenant) =>
      !tenant.email ||
      !tenant.emergency ||
      !tenant.phone ||
      !tenant.parking ||
      tenant.power <= 0,
  ).length;
  const totalArea = tenants.reduce((sum, tenant) => sum + tenant.area, 0);
  const handleFile = async (file?: File) => {
    if (!file) return;
    setImportError("");
    try {
      setPreview(await parseExcelFile(file));
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unable to read this file.",
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
        throw new Error("This backup does not contain valid tenant records.");
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
          : "Unable to restore this backup.",
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
            Dashboard
          </button>
          <button className="nav-item active">Tenant directory</button>
          <button className="nav-item">Units and floors</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sync-card">
            <span className="online-dot" /> Local data synced
            <small>Last checked just now</small>
          </div>
          <button className="nav-item">Settings</button>
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
            <p className="eyebrow">Monday, 16 November 2026</p>
            <h1>Good morning, Tenant Relation</h1>
            <p className="muted">Here is today's tenant overview.</p>
          </div>
          <div className="top-actions">
            <button className="icon-button" title="Check for updates">
              Refresh
            </button>
            <button
              className="primary-button"
              onClick={() => setFormTenant(null)}
            >
              Add tenant
            </button>
          </div>
        </header>
        {databaseError && (
          <div className="import-error">
            Database unavailable: {databaseError}
          </div>
        )}
        <section className="stats-grid">
          <Stat
            label="Total tenants"
            value={String(tenants.length)}
            change={
              tenants.length ? "Imported records" : "Import an Excel file"
            }
            tone="blue"
          />
          <Stat
            label="Occupied units"
            value={String(
              tenants.filter((tenant) => tenant.status === "Active").length,
            )}
            change={tenants.length ? "Active records" : "Waiting for data"}
            tone="green"
          />
          <Stat
            label="Total area"
            value={`${totalArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} m2`}
            change={tenants.length ? "Imported area" : "No data loaded"}
            tone="orange"
          />
          <Stat
            label="Needs review"
            value={String(missingCount)}
            change="Incomplete detail fields"
            tone="red"
          />
        </section>
        <section className="workspace-card">
          <div className="section-heading">
            <div>
              <h2>Tenant directory</h2>
              <p className="muted">
                Search and filter tenant information by unit, floor, or tower.
              </p>
            </div>
            <div className="directory-actions">
              <label className="secondary-button import-button">
                Import
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
                Backup
              </button>
              <label className="secondary-button import-button">
                Restore
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    void restoreBackup(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button className="secondary-button">Export</button>
            </div>
          </div>
          <div className="filter-row">
            <label className="search-box">
              Search{" "}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, unit, phone, email..."
              />
            </label>
            <select
              value={tower}
              onChange={(event) => setTower(event.target.value)}
            >
              <option>All towers</option>
              <option>Tower A</option>
              <option>Tower B</option>
              <option>Tower C</option>
            </select>
            <select
              value={floor}
              onChange={(event) => setFloor(event.target.value)}
            >
              <option>All floors</option>
              <option>Floor 02</option>
              <option>Floor 05</option>
              <option>Floor 12</option>
            </select>
            <button className="filter-button">Filters</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Tenant</th>
                  <th>Location</th>
                  <th>Area / power</th>
                  <th>Phone</th>
                  <th>Parking</th>
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
                      <small>{tenant.email || "Missing email"}</small>
                    </td>
                    <td>
                      {tenant.tower}
                      <small>Floor {tenant.unit.split("/")[1]}</small>
                    </td>
                    <td>
                      {tenant.area.toFixed(1)} m2
                      <small>{tenant.power.toLocaleString()} W</small>
                    </td>
                    <td>{tenant.phone}</td>
                    <td>{tenant.parking}</td>
                    <td>
                      <span className={`status ${tenant.status.toLowerCase()}`}>
                        {tenant.status}
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
        <section className="bottom-grid">
          <div className="small-card">
            <div className="section-heading">
              <div>
                <h2>Browse by tower</h2>
                <p className="muted">Quick access to units and floors</p>
              </div>
            </div>
            <div className="tower-list">
              <Tower name="Tower A" units="171 units" color="blue" />
              <Tower name="Tower B" units="170 units" color="purple" />
              <Tower name="Tower C" units="170 units" color="orange" />
            </div>
          </div>
          <div className="small-card">
            <div className="section-heading">
              <div>
                <h2>Data quality</h2>
                <p className="muted">Records requiring attention</p>
              </div>
              <span className="warning-count">26</span>
            </div>
            <div className="quality-row">
              <span className="quality-icon red-bg">!</span>
              <div>
                <strong>Missing emergency contacts</strong>
                <small>14 tenant records</small>
              </div>
              <span>View</span>
            </div>
            <div className="quality-row">
              <span className="quality-icon orange-bg">!</span>
              <div>
                <strong>Missing email addresses</strong>
                <small>12 tenant records</small>
              </div>
              <span>View</span>
            </div>
          </div>
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
            if (window.confirm(`Delete ${selected.name}?`)) {
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
    </div>
  );
}

function Stat({
  label,
  value,
  change,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>Info</div>
      <p className="muted">{label}</p>
      <strong>{value}</strong>
      <small className={tone === "red" ? "alert-text" : "positive-text"}>
        {change}
      </small>
    </div>
  );
}
function Tower({
  name,
  units,
  color,
}: {
  name: string;
  units: string;
  color: string;
}) {
  return (
    <div className="tower-item">
      <span className={`tower-icon ${color}`}>Floor</span>
      <div>
        <strong>{name}</strong>
        <small>{units}</small>
      </div>
      <span className="arrow">Open</span>
    </div>
  );
}
