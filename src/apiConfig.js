export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // 1. Check for explicit environment variable (best for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}${cleanEndpoint}`;
  }

  // 2. Browser logic
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Use port 5000 ONLY on localhost or local network IPs (e.g., 192.168.x.x)
    const isLocal = hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^10\./.test(hostname);

    if (isLocal) {
      return `http://${hostname}:5000${cleanEndpoint}`;
    }

    // 3. Production/Network: Use a simple relative path. 
    // Our 'rewrites' in catalyst.json will route /api/** to the backend function.
    const finalPath = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
    return finalPath;
  }

  // 4. Fallback for SSR/Server-side
  return `http://localhost:5000${cleanEndpoint}`;
};
