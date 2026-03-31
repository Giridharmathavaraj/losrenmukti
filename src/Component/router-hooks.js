'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  
  return (path, options) => {
    if (typeof path === 'number') {
      if (path === -1) {
        router.back();
      }
      return;
    }
    
    if (options?.state) {
      // Store state in sessionStorage to emulate react-router's location.state
      try {
        sessionStorage.setItem('routeState', JSON.stringify(options.state));
      } catch (e) {
        console.error("Failed to stringify state", e);
      }
    }
    
    router.push(path);
  };
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  let state = null;
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem('routeState');
      if (cached) {
        state = JSON.parse(cached);
      }
    } catch (e) {
      console.error("Failed to parse routeState", e);
    }
  }

  return { pathname, searchParams, state };
}
