import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";
import { OFFICIAL_EMAIL } from "../../../../lib/seo-constants";

// Simple in-memory rate limiting: max 5 submissions per 15 minutes per IP
const ipRequests = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = ipRequests.get(ip);

  if (!record || now > record.expiresAt) {
    ipRequests.set(ip, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  if (record.count >= 5) {
    return true;
  }

  record.count += 1;
  return false;
}

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(254, "Email cannot exceed 254 characters."),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters.")
    .max(150, "Subject cannot exceed 150 characters."),
  inquiryType: z.enum([
    "general",
    "support",
    "bug",
    "feedback",
    "business",
    "privacy",
  ]),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message cannot exceed 5,000 characters."),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the privacy policy.",
  }),
  honeypot: z.string().optional(),
});

export async function GET() {
  return NextResponse.json(
    { email: OFFICIAL_EMAIL },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error:
            "Too many contact submissions from your connection. Please wait 15 minutes or email us directly.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot spam check (bots fill this invisible field)
    if (body.honeypot && String(body.honeypot).trim() !== "") {
      // Silently return success to mislead spambots
      return NextResponse.json({
        ok: true,
        message: "Your inquiry has been received.",
      });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid submission.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, subject, inquiryType, message } = parsed.data;

    // Sanitize string content against basic injection
    const sanitizedSubject = subject.replace(/[\r\n]/g, " ");
    const sanitizedName = name.replace(/[<>]/g, "");

    // Attempt to persist inquiry in Supabase if database is configured
    let savedToDatabase = false;
    try {
      const admin = getSupabaseAdminClient();
      if (admin) {
        // Try to insert into contact_inquiries or system audit table
        const { error: dbError } = await admin.from("contact_inquiries").insert({
          name: sanitizedName,
          email,
          subject: sanitizedSubject,
          inquiry_type: inquiryType,
          message,
          ip_address: ip,
          created_at: new Date().toISOString(),
        });
        if (!dbError) {
          savedToDatabase = true;
        }
      }
    } catch {
      // Table may not exist yet in early environments; continue safely
    }

    // Inspect if an external email delivery service (e.g. Resend, SMTP) is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailDispatched = false;

    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `ToolModeOn Contact <contact@toolmodeon.online>`,
            to: [OFFICIAL_EMAIL],
            reply_to: email,
            subject: `[${inquiryType.toUpperCase()}] ${sanitizedSubject}`,
            text: `Contact Inquiry via ToolModeOn\n\nName: ${sanitizedName}\nEmail: ${email}\nCategory: ${inquiryType}\n\nMessage:\n${message}\n\nSubmitted from IP: ${ip}`,
          }),
        });
        if (res.ok) {
          emailDispatched = true;
        }
      } catch {
        // Email API failure handled gracefully
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        "Thank you! Your message has been received. Our team will review your inquiry and reply via email if necessary.",
      deliveredViaEmail: emailDispatched,
      recordedInDatabase: savedToDatabase,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while processing your inquiry. Please try again or email us directly at toolmodeon@gmail.com.",
      },
      { status: 500 }
    );
  }
}
