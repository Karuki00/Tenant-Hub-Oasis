import type { Tenant } from "../types/tenant";

export function TenantDetailModal({
  tenant,
  onClose,
  onEdit,
  onDelete,
  onArchive,
}: {
  tenant: Tenant;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
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
        <p className="eyebrow">Tenant profile</p>
        <h2>{tenant.name}</h2>
        <p className="muted">
          {tenant.code} | {tenant.unit}
        </p>
        <div className="detail-grid">
          <Detail
            label="Location"
            value={`${tenant.tower}, Floor ${tenant.unit.split("/")[1]}`}
          />
          <Detail label="No. Unit" value={tenant.unit} />
          <Detail label="Luas" value={`${tenant.area} m2`} />
          <Detail label="Daya" value={`${tenant.power.toLocaleString()} W`} />
          <Detail label="No. tlp" value={tenant.phone || "Missing"} />
          <Detail label="Email" value={tenant.email || "Missing"} />
          <Detail
            label="No. tlp keadaan darurat"
            value={tenant.emergency || "Missing"}
          />
          <Detail label="No Parkir" value={tenant.parking || "Missing"} />
          <Detail
            label="Periode Huni"
            value={tenant.occupancyPeriod || "Missing"}
          />
          <Detail
            label="Status"
            value={tenant.archived ? "Archived" : tenant.status}
          />
        </div>
        <div className="detail-actions">
          <button className="secondary-button delete-button" onClick={onDelete}>
            Delete
          </button>
          <button className="secondary-button" onClick={onArchive}>
            {tenant.archived ? "Restore" : "Archive"}
          </button>
          <button className="primary-button" onClick={onEdit}>
            Edit tenant
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
