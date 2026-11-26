import { auth } from './firebase';

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

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
