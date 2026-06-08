/**
 * Trusted-host allowlist for the agent API URL.
 *
 * The `apiUrl` is read from the page query string and is used to build the
 * LangGraph SDK client (which sends the stored API key as an auth header) and
 * to fetch `${apiUrl}/info`. Without validation, an attacker-crafted link like
 * `?apiUrl=https://attacker.example` would exfiltrate the API key to that host.
 *
 * We only ever talk to (and send the API key to) an allowlisted origin:
 *  - the deployment-configured NEXT_PUBLIC_API_URL,
 *  - any origins listed in NEXT_PUBLIC_ALLOWED_API_URLS (comma-separated), and
 *  - localhost dev defaults.
 *
 * Per google-cloud-platform-tsr 1.13: API key usage must be restricted to
 * trusted hosts and the application only.
 */

const LOCALHOST_DEFAULTS = [
  "http://localhost:2024",
  "http://127.0.0.1:2024",
];

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const add = (u?: string | null) => {
    if (!u) return;
    const o = originOf(u);
    if (o) origins.add(o);
  };

  add(process.env.NEXT_PUBLIC_API_URL);
  (process.env.NEXT_PUBLIC_ALLOWED_API_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(add);
  LOCALHOST_DEFAULTS.forEach(add);

  return origins;
}

/**
 * @returns true if `url` parses and its origin is in the trusted allowlist.
 */
export function isAllowedApiUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const origin = originOf(url);
  if (!origin) return false;
  return allowedOrigins().has(origin);
}

/**
 * Returns `url` if it is allowlisted; otherwise throws. Use at any sink that
 * sends credentials to, or navigates to, the agent API URL.
 */
export function assertAllowedApiUrl(url: string): string {
  if (!isAllowedApiUrl(url)) {
    throw new Error(
      `Refusing to use untrusted API URL "${url}". Add its origin to NEXT_PUBLIC_ALLOWED_API_URLS to allow it.`,
    );
  }
  return url;
}
