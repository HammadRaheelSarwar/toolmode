import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

let maintenanceCache: { enabled: boolean; message: string; expiresAt: number } = { enabled: false, message: "", expiresAt: 0 };
const userAccessCache = new Map<string, { suspended: boolean; expiresAt: number }>();
const adminRoleCache = new Map<string, { role: string; expiresAt: number }>();

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/pricing" || path === "/register" || path === "/forgot-password" || path === "/reset-password" || path === "/verify-email" || path.startsWith("/dashboard")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/tools";
    redirectUrl.search = "";
    return secure(NextResponse.redirect(redirectUrl, 301));
  }
  if (path === "/login" && !request.nextUrl.searchParams.get("next")?.startsWith("/admin")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/tools";
    redirectUrl.search = "";
    return secure(NextResponse.redirect(redirectUrl, 301));
  }
  const isPrefetch = request.headers.get("next-router-prefetch") === "1" || request.headers.get("purpose") === "prefetch";

  // Fast-path: Check for any Supabase auth cookies
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith("sb-") || c.name.includes("auth-token"));
  const routeNeedsAuth = path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/api/admin/") || path.startsWith("/api/account/");

  // Instant response for all public pages & tools (0ms latency, zero database or network overhead)
  if (!hasAuthCookie && !routeNeedsAuth) {
    return secure(NextResponse.next({ request }));
  }

  if (path.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    let maximumBodyBytes = 1024 * 1024;
    if (path === "/api/webhooks/paddle") maximumBodyBytes = 1024 * 1024;
    else if (path.startsWith("/api/tools/image/")) maximumBodyBytes = 10 * 1024 * 1024 + 512 * 1024;
    else if (path === "/api/admin/blog/image") maximumBodyBytes = 4 * 1024 * 1024 + 256 * 1024;
    else if (/^\/api\/account\/projects\/[^/]+\/files$/.test(path)) maximumBodyBytes = 4 * 1024 * 1024 + 256 * 1024;
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maximumBodyBytes) {
      return secure(NextResponse.json({ error: "Request body is too large." }, { status: 413 }));
    }
  }
  if (path.startsWith("/api/") && path !== "/api/webhooks/paddle" && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    let originHost = "";
    try { originHost = origin ? new URL(origin).host : ""; } catch { originHost = ""; }
    if (!originHost || !host || originHost.toLowerCase() !== host.toLowerCase()) {
      return secure(NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 }));
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return secure(NextResponse.next({ request }));

  // Check if maintenance mode is enabled
  const maintenanceBypass = path.startsWith("/admin") || path.startsWith("/api/admin/") || path.startsWith("/auth/") || path.startsWith("/api/auth/") || path.startsWith("/api/webhooks/") || path.startsWith("/api/cron/") || path === "/login" || path === "/register" || path === "/maintenance" || path === "/api/public/site-config" || path === "/ads.txt" || path === "/robots.txt" || path === "/sitemap.xml";
  if (!maintenanceBypass && await maintenanceEnabled(url, process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    if (path.startsWith("/api/")) return secure(NextResponse.json({ error: maintenanceCache.message || "ToolModeOn is temporarily in maintenance." }, { status: 503 }));
    const maintenance = request.nextUrl.clone(); maintenance.pathname = "/maintenance"; maintenance.search = "";
    return secure(NextResponse.rewrite(maintenance));
  }

  if (path.startsWith("/admin") || path.startsWith("/api/admin/")) {
    if (!hasAuthCookie) {
      if (path.startsWith("/api/")) return secure(NextResponse.json({ error: "Administrator access required." }, { status: 403 }));
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.searchParams.set("next", path);
      return secure(NextResponse.redirect(login));
    }
  }

  let response = NextResponse.next({ request });
  const remember = request.cookies.get("toolmodeon_remember")?.value === "1";
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = { ...options };
          if (remember) cookieOptions.maxAge = 60 * 60 * 24 * 365;
          else { delete cookieOptions.maxAge; delete cookieOptions.expires; }
          response.cookies.set(name, value, cookieOptions);
        });
      }
    }
  });

  // Only call getUser() for routes where user identity is actually required
  let user: { id: string; email?: string; email_confirmed_at?: string | null } | null = null;
  if (routeNeedsAuth && hasAuthCookie) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  if (user && (path.startsWith("/admin") || path.startsWith("/api/admin/"))) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      if (process.env.NODE_ENV === "production") return secure(NextResponse.json({ error: "Admin authorization could not be verified." }, { status: 503 }));
    } else {
      try {
        let role: string | undefined;
        const cachedRole = adminRoleCache.get(user.id);
        if (cachedRole && Date.now() < cachedRole.expiresAt) {
          role = cachedRole.role;
        } else {
          const roleResponse = await fetch(`${url!.replace(/\/$/, "")}/rest/v1/admin_users?select=role&user_id=eq.${encodeURIComponent(user.id)}`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store"
          });
          if (!roleResponse.ok) throw new Error("Admin role lookup failed");
          const rows = await roleResponse.json() as Array<{ role: string }>;
          role = rows[0]?.role;
          if (role) adminRoleCache.set(user.id, { role, expiresAt: Date.now() + 60000 });
        }
        const pagePath = path.startsWith("/api/admin/") ? path.slice("/api".length) : path;
        const allowed = role === "super_admin" ||
          (role === "admin" && pagePath !== "/admin/staff") ||
          (role === "support_manager" && pagePath.startsWith("/admin/support")) ||
          (role === "content_manager" && pagePath.startsWith("/admin/blog"));
        if (!allowed) {
          if (path.startsWith("/api/")) return secure(NextResponse.json({ error: "Administrator access required." }, { status: 403 }));
          const target = request.nextUrl.clone(); target.pathname = "/dashboard"; target.search = "";
          return secure(NextResponse.redirect(target));
        }
      } catch {
        if (process.env.NODE_ENV === "production") return secure(NextResponse.json({ error: "Admin authorization could not be verified." }, { status: 503 }));
      }
    }
  }
  if (user && !isPrefetch && (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/api/account/"))) {
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      if (process.env.NODE_ENV === "production") {
        if (path.startsWith("/api/")) return secure(NextResponse.json({ error: "Account access could not be verified." }, { status: 503 }));
        return secure(new NextResponse("Account access could not be verified.", { status: 503 }));
      }
    } else {
      try{
        let isSuspended = false;
        const cachedAccess = userAccessCache.get(user.id);
        if (cachedAccess && Date.now() < cachedAccess.expiresAt) {
          isSuspended = cachedAccess.suspended;
        } else {
          const accessResponse=await fetch(`${url.replace(/\/$/,"")}/rest/v1/user_access?select=status&user_id=eq.${encodeURIComponent(user.id)}`,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`},cache:"no-store"});
          if(!accessResponse.ok)throw new Error("Access status lookup failed");
          const accessRows=await accessResponse.json() as Array<{status:string}>;
          isSuspended = accessRows.some(row=>row.status==="suspended");
          userAccessCache.set(user.id, { suspended: isSuspended, expiresAt: Date.now() + 60000 });
        }
        if(isSuspended){
          if(path.startsWith("/api/"))return secure(NextResponse.json({error:"This account is currently suspended."},{status:403}));
          const suspended=request.nextUrl.clone();suspended.pathname="/account-suspended";suspended.search="";return secure(NextResponse.redirect(suspended));
        }
      }catch{
        if(process.env.NODE_ENV==="production"&&(path.startsWith("/dashboard")||path.startsWith("/admin")||path.startsWith("/api/account/"))) {
          if (path.startsWith("/api/")) return secure(NextResponse.json({error:"Account access could not be verified."},{status:503}));
          return secure(new NextResponse("Account access could not be verified.",{status:503}));
        }
      }
    }
  }
  if (path.startsWith("/dashboard") && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", path);
    return secure(NextResponse.redirect(login));
  }
  if (path.startsWith("/dashboard") && user && !user.email_confirmed_at) {
    const verify = request.nextUrl.clone();
    verify.pathname = "/verify-email";
    verify.search = "";
    if (user.email) verify.searchParams.set("email", user.email);
    return secure(NextResponse.redirect(verify));
  }
  if ((path === "/login" || path === "/register") && user) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    dashboard.search = "";
    return secure(NextResponse.redirect(dashboard));
  }
  return secure(response);
}

async function maintenanceEnabled(url: string, serviceKey?: string) {
  if (Date.now() < maintenanceCache.expiresAt) return maintenanceCache.enabled;
  if (!serviceKey) return false;
  try {
    const base = url.replace(/\/$/, "");
    const res = await fetch(`${base}/rest/v1/system_settings?select=setting_key,value&setting_key=in.(platform.maintenance_mode,platform.maintenance_message)`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Maintenance setting lookup failed");
    const rows = await res.json() as Array<{ setting_key: string; value: unknown }>;
    const modeRow = rows.find(r => r.setting_key === "platform.maintenance_mode");
    const msgRow = rows.find(r => r.setting_key === "platform.maintenance_message");
    maintenanceCache = {
      enabled: modeRow?.value === true,
      message: typeof msgRow?.value === "string" ? msgRow.value : "",
      expiresAt: Date.now() + 60000
    };
    return maintenanceCache.enabled;
  } catch {
    maintenanceCache = { ...maintenanceCache, expiresAt: Date.now() + 30000 };
    return false;
  }
}

function secure(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|ads.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
