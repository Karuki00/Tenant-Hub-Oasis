import { useEffect, useState } from "react";
import type { Tenant } from "./types/tenant";
import "./App.css";
import "./theme.css";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { createTenant, deleteTenant, loadTenants, replaceTenants, setTenantArchived, updateTenant } from "./services/tenantDatabase";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [databaseError, setDatabaseError] = useState("");
  const [view, setView] = useState<"dashboard" | "directory">("dashboard");
  useEffect(() => {
    if (!authenticated) return;
    void loadTenants().then(setTenants).catch((error) => setDatabaseError(error instanceof Error ? error.message : "Unable to open the tenant database."));
  }, [authenticated]);
  if (!authenticated) return <LoginPage onLogin={() => setAuthenticated(true)} />;
  return <><DashboardPage tenants={tenants} view={view} onViewChange={setView} databaseError={databaseError} onImport={(rows) => { setTenants(rows); void replaceTenants(rows); }} onCreate={(tenant) => { setTenants((current) => [...current, tenant]); void createTenant(tenant); }} onUpdate={(tenant) => { setTenants((current) => current.map((item) => item.code === tenant.code ? tenant : item)); void updateTenant(tenant); }} onDelete={(code) => { setTenants((current) => current.filter((item) => item.code !== code)); void deleteTenant(code); }} onArchive={(tenant) => { setTenants((current) => current.map((item) => item.code === tenant.code ? tenant : item)); void setTenantArchived(tenant.code, tenant.archived); }} /></>;
}

export default App;
