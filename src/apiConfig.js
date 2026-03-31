const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  return `${API_BASE_URL}${cleanEndpoint}`;
};
