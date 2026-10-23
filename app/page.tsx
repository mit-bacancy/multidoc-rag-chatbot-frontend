"use client";

import { useCallback, useEffect, useState } from "react";
import { SparkleIcon } from "@/app/components/icons";
import { DocumentSelector } from "@/app/components/DocumentSelector";
import { ChatPanel, type ChatEntry } from "@/app/components/ChatPanel";
import {
  ApiError,
  fetchDocuments,
  streamChat,
  type DocumentInfo,
  type Source,
} from "@/app/lib/api";

const STORAGE_KEY = "multidoc-rag:histories";

type Histories = Record<string, ChatEntry[]>;

function loadHistories(): Histories {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Histories;
  } catch {
    return {};
  }
}

export default function Home() {
  const [documents, setDocuments] = useState<DocumentInfo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // One conversation per document; never mixed
  const [histories, setHistories] = useState<Histories>({});
  const [pending, setPending] = useState<Set<string>>(new Set());

  const loadDocs = useCallback(() => {
    setLoadError(null);
    fetchDocuments()
      .then(setDocuments)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setHistories(loadHistories());
    loadDocs();
  }, [loadDocs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
    } catch {
      // storage unavailable; history stays in memory
    }
  }, [histories]);

  const activeDoc = documents?.find((d) => d.doc_id === selected) ?? null;
  const messages = selected ? (histories[selected] ?? []) : [];

  function append(docId: string, entry: Omit<ChatEntry, "id">) {
    const id = crypto.randomUUID();
    setHistories((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] ?? []), { ...entry, id }],
    }));
    return id;
  }

  function update(docId: string, id: string, patch: (m: ChatEntry) => Partial<ChatEntry>) {
    setHistories((prev) => ({
      ...prev,
      [docId]: (prev[docId] ?? []).map((m) => (m.id === id ? { ...m, ...patch(m) } : m)),
    }));
  }

  async function handleSend(text: string) {
    if (!selected) return;
    const docId = selected;
    const history = (histories[docId] ?? [])
      .filter((m) => !m.error)
      .map(({ role, content }) => ({ role, content }));

    append(docId, { role: "user", content: text });
    setPending((p) => new Set(p).add(docId));

    // The assistant entry is created on the first token, so the "Searching" indicator shows until then
    let answerId: string | null = null;
    let sources: Source[] = [];
    try {
      await streamChat(docId, text, history, {
        onSources: (s) => {
          sources = s;
        },
        onToken: (t) => {
          if (answerId === null) {
            answerId = append(docId, { role: "assistant", content: t, sources, streaming: true });
          } else {
            const id = answerId;
            update(docId, id, (m) => ({ content: m.content + t }));
          }
        },
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Something went wrong.";
      if (answerId === null) append(docId, { role: "assistant", content: msg, error: true });
      else update(docId, answerId, (m) => ({ content: `${m.content}\n\n_${msg}_` }));
    } finally {
      if (answerId !== null) update(docId, answerId, () => ({ streaming: false }));
      setPending((p) => {
        const next = new Set(p);
        next.delete(docId);
        return next;
      });
    }
  }

  function clearChat() {
    if (!selected) return;
    setHistories((prev) => ({ ...prev, [selected]: [] }));
  }

  const noneReady = documents !== null && documents.every((d) => !d.ready);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <SparkleIcon className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium">
            {activeDoc ? activeDoc.title : "Multi-Document RAG"}
          </span>
          {activeDoc?.pages && (
            <span className="text-xs text-text-muted">· {activeDoc.pages} pages</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {documents && (
            <DocumentSelector
              documents={documents}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      <ChatPanel
        key={selected ?? "none"}
        messages={messages}
        busy={selected !== null && pending.has(selected)}
        disabled={!activeDoc?.ready}
        placeholder={
          activeDoc ? `Ask about the ${activeDoc.title}...` : "Select a document to start"
        }
        onSend={handleSend}
        emptyState={
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            {loadError ? (
              <>
                <p className="text-sm text-red-400">{loadError}</p>
                <button
                  type="button"
                  onClick={loadDocs}
                  className="text-sm text-accent hover:text-accent-hover"
                >
                  Retry
                </button>
              </>
            ) : documents === null ? (
              <p className="text-sm text-text-muted">Loading documents...</p>
            ) : noneReady ? (
              <p className="text-sm text-text-muted">
                No documents are ingested yet. Run the ingest script on the backend.
              </p>
            ) : activeDoc ? (
              <>
                <h1 className="font-serif text-2xl">Ask about the {activeDoc.title}</h1>
                <p className="text-sm text-text-muted">
                  Answers cite the page and section they come from.
                </p>
              </>
            ) : (
              <h1 className="font-serif text-2xl">Select a report above to begin</h1>
            )}
          </div>
        }
      />
    </div>
  );
}
