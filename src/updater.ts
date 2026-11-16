import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

let availableUpdate: Update | null = null;

export async function checkForUpdates(onAvailable?: (version: string) => void): Promise<void> {
  try {
    const update = await check();
    if (!update) return;
    availableUpdate = update;
    onAvailable?.(update.version);
  } catch (error) {
    console.info("Pemeriksaan pembaruan dilewati:", error);
  }
}

export async function installAvailableUpdate(): Promise<void> {
  if (!availableUpdate) return;
  await availableUpdate.downloadAndInstall();
  await relaunch();
}
