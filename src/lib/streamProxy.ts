/**
 * Proxy utility - simplified for App Store version.
 * Since we're using direct HTTPS URLs, no proxy is needed.
 * This is kept as a pass-through for backward compatibility.
 */
export const toProxyStreamUrl = (url: string): string => url;
export const toProxyAssetUrl = (url: string | null): string | null => url;
