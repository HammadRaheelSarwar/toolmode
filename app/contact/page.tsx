"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function Contact() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/public/contact")
      .then((r) => r.json())
      .then((body) => setEmail(body.email || null))
      .catch(() => {});
  }, []);

  function openEmail(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    const subject = encodeURIComponent(`ToolModeOn contact from ${name.trim() || from}`);
    const body = encodeURIComponent(`${message.trim()}\n\nFrom: ${name.trim()} <${from.trim()}>`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <main>
      <section className="border-b border-line bg-pale/40">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">Contact Us</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Get in touch</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">Have feedback, questions, or a tool you&apos;d love to see added? We&apos;d love to hear from you.</p>
        </div>
      </section>
      <section className="mx-auto max-w-xl px-5 py-14 lg:px-8">
        <div className="rounded-2xl border border-line bg-white p-7 shadow-xs">
          {email ? (
            <>
              <p className="mb-5 text-xs leading-relaxed text-muted">
                Your email application will open with a draft. The message is sent only when you choose to send it.
              </p>
              <form onSubmit={openEmail} className="grid gap-4">
                <label className="text-xs font-semibold text-ink">
                  Your name
                  <input
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink"
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="text-xs font-semibold text-ink">
                  Your email
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink"
                    placeholder="jane@example.com"
                  />
                </label>
                <label className="text-xs font-semibold text-ink">
                  Message
                  <textarea
                    required
                    maxLength={10000}
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink resize-y"
                    placeholder="How can we help?"
                  />
                </label>
                <button className="mt-2 rounded-xl bg-ink py-3 text-xs font-semibold text-white transition hover:bg-neutral-800">
                  Open email draft
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted">
                Have a question or request? All 79 tools are free to use without an account. Check our tools directory or feel free to reach out via GitHub.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/tools"
                  className="rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
                >
                  Explore All Tools
                </Link>
                <Link
                  href="/"
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-hover"
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
