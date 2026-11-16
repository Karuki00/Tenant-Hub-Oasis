import { useEffect, useState } from "react";
import type { Tenant } from "./types/tenant";
import "./App.css";
import "./theme.css";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { checkForUpdates, installAvailableUpdate } from "./updater";
import {
  createTenant,
  deleteTenant,
  loadTenants,
  replaceTenants,
  updateTenant,
} from "./services/tenantDatabase";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [databaseError, setDatabaseError] = useState("");
  const [view, setView] = useState<"dashboard" | "directory">("dashboard");
  const [updateVersion, setUpdateVersion] = useState<string | undefined>();
  const reportDatabaseError = (error: unknown) => {
    const message =
      typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Operasi database gagal.";
    setDatabaseError(message);
  };
  useEffect(() => {
    const checkUpdate = () => void checkForUpdates(setUpdateVersion);
    checkUpdate();
    const timer = window.setInterval(checkUpdate, 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!authenticated) return;
    void loadTenants()
      .then((rows) => {
        setTenants(rows);
        setDatabaseError("");
      })
      .catch(reportDatabaseError);
  }, [authenticated]);
  if (!authenticated)
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  return (
    <>
      <DashboardPage
        tenants={tenants}
        view={view}
        onViewChange={setView}
        onLogout={() => {
          setAuthenticated(false);
          setTenants([]);
          setView("dashboard");
          setDatabaseError("");
        }}
        databaseError={databaseError}
        onImport={(rows) => {
          void replaceTenants(rows)
            .then(() => {
              setTenants(rows);
              setDatabaseError("");
            })
            .catch(reportDatabaseError);
        }}
        onCreate={(tenant) => {
          void createTenant(tenant)
            .then(() => {
              setTenants((current) => [...current, tenant]);
              setDatabaseError("");
            })
            .catch(reportDatabaseError);
        }}
        onUpdate={(tenant) => {
          void updateTenant(tenant)
            .then(() => {
              setTenants((current) =>
                current.map((item) =>
                  item.code === tenant.code ? tenant : item,
                ),
              );
              setDatabaseError("");
            })
            .catch(reportDatabaseError);
        }}
        onDelete={(code) => {
          void deleteTenant(code)
            .then(() => {
              setTenants((current) =>
                current.filter((item) => item.code !== code),
              );
              setDatabaseError("");
            })
            .catch(reportDatabaseError);
        }}
        updateVersion={updateVersion}
        onInstallUpdate={() => {
          void installAvailableUpdate();
        }}
      />
    </>
  );
}

export default App;
