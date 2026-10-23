import type { DocumentInfo } from "@/app/lib/api";
import { cn } from "@/app/lib/cn";

interface DocumentSelectorProps {
  documents: DocumentInfo[];
  selected: string | null;
  onSelect: (docId: string) => void;
}

export function DocumentSelector({ documents, selected, onSelect }: DocumentSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select a document"
      className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1"
    >
      {documents.map((doc) => {
        const active = doc.doc_id === selected;
        return (
          <button
            key={doc.doc_id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!doc.ready}
            title={doc.ready ? doc.title : `${doc.title} (not ingested yet)`}
            onClick={() => onSelect(doc.doc_id)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
              !doc.ready && "cursor-not-allowed opacity-40 hover:bg-transparent",
            )}
          >
            {doc.title}
            {!doc.ready && <span className="ml-1 text-xs">· not ready</span>}
          </button>
        );
      })}
    </div>
  );
}
