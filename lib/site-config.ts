export type PublicSiteConfig = {
  platform_name: string;
  logo_url: string;
  support_email: string;
};

let cachedConfigPromise: Promise<PublicSiteConfig | null> | null = null;
let cachedConfigValue: PublicSiteConfig | null = null;

export function getPublicSiteConfig(): Promise<PublicSiteConfig | null> {
  if (cachedConfigValue) return Promise.resolve(cachedConfigValue);
  if (cachedConfigPromise) return cachedConfigPromise;

  cachedConfigPromise = fetch("/api/public/site-config", { cache: "force-cache" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data) {
        cachedConfigValue = {
          platform_name: data.platform_name || "ToolModeOn",
          logo_url: data.logo_url || "",
          support_email: data.support_email || "",
        };
      }
      return cachedConfigValue;
    })
    .catch(() => null)
    .finally(() => {
      // Clear in-flight promise after resolution
      cachedConfigPromise = null;
    });

  return cachedConfigPromise;
}

