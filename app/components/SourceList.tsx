import type { Source } from "@/app/lib/api";

export function formatSource(s: Source) {
  const section = s.section_path?.split(" > ").at(-1);
  return [s.page != null ? `p. ${s.page}` : null, section, s.content_type]
    .filter(Boolean)
    .join(" · ");
}

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {sources.map((s, i) => (
        <span
          key={i}
          title={`${s.section_path ?? ""}\n\n${s.snippet}`}
          className="max-w-xs truncate rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-text-secondary"
        >
          {formatSource(s)}
        </span>
      ))}
    </div>
  );
}
