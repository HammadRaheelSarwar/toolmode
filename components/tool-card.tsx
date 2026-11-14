import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "../lib/tools";

export function ToolCard({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const Icon = tool.icon;
  return (
    <Link
      href={`/tools/${tool.slug}`}
      prefetch={true}
      className={`group relative flex ${
        compact ? "gap-3.5 p-4 items-center" : "flex-col p-5"
      } rounded-xl border border-line bg-white transition-all duration-150 hover:border-ink hover:bg-white`}
    >
      <div
        className={`flex ${compact ? "h-9 w-9" : "h-10 w-10"} shrink-0 items-center justify-center rounded-lg bg-pale text-ink transition-colors duration-150 group-hover:bg-ink group-hover:text-white`}
      >
        <Icon size={compact ? 17 : 19} strokeWidth={2} />
      </div>
      <div className={compact ? "min-w-0 flex-1" : "mt-3.5 flex-1 flex flex-col justify-between"}>
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm tracking-tight text-ink group-hover:text-ink">
              {tool.name}
            </h3>
            {compact && (
              <ArrowUpRight
                size={13}
                className="shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
              />
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">{tool.description}</p>
        </div>
        {!compact && (
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
            <span className="text-[11px] font-medium text-muted">{tool.category}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink transition-transform duration-150 group-hover:translate-x-0.5">
              Open <ArrowUpRight size={12} strokeWidth={2.2} />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
