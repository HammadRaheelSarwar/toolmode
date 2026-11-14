import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export function paddleEnvironment() {
  return process.env.PADDLE_ENVIRONMENT === "live" ? "live" : "sandbox";
}

export function paddleApiBaseUrl() {
  return paddleEnvironment() === "live" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
}

export function liveBillingEnabled() {
  return paddleEnvironment() !== "live" || (process.env.PADDLE_LIVE_ENABLED === "true" && process.env.PADDLE_SELLER_APPROVED === "true");
}

export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = header.split(";").map((part) => part.trim().split("=", 2) as [string, string]);
  const timestamp = parts.find(([key]) => key === "ts")?.[1];
  const signatures = parts.filter(([key]) => key === "h1").map(([, value]) => value);
  if (!timestamp || !/^\d{9,12}$/.test(timestamp) || !signatures.length) return false;
  const timestampSeconds = Number(timestamp);
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > 5) return false;
  const digest = createHmac("sha256", secret).update(`${timestamp}:${rawBody}`, "utf8").digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const candidate = Buffer.from(signature, "hex");
    return candidate.length === digest.length && timingSafeEqual(candidate, digest);
  });
}
