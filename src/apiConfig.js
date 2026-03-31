export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // 1. Check for explicit environment variable (best for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}${cleanEndpoint}`;
  }

  // 2. In browser, dynamically use the current IP/Hostname (perfect for local network testing)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000${cleanEndpoint}`;
  }

  // 3. Fallback for SSR/Server-side
  return `http://localhost:5000${cleanEndpoint}`;
};
