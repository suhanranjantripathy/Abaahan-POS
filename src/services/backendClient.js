import { BACKEND_CONFIG } from '../config/appConfig';

export const isRemoteBackendEnabled = () => (
  BACKEND_CONFIG.mode === 'api' && Boolean(BACKEND_CONFIG.apiBaseUrl)
);

export const getBackendMode = () => BACKEND_CONFIG.mode;

export const apiRequest = async (path, options = {}) => {
  if (!isRemoteBackendEnabled()) {
    throw new Error('Remote backend is not configured. Set VITE_DATA_BACKEND=api and VITE_API_BASE_URL.');
  }

  const url = `${BACKEND_CONFIG.apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(BACKEND_CONFIG.apiToken ? { Authorization: `Bearer ${BACKEND_CONFIG.apiToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};
