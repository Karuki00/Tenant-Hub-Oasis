import { invoke } from "@tauri-apps/api/core";

export type AuthStatus = { setupRequired: boolean };

export const getAuthStatus = () => invoke<AuthStatus>("auth_status");
export const setupAuth = (
  username: string,
  password: string,
  confirmation: string,
) => invoke<string>("setup_auth", { username, password, confirmation });
export const login = (username: string, password: string) =>
  invoke<void>("login", { username, password });
export const resetPassword = (
  masterCode: string,
  password: string,
  confirmation: string,
) => invoke<string>("reset_password", { masterCode, password, confirmation });
