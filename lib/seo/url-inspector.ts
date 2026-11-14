import { promises as dns } from "node:dns";

export interface HopResult {
  hop: number;
  url: string;
  statusCode: number;
  statusText: string;
  location?: string;
  responseTimeMs: number;
}

export interface ExtractedMetadata {
  title: string;
  description: string;
  robots: string;
  canonical: string;
  canonicalTags: string[];
  viewport: string;
  charset: string;
  lang: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  allMeta: Array<{ name?: string; property?: string; content: string }>;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: string[];
  textStats: {
    totalWords: number;
    charCount: number;
    charCountNoSpaces: number;
    sentenceCount: number;
    paragraphCount: number;
    headingsCount: number;
    cleanedText: string;
  };
}

export interface InspectUrlResult {
  success: boolean;
  error?: string;
  originalUrl: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  totalTimeMs: number;
  redirectCount: number;
  redirectChain: HopResult[];
  headers: Record<string, string>;
  metadata?: ExtractedMetadata;
}

/**
 * Checks if an IP address belongs to private, loopback, link-local,
 * multicast, cloud metadata, or reserved ranges.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  // IPv6 checks
  const lowerIp = ip.toLowerCase();
  if (
    lowerIp === "::1" ||
    lowerIp === "::" ||
    lowerIp.startsWith("fe80:") || // Link-local
    lowerIp.startsWith("fc00:") || // Unique local
    lowerIp.startsWith("fd00:") || // Unique local
    lowerIp.startsWith("ff00:")    // Multicast
  ) {
    return true;
  }

  // IPv4 checks
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8 (Current network)
  if (a === 10) return true; // 10.0.0.0/8 (Private network)
  if (a === 127) return true; // 127.0.0.0/8 (Loopback)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (Link-local & Cloud Metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (Private network)
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 (Private network)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (Shared address space)
  if (a >= 224) return true; // 224.0.0.0/4 (Multicast / Reserved)

  return false;
}

/**
 * Validates a target URL for SSRF protection:
 * - Only http: and https: protocols
 * - Rejects userinfo (credentials in URL)
 * - Rejects localhost and internal hostnames
 * - Resolves DNS and verifies IP is public
 */
