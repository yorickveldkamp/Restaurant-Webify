export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
}

const BASE = "/api/auth";

export async function apiGetMe(): Promise<AuthUser | null> {
  const res = await fetch(`${BASE}/me`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json() as { user: AuthUser | null };
  return data.user;
}

export async function apiLogin(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json() as { user: AuthUser; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Inloggen mislukt");
  return data.user;
}

export async function apiLogout(): Promise<void> {
  await fetch(`${BASE}/logout`, { method: "POST", credentials: "include" });
}

export async function apiSetup(username: string, displayName: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/setup`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, displayName, password }),
  });
  const data = await res.json() as { user: AuthUser; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Setup mislukt");
  return data.user;
}

export async function apiGetUsers(): Promise<AuthUser[]> {
  const res = await fetch(`${BASE}/users`, { credentials: "include" });
  if (!res.ok) return [];
  return res.json() as Promise<AuthUser[]>;
}

export async function apiCreateUser(username: string, displayName: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, displayName, password }),
  });
  const data = await res.json() as { id: string; username: string; displayName: string; isAdmin: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Aanmaken mislukt");
  return data as AuthUser;
}

export async function apiDeleteUser(id: string): Promise<void> {
  const res = await fetch(`${BASE}/users/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    const d = await res.json() as { error?: string };
    throw new Error(d.error ?? "Verwijderen mislukt");
  }
}
