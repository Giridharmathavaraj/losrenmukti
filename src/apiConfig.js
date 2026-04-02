export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Automatically prepend /api if the frontend calls a raw endpoint (e.g., /login)
  if (!cleanEndpoint.startsWith('/api')) {
    return `/api${cleanEndpoint}`;
  }

  return cleanEndpoint;
};
