export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    if (!["http:", "https:"].includes(source.protocol)) return false;
    // Browsers set this protected header from the public URL, before proxies
    // rewrite the host. Cross-origin pages cannot set it to "same-origin".
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite === "same-origin") return true;
    if (fetchSite && fetchSite !== "none") return false;
    const target = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? target.host;
    if (source.host === host) return true;

    // Codespaces can forward the request with an internal host. Allow only
    // this Codespace's exact public address for the application's port.
    const codespace = process.env.CODESPACE_NAME;
    const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
    const port = target.port || (target.protocol === "https:" ? "443" : "80");
    return Boolean(codespace && domain && source.protocol === "https:" &&
      source.host === `${codespace}-${port}.${domain}`);
  } catch {
    return false;
  }
}
