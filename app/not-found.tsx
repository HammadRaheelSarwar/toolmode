import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[620px] items-center justify-center px-5 py-24">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">404 Error</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink">Page not found</h1>
        <p className="mt-3 text-sm text-muted">
          The page you are looking for doesn&apos;t exist or has been moved. Explore all free utility tools in our directory.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/tools"
            className="rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Explore Tools
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-line bg-white px-5 py-2.5 text-xs font-semibold text-ink transition hover:bg-hover"
          >
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
