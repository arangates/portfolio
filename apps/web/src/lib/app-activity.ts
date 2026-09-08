// Shared by client-side mutations and the PWA's explicit refresh/update controls.
let activeRequests = 0;
export function beginOperation() {
  activeRequests++;
  return () => {
    activeRequests--;
  };
}
export function hasActiveRequests() {
  return activeRequests > 0;
}

export async function appFetch(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const mutation = method !== "GET" && method !== "HEAD";
  if (mutation) activeRequests++;
  try {
    return await fetch(input, init);
  } finally {
    if (mutation) activeRequests--;
  }
}
