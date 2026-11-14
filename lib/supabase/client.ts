"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  if (!browserClient) browserClient = createBrowserClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return document.cookie.split(";").map((item) => item.trim()).filter(Boolean).map((item) => {
          const separator = item.indexOf("=");
          const name = separator < 0 ? item : item.slice(0, separator);
          const rawValue = separator < 0 ? "" : item.slice(separator + 1);
          try { return { name, value: decodeURIComponent(rawValue) }; } catch { return { name, value: rawValue }; }
        });
      },
      setAll(cookiesToSet) {
        const remember = document.cookie.split(";").some((item) => item.trim() === "toolmodeon_remember=1");
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieParts = [`${name}=${encodeURIComponent(value)}`];
          if (options.domain) cookieParts.push(`Domain=${options.domain}`);
          if (options.path) cookieParts.push(`Path=${options.path}`);
          if (options.maxAge === 0) cookieParts.push("Max-Age=0");
          else if (remember) cookieParts.push(`Max-Age=${60 * 60 * 24 * 365}`);
          if (options.expires && (options.maxAge === 0 || remember)) cookieParts.push(`Expires=${options.expires.toUTCString()}`);
          if (options.sameSite) cookieParts.push(`SameSite=${typeof options.sameSite === "string" ? options.sameSite : "Strict"}`);
          if (options.secure || process.env.NODE_ENV === "production" || window.location.protocol === "https:") cookieParts.push("Secure");
          document.cookie = cookieParts.join("; ");
        });
      }
    }
  });
  return browserClient;
}
