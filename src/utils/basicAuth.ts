import type { Page } from '@playwright/test';

/**
 * Set Authorization headers via routing for specified hosts.
 * - Uses TAO_BASIC_AUTH_USER/PASSWORD for credentials
 * - Targets baseUrl host and any extra hosts in TAO_BASIC_AUTH_HOSTS
 * - Supports wildcard host specs like *.example.com
 */
export async function setupBasicAuthRouting(page: Page, baseUrl?: string): Promise<void> {
  const baUser = process.env.TAO_BASIC_AUTH_USER;
  const baPass = process.env.TAO_BASIC_AUTH_PASSWORD;
  if (!baUser || !baPass || !baseUrl) return;

  const baseHost = new URL(baseUrl).host;
  const hostSpecs = (process.env.TAO_BASIC_AUTH_HOSTS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const patterns = [baseHost, ...hostSpecs];

  const matches = (targetHost: string) => {
    for (const p of patterns) {
      if (p.startsWith('*.')) {
        const suf = p.slice(2);
        if (targetHost === suf || targetHost.endsWith('.' + suf)) return true;
      } else if (targetHost === p) {
        return true;
      }
    }
    return false;
  };

  const authorization = 'Basic ' + Buffer.from(`${baUser}:${baPass}`).toString('base64');
  await page.route('**/*', async (route) => {
    const req = route.request();
    try {
      const url = new URL(req.url());
      if (matches(url.host)) {
        const headers = { ...req.headers(), authorization };
        return route.continue({ headers });
      }
    } catch {}
    return route.continue();
  });

  // Helpful diagnostics: detect any 401s to hint missing Basic hosts
  page.on('response', async (res) => {
    try {
      if (res.status() !== 401) return;
      const url = new URL(res.url());
      const host = url.host;
      // eslint-disable-next-line no-console
      console.warn(
        `[BasicAuth] 401 detected from: ${url.origin}. ` +
          (matches(host)
            ? '認証情報が誤っている可能性があります（TAO_BASIC_AUTH_USER / TAO_BASIC_AUTH_PASSWORD を確認）。'
            : `このホストにも Basic 認証が必要です。環境変数 TAO_BASIC_AUTH_HOSTS に追加してください（例: ${host} または *.${host.split('.').slice(1).join('.')}).`),
      );
    } catch {
      // noop
    }
  });
}
