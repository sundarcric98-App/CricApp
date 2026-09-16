import { User } from '../types/cricket';

const USER_KEY = 'criclivex_auth_user';
const TOKEN_KEY = 'criclivex_auth_token';

// In-memory fallback for non-browser or SSR environments
let memoryStore: Record<string, string> = {};

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function getStoredUser(): User | null {
  try {
    if (isLocalStorageAvailable()) {
      const data = window.localStorage.getItem(USER_KEY);
      if (data) return JSON.parse(data);
    } else if (memoryStore[USER_KEY]) {
      return JSON.parse(memoryStore[USER_KEY]);
    }
  } catch (err) {
    console.warn('Failed to parse stored user session:', err);
  }
  return null;
}

export function getStoredToken(): string | null {
  try {
    if (isLocalStorageAvailable()) {
      return window.localStorage.getItem(TOKEN_KEY);
    } else if (memoryStore[TOKEN_KEY]) {
      return memoryStore[TOKEN_KEY];
    }
  } catch (err) {
    console.warn('Failed to retrieve stored token:', err);
  }
  return null;
}

export function saveSession(user: User, token: string): void {
  try {
    const userJson = JSON.stringify(user);
    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(USER_KEY, userJson);
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    memoryStore[USER_KEY] = userJson;
    memoryStore[TOKEN_KEY] = token;
  } catch (err) {
    console.warn('Failed to persist session to local storage:', err);
  }
}

export function clearSession(): void {
  try {
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(TOKEN_KEY);
    }
    delete memoryStore[USER_KEY];
    delete memoryStore[TOKEN_KEY];
  } catch (err) {
    console.warn('Failed to clear session from local storage:', err);
  }
}
