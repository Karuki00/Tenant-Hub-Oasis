import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/** Checks GitHub Releases and installs a signed update when one is available. */
export async function checkForUpdates(): Promise<void> {
  try {
    const update = await check();
    if (!update) return;

    await update.downloadAndInstall();
    await relaunch();
  } catch (error) {
    // Updating must never prevent TenantHub from opening when offline or before
    // the deployment-specific GitHub endpoint/signing key is configured.
    console.info("TenantHub update check skipped:", error);
  }
}
