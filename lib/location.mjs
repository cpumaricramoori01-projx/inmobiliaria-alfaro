const coordinatePattern = /^-?\d+(?:\.\d+)?$/;
export function locationPoint(latitude, longitude) {
  if (latitude === '' || longitude === '' || latitude == null || longitude == null) return null;
  if (![latitude, longitude].every(value => ['number', 'string'].includes(typeof value) && coordinatePattern.test(String(value)))) return null;
  const lat = Number(latitude), lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}
export function googleMapsUrl(point, directions = false) {
  const params = new URLSearchParams({ api: '1', [directions ? 'destination' : 'query']: `${point.lat},${point.lng}` });
  return `https://www.google.com/maps/${directions ? 'dir' : 'search'}/?${params}`;
}
export function allowedGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      (['maps.app.goo.gl', 'maps.google.com'].includes(url.hostname) ||
       (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/')) ||
       (['google.com', 'www.google.com'].includes(url.hostname) && url.pathname.startsWith('/maps')));
  } catch { return false; }
}
export function parseGoogleMapsLocation(value) {
  if (!allowedGoogleMapsUrl(value)) return null;
  const url = new URL(value);
  let path;
  try { path = decodeURIComponent(url.pathname + url.search); } catch { return null; }
  const pairs = [...path.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
  if (pairs.length) {
    const pair = pairs.at(-1), point = locationPoint(pair[1], pair[2]);
    return point ? { ...point, approximate: false } : null;
  }
  for (const key of ['query', 'q', 'll', 'destination']) {
    const match = url.searchParams.get(key)?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (match) { const point = locationPoint(match[1], match[2]); if (point) return { ...point, approximate: key === 'll' }; }
  }
  const camera = path.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const point = camera && locationPoint(camera[1], camera[2]);
  return point ? { ...point, approximate: true } : null;
}
