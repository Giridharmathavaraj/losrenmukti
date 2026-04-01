export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Optional explicit host (e.g., Docker, custom network)
  if (process.env.NEXT_PUBLIC_API_HOST) {
    return `${process.env.NEXT_PUBLIC_API_HOST}${cleanEndpoint}`;
  }

  // Browser detection – use the current hostname when it is a private IP or localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isPrivate = hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
    if (isPrivate) {
      return `https://${hostname}:5000${cleanEndpoint}`;
    }
  }

  // Fallback – assume localhost
  return `https://localhost:5000${cleanEndpoint}`;
};
