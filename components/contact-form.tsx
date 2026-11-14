"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { OFFICIAL_EMAIL } from "../lib/seo-constants";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [inquiryType, setInquiryType] = useState("general");
  const [message, setMessage] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation checks
    if (!name.trim() || name.trim().length < 2) {
      setError("Please provide your full name (at least 2 characters).");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address so we can reply to you.");
      return;
    }

    if (!subject.trim() || subject.trim().length < 3) {
      setError("Please enter a subject with at least 3 characters.");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError("Please describe your inquiry in detail (at least 10 characters).");
      return;
    }

    if (message.length > 5000) {
      setError("Message cannot exceed 5,000 characters.");
      return;
    }

    if (!privacyConsent) {
      setError("Please check the privacy acknowledgement box before submitting.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          inquiryType,
          message: message.trim(),
          privacyConsent,
          honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message. Please try again.");
      }

      setSuccess(
        data.message ||
          "Thank you! Your message has been received. Our team will review your inquiry and reply via email."
      );
      // Reset form fields
      setName("");
      setEmail("");
      setSubject("");
      setInquiryType("general");
      setMessage("");
      setPrivacyConsent(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send your message. Please email us directly at toolmodeon@gmail.com."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-2xs">
      <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
        Send Us a Message
      </h2>
      <p className="mt-1 text-xs text-muted leading-relaxed">
        Fill out the form below and we will get back to you as soon as possible.
      </p>

      {success ? (
        <div className="mt-6 rounded-xl border border-neutral-300 bg-pale p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="mt-3 font-bold text-base text-ink">Inquiry Received</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted max-w-md mx-auto">{success}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-pale transition"
            >
              Send Another Inquiry
            </button>
            <Link
              href="/tools"
              className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                <div className="mt-1">
                  You can also email us directly at{" "}
                  <a href={`mailto:${OFFICIAL_EMAIL}`} className="font-bold underline">
                    {OFFICIAL_EMAIL}
                  </a>
                  .
                </div>
              </div>
            </div>
          )}

          {/* Hidden Honeypot Field */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website-hp">Website</label>
            <input
              id="website-hp"
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-semibold text-ink">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-semibold text-ink">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-email"
                required
                type="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-subject" className="block text-xs font-semibold text-ink">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-subject"
                required
                maxLength={150}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your question"
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink"
              />
            </div>

            <div>
              <label htmlFor="contact-category" className="block text-xs font-semibold text-ink">
                Inquiry Type <span className="text-red-500">*</span>
              </label>
              <select
                id="contact-category"
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
              >
                <option value="general">General Inquiries</option>
                <option value="support">Technical Support</option>
                <option value="bug">Bug Reports</option>
                <option value="feedback">Feedback and Suggestions</option>
                <option value="business">Business and Partnerships</option>
                <option value="privacy">Privacy and Data Protection Questions</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="contact-message" className="block text-xs font-semibold text-ink">
                Message <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-muted">{message.length}/5000</span>
            </div>
            <textarea
              id="contact-message"
              required
              rows={5}
              maxLength={5000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we assist you? Please include relevant details or tool names if applicable."
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink resize-y"
            />
          </div>

          {/* Privacy acknowledgement checkbox */}
          <div className="mt-1">
            <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 rounded border-line accent-ink h-4 w-4 shrink-0"
              />
              <span>
                I acknowledge that my contact information will be used solely to respond to this
                inquiry in accordance with the{" "}
                <Link href="/privacy-policy" className="text-ink underline hover:text-black">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Submit Inquiry</span>
                </>
              )}
            </button>

            <a
              href={`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(
                subject || "Inquiry from ToolModeOn"
              )}&body=${encodeURIComponent(message)}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition"
            >
              <Mail size={13} />
              <span>Or open directly in email app</span>
            </a>
          </div>
        </form>
      )}
    </div>
  );
}

