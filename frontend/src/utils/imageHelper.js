/**
 * Resolves a vehicle image URL.
 * - If it's already an absolute URL, return as-is.
 * - If it's a relative /api/... path, return as-is (Vite proxy handles it in dev).
 * - If empty/null, return null (let component show fallback).
 */
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path like /api/uploads/swift.jpg — use Vite proxy in dev, works in prod too
  return url;
}
