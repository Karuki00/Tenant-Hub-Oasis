import oasisLogo from "../assets/LOGO_OASIS_V2.png";

export function Brand() {
  return (
    <div className="brand">
      <img
        className="brand-logo"
        src={oasisLogo}
        alt="Oasis Apartment Mitra Sarana"
      />
      <div>
        <strong>TenantHub</strong>
        <small>Tenant Relation</small>
      </div>
    </div>
  );
}
