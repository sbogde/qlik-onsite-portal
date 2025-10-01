const proxyToken = import.meta.env.VITE_PROXY_TOKEN ?? '';

export const getProxyToken = () => proxyToken;

export const withProxyToken = (rawUrl: string): string => {
  if (!proxyToken) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('token')) {
      url.searchParams.set('token', proxyToken);
    }
    return url.toString();
  } catch {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}token=${encodeURIComponent(proxyToken)}`;
  }
};
