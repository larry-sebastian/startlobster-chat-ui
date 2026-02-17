const STORAGE_KEY = 'startlobster_credentials';

export function getStoredCredentials(): { url: string; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.url && parsed.token) return parsed;
  } catch {
    // Ignore malformed localStorage data
  }
  return null;
}

export function storeCredentials(url: string, token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, token }));
}

export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}
