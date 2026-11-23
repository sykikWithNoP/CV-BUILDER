import axios from 'axios';

/**
 * Single axios instance for the whole app.
 *
 * It takes care of three things every call used to get wrong:
 *  - credentials (cookies) are always sent;
 *  - state-changing requests carry the double-submit CSRF header the server
 *    requires, fetching a token on demand;
 *  - an expired 15-minute access token is refreshed once and the request retried,
 *    instead of dropping the user out mid-edit.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const SAFE_METHODS = ['get', 'head', 'options'];

// Requests that must never trigger a refresh-and-retry loop.
const NO_REFRESH = ['/auth/refresh', '/auth/login', '/auth/signup'];

function readCookie(name) {
  const prefix = `${name}=`;
  const hit = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
}

let csrfRequest = null;

/** Returns the CSRF token, asking the server for one only when we have none. */
async function ensureCsrfToken(forceRefresh = false) {
  if (!forceRefresh) {
    const existing = readCookie('csrf_token');
    if (existing) return existing;
  }
  if (!csrfRequest) {
    csrfRequest = axios
      .get('/api/auth/csrf-token', { withCredentials: true })
      .then((res) => res.data.csrfToken)
      .finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
}

let refreshRequest = null;

/**
 * Refreshes the access token, coalescing parallel 401s into one call.
 * Sent outside the instance (so it can't recurse through the interceptors), which
 * means the CSRF header has to be attached by hand — /auth/refresh is a POST and
 * the server checks it like any other write.
 */
function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = ensureCsrfToken()
      .then((token) =>
        axios.post('/api/auth/refresh', {}, {
          withCredentials: true,
          headers: { 'X-CSRF-Token': token },
        })
      )
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!SAFE_METHODS.includes(method)) {
    try {
      config.headers['X-CSRF-Token'] = await ensureCsrfToken();
    } catch {
      // Let the request through — the server will answer with a clear 403.
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response || !config || config._retried) throw error;

    const url = config.url || '';
    const skipRefresh = NO_REFRESH.some((path) => url.startsWith(path));

    // Access token expired — refresh once, then replay the original request.
    if (response.status === 401 && !skipRefresh) {
      try {
        await refreshSession();
        config._retried = true;
        return api(config);
      } catch {
        throw error;
      }
    }

    // Stale or missing CSRF cookie — fetch a fresh token and replay once.
    if (response.status === 403 && !SAFE_METHODS.includes((config.method || 'get').toLowerCase())) {
      try {
        const token = await ensureCsrfToken(true);
        config._retried = true;
        config.headers = { ...config.headers, 'X-CSRF-Token': token };
        return api(config);
      } catch {
        throw error;
      }
    }

    throw error;
  }
);

/** Human-readable message from an axios error, whatever shape the server sent. */
export function errorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (typeof data === 'string' && data) return data;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors[0].msg || data.errors[0].message || fallback;
  }
  return err?.message || fallback;
}

export default api;
