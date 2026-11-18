import { useEffect, useState } from "react";
import type { Tenant } from "./types/tenant";
import "./App.css";
import "./theme.css";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { applyImportPlan, type ImportMode, type ImportPlan } from "./services/excelImport";
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
  const [locked, setLocked] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [databaseError, setDatabaseError] = useState("");
  const [view, setView] = useState<"dashboard" | "directory">("dashboard");
  const [updateVersion, setUpdateVersion] = useState<string | undefined>();
  const reportDatabaseError = (error: unknown) => {
    const rawMessage =
      typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Operasi database gagal.";
    const message = rawMessage.includes("UNIQUE constraint")
      ? "Data dengan kode penyewa tersebut sudah ada."
      : rawMessage.includes("database is locked")
        ? "Database sedang digunakan. Tunggu sebentar lalu coba lagi."
        : rawMessage.includes("disk I/O")
          ? "Database tidak dapat mengakses penyimpanan aplikasi."
          : rawMessage.includes("no such table")
            ? "Struktur database belum siap. Tutup dan buka kembali aplikasi."
            : rawMessage;
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
    return <LoginPage locked={locked} onLogin={() => {
      setAuthenticated(true);
      setLocked(false);
    }} />;
  return (
    <>
      <DashboardPage
        tenants={tenants}
        view={view}
        onViewChange={setView}
        onLogout={() => {
          setAuthenticated(false);
          setLocked(false);
          setTenants([]);
          setView("dashboard");
          setDatabaseError("");
        }}
        onLock={() => {
          setAuthenticated(false);
          setLocked(true);
          setTenants([]);
          setView("dashboard");
          setDatabaseError("");
        }}
        databaseError={databaseError}
        onImport={async (plan: ImportPlan, mode: ImportMode) => {
          const rows = applyImportPlan(plan, tenants, mode);
          try {
            await replaceTenants(rows);
            setTenants(rows);
            setDatabaseError("");
          } catch (error) {
            reportDatabaseError(error);
            throw error;
          }
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