export async function validateUrlForSsrf(
  urlString: string
): Promise<{ valid: boolean; error?: string; parsedUrl?: URL; ip?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTP and HTTPS protocols are permitted." };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs containing user credentials are not allowed." };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]"
  ) {
    return { valid: false, error: "Access to localhost or loopback destinations is blocked." };
  }

  // Resolve hostname to IP to protect against DNS rebinding and internal network requests
  try {
    const lookupResult = await dns.lookup(hostname);
    if (isPrivateIp(lookupResult.address)) {
      return {
        valid: false,
        error: "Destination resolves to a restricted private or internal IP address.",
      };
    }
    return { valid: true, parsedUrl: parsed, ip: lookupResult.address };
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not resolve hostname "${hostname}" (${err?.message || "DNS lookup failed"}).`,
    };
  }
}

/**
 * Safely inspects a URL by following redirects hop-by-hop with strict
 * SSRF validation at every stage, timeout controls, and response size limits.
 */
export async function safeInspectUrl(
  targetUrl: string,
  options: {
    maxHops?: number;
    timeoutMs?: number;
    maxBytes?: number;
    extractHtml?: boolean;
  } = {}
): Promise<InspectUrlResult> {
  const maxHops = options.maxHops ?? 10;
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024; // 2MB
  const extractHtml = options.extractHtml ?? true;

  const redirectChain: HopResult[] = [];
  const visitedUrls = new Set<string>();
  let currentUrl = targetUrl;
  let finalStatus = 0;
  let finalStatusText = "";
  let finalHeaders: Record<string, string> = {};
  let finalHtml = "";
  let totalStartTime = Date.now();

  try {
    for (let hop = 0; hop <= maxHops; hop++) {
      if (visitedUrls.has(currentUrl)) {
        return {
          success: false,
          error: "Redirect loop detected: " + currentUrl,
          originalUrl: targetUrl,
          finalUrl: currentUrl,
          statusCode: 310,
          statusText: "Redirect Loop",
          totalTimeMs: Date.now() - totalStartTime,
          redirectCount: redirectChain.length,
          redirectChain,
          headers: finalHeaders,
        };
      }
      visitedUrls.add(currentUrl);

      // Validate SSRF for current URL
      const ssrfCheck = await validateUrlForSsrf(currentUrl);
      if (!ssrfCheck.valid) {
        return {
          success: false,
          error: ssrfCheck.error || "Destination blocked by security policy.",
          originalUrl: targetUrl,
          finalUrl: currentUrl,
          statusCode: 0,
          statusText: "Blocked",
          totalTimeMs: Date.now() - totalStartTime,
          redirectCount: redirectChain.length,
          redirectChain,
          headers: finalHeaders,
        };
      }

      const hopStartTime = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual", // Handle redirects manually to validate each hop
          signal: controller.signal,
          headers: {
            "User-Agent": "ToolModeOn-SEO-Bot/1.0 (+https://toolmodeon.online/bot)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
      } catch (fetchErr: any) {
        clearTimeout(timer);
        if (fetchErr.name === "AbortError") {
          return {
            success: false,
            error: `Request timed out after ${timeoutMs}ms.`,
            originalUrl: targetUrl,
            finalUrl: currentUrl,
            statusCode: 408,
            statusText: "Request Timeout",
            totalTimeMs: Date.now() - totalStartTime,
            redirectCount: redirectChain.length,
            redirectChain,
            headers: finalHeaders,
          };
        }
        return {
          success: false,
          error: `Network error reaching destination: ${fetchErr?.message || "Failed to connect"}`,
          originalUrl: targetUrl,
          finalUrl: currentUrl,
          statusCode: 0,
          statusText: "Connection Failed",
          totalTimeMs: Date.now() - totalStartTime,
          redirectCount: redirectChain.length,
          redirectChain,
          headers: finalHeaders,
        };
      } finally {
        clearTimeout(timer);
      }

      const hopDuration = Date.now() - hopStartTime;
      const status = response.status;
      const statusText = response.statusText || `${status}`;
      const location = response.headers.get("location") || undefined;

      // Extract safe headers
      const headersObj: Record<string, string> = {};
      const safeHeaderKeys = [
        "content-type",
        "content-length",
        "server",
        "cache-control",
        "date",
        "content-encoding",
        "strict-transport-security",
        "x-robots-tag",
        "etag",
        "location",
      ];
      for (const key of safeHeaderKeys) {
        const val = response.headers.get(key);
        if (val) headersObj[key] = val;
      }

      redirectChain.push({
        hop: hop + 1,
        url: currentUrl,
        statusCode: status,
        statusText,
        location,
        responseTimeMs: hopDuration,
      });

      finalStatus = status;
      finalStatusText = statusText;
      finalHeaders = headersObj;

      // Check for redirect status codes (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(status) && location) {
        try {
          const nextUrl = new URL(location, currentUrl).href;
          currentUrl = nextUrl;
          continue;
        } catch {
          break;
        }
      }

      // Not a redirect — final destination reached
      if (extractHtml) {
        try {
          const text = await response.text();
          finalHtml = text.slice(0, maxBytes);
        } catch {
          finalHtml = "";
        }
      }
      break;
    }

    const metadata = extractHtml && finalHtml ? parseHtmlMetadata(finalHtml, currentUrl) : undefined;

    return {
      success: true,
      originalUrl: targetUrl,
      finalUrl: currentUrl,
      statusCode: finalStatus,
      statusText: finalStatusText,
      totalTimeMs: Date.now() - totalStartTime,
      redirectCount: Math.max(0, redirectChain.length - 1),
      redirectChain,
      headers: finalHeaders,
      metadata,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unexpected error during inspection.",
      originalUrl: targetUrl,
      finalUrl: currentUrl,
      statusCode: finalStatus || 500,
      statusText: finalStatusText || "Internal Error",
      totalTimeMs: Date.now() - totalStartTime,
      redirectCount: redirectChain.length,
      redirectChain,
      headers: finalHeaders,
    };
  }
}

/**
 * Extracts SEO, Open Graph, Twitter, canonical, heading, and text metrics from HTML string.
 */
export function parseHtmlMetadata(html: string, baseUrl: string): ExtractedMetadata {
  const result: ExtractedMetadata = {
    title: "",
    description: "",
    robots: "",
    canonical: "",
    canonicalTags: [],
    viewport: "",
    charset: "",
    lang: "",
    og: {},
    twitter: {},
    allMeta: [],
    headings: { h1: [], h2: [], h3: [] },
    links: [],
    textStats: {
      totalWords: 0,
      charCount: 0,
      charCountNoSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      headingsCount: 0,
      cleanedText: "",
    },
  };

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    result.title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // HTML lang
  const langMatch = html.match(/<html[^>]*\blang=["']([^"']+)["']/i);
  if (langMatch) {
    result.lang = langMatch[1].trim();
  }

  // Charset
  const charsetMatch = html.match(/<meta[^>]*\bcharset=["']?([^"'\s>]+)/i);
  if (charsetMatch) {
    result.charset = charsetMatch[1].trim();
  }

  // Meta tags
  const metaRegex = /<meta\s+([^>]+)>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1];
    const nameMatch = attrs.match(/\bname=["']([^"']+)["']/i);
    const propMatch = attrs.match(/\bproperty=["']([^"']+)["']/i);
    const contentMatch = attrs.match(/\bcontent=["']([\s\S]*?)["']/i);

    const name = nameMatch ? nameMatch[1] : undefined;
    const property = propMatch ? propMatch[1] : undefined;
    const content = contentMatch ? decodeHtmlEntities(contentMatch[1]) : "";
    const key = (name || property || "").toLowerCase();

    if (key) {
      result.allMeta.push({ name, property, content });
      if (key === "description") result.description = content;
      if (key === "robots") result.robots = content;
      if (key === "viewport") result.viewport = content;
      if (key.startsWith("og:")) result.og[key.slice(3)] = content;
      if (key.startsWith("twitter:")) result.twitter[key.slice(8)] = content;
    }
  }

  // Canonical tags
  const linkRegex = /<link\s+([^>]+)>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1];
    if (/\brel=["']canonical["']/i.test(attrs)) {
      const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
      if (hrefMatch) {
        const rawHref = hrefMatch[1].trim();
        result.canonicalTags.push(rawHref);
        if (!result.canonical) result.canonical = rawHref;
      }
    }
  }

  // Headings
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  while ((match = h1Regex.exec(html)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text) result.headings.h1.push(text);
  }

  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  while ((match = h2Regex.exec(html)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text) result.headings.h2.push(text);
  }

  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  while ((match = h3Regex.exec(html)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text) result.headings.h3.push(text);
  }

  // Links (<a href="...">)
  const aRegex = /<a\s+[^>]*\bhref=["']([^"'#\s>]+)["']/gi;
  const linkSet = new Set<string>();
  while ((match = aRegex.exec(html)) !== null && linkSet.size < 50) {
    try {
      const resolved = new URL(match[1], baseUrl).href;
      if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
        linkSet.add(resolved);
      }
    } catch {
      // ignore malformed URLs
    }
  }
  result.links = Array.from(linkSet);

  // Text Stats (Clean readable content)
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Count paragraphs and sentences before full tag stripping
  const pMatches = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  result.textStats.paragraphCount = pMatches.length;

  const plainText = decodeHtmlEntities(stripTags(cleaned)).replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const sentences = plainText.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0);

  result.textStats.totalWords = words.length;
  result.textStats.charCount = plainText.length;
  result.textStats.charCountNoSpaces = plainText.replace(/\s/g, "").length;
  result.textStats.sentenceCount = sentences.length;
  result.textStats.headingsCount =
    result.headings.h1.length + result.headings.h2.length + result.headings.h3.length;
  result.textStats.cleanedText = plainText.slice(0, 5000); // sample of readable text

  return result;
}

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, " ");
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

