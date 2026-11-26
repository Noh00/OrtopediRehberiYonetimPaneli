import { auth } from './firebase';

let memorySessionToken: string | null = null;

export function setCustomSessionToken(token: string | null) {
  memorySessionToken = token;
}

export function getCustomSessionToken(): string | null {
  return memorySessionToken;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  let token = memorySessionToken;
  if (!token && auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `İstek başarısız (${res.status})`;
    try {
      const json = await res.json();
      if (json?.error) errMsg = json.error;
    } catch {
      // ignore non-json error body
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as T;
}
