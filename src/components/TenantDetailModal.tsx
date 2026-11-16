import type { Tenant } from "../types/tenant";

export function TenantDetailModal({
  tenant,
  onClose,
  onEdit,
  onDelete,
}: {
  tenant: Tenant;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          X
        </button>
        <p className="eyebrow">Profil penyewa</p>
        <h2>{tenant.name}</h2>
        <p className="muted">
          {tenant.code} | {tenant.unit}
        </p>
        <div className="detail-grid">
          <Detail
            label="Lokasi"
            value={`${tenant.tower}, Floor ${tenant.unit.split("/")[1]}`}
          />
          <Detail label="No. Unit" value={tenant.unit} />
          <Detail label="Luas" value={`${tenant.area} m2`} />
          <Detail label="Daya" value={`${tenant.power.toLocaleString()} W`} />
          <Detail label="No. tlp" value={tenant.phone || "Belum diisi"} />
          <Detail label="Email" value={tenant.email || "Belum diisi"} />
          <Detail
            label="No. tlp keadaan darurat"
            value={tenant.emergency || "Belum diisi"}
          />
          <Detail label="No Parkir" value={tenant.parking || "Belum diisi"} />
          <Detail
            label="Periode Huni"
            value={tenant.occupancyPeriod || "Belum diisi"}
          />
          <Detail
            label="Status"
            value={statusLabel(tenant.status)}
          />
        </div>
        <div className="detail-actions">
          <button className="secondary-button delete-button" onClick={onDelete}>
            Hapus
          </button>
          <button className="primary-button" onClick={onEdit}>
            Edit penyewa
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
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
