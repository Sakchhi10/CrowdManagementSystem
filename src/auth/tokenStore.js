// Token lives in sessionStorage so it survives a refresh but is gone when the tab closes.
// It is never logged.
const KEY = 'cms.token';

export function getToken() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable: session will not survive a refresh */
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
