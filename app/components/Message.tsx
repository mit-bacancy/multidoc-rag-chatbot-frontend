import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { SparkleIcon } from "@/app/components/icons";
import { SourceList } from "@/app/components/SourceList";
import type { Source } from "@/app/lib/api";
import { cn } from "@/app/lib/cn";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  pending?: boolean;
  error?: boolean;
}

function omitNode<T extends ExtraProps>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

const markdownComponents: Components = {
  p: (props) => <p className="mb-3 last:mb-0" {...omitNode(props)} />,
  a: (props) => (
    <a
      className="text-accent underline underline-offset-2 hover:text-accent-hover"
      target="_blank"
      rel="noreferrer"
      {...omitNode(props)}
    />
  ),
  ul: (props) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0" {...omitNode(props)} />
  ),
  ol: (props) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0" {...omitNode(props)} />
  ),
  li: (props) => <li {...omitNode(props)} />,
  strong: (props) => (
    <strong className="font-semibold text-text-primary" {...omitNode(props)} />
  ),
  h1: (props) => (
    <h1 className="mb-2 mt-4 text-lg font-semibold first:mt-0" {...omitNode(props)} />
  ),
  h2: (props) => (
    <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0" {...omitNode(props)} />
  ),
  h3: (props) => (
    <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0" {...omitNode(props)} />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-3 border-l-2 border-border pl-3 text-text-secondary last:mb-0"
      {...omitNode(props)}
    />
  ),
  code: ({ className, children, ...props }) =>
    className ? (
      <code className={cn("font-mono text-[0.85em]", className)} {...omitNode(props)}>
        {children}
      </code>
    ) : (
      <code
        className="rounded bg-surface px-1 py-0.5 font-mono text-[0.85em]"
        {...omitNode(props)}
      >
        {children}
      </code>
    ),
  pre: (props) => (
    <pre
      className="mb-3 overflow-x-auto rounded-lg bg-surface p-3 last:mb-0"
      {...omitNode(props)}
    />
  ),
  table: (props) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="border-collapse text-left" {...omitNode(props)} />
    </div>
  ),
  th: (props) => (
    <th className="border border-border px-2 py-1 font-medium" {...omitNode(props)} />
  ),
  td: (props) => <td className="border border-border px-2 py-1" {...omitNode(props)} />,
};

export function Message({ role, content, sources = [], pending, error }: MessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] whitespace-pre-wrap rounded-2xl bg-surface px-4 py-2.5 text-sm text-text-primary">
          {content}
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="flex gap-3" role="status" aria-label="Generating answer">
        <SparkleIcon className="mt-1 h-5 w-5 shrink-0 animate-pulse text-accent" />
        <div className="flex h-7 items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <SparkleIcon className="mt-1 h-5 w-5 shrink-0 text-accent" />
      <div
        className={cn(
          "min-w-0 flex-1 text-sm leading-relaxed text-text-primary",
          error && "text-red-400",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
        <SourceList sources={sources} />
      </div>
    </div>
  );
}
