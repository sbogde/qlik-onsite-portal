const BASE = import.meta.env.VITE_QLIK_HTTP_BASE ?? 'http://localhost:3000/api';
const TOKEN = import.meta.env.VITE_PROXY_TOKEN ?? '';

type ProxyInit = RequestInit & { headers?: HeadersInit };

export async function proxyGet(path: string, init: ProxyInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'x-proxy-token': TOKEN,
    },
  });

  if (!res.ok) {
    throw new Error(`Proxy HTTP ${res.status} for ${path}`);
  }

  return res;
}
