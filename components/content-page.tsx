import Link from "next/link";

export function ContentPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main>
      <section className="border-b border-line bg-pale/40">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">{intro}</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
        <div className="grid gap-8 text-sm leading-7 text-muted">
          {children}
          <div className="rounded-2xl border border-line bg-pale p-5">
            <p className="font-bold text-ink">Need a hand?</p>
            <p className="mt-1">
              Reach us through the{" "}
              <Link href="/contact" className="font-semibold text-ink underline hover:text-neutral-700">
                contact page
              </Link>{" "}
              and we&apos;ll get back to you promptly.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
