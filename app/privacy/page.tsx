import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_URL } from "../../lib/seo-constants";

export const metadata: Metadata = {
  title: "Privacy Policy | ToolModeOn",
  description: "Learn how ToolModeOn handles information, cookies, uploaded files, analytics and advertising.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  robots: { index: false, follow: true },
};

export default function PrivacyRedirect() {
  redirect("/privacy-policy");
}
