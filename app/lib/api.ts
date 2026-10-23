const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface DocumentInfo {
  doc_id: string;
  title: string;
  pages: number | null;
  ready: boolean;
}

export interface Source {
  page: number | null;
  section_path: string | null;
  content_type: "text" | "table" | "figure" | "footnote" | string;
  snippet: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError("Can't reach the backend. Is it running?");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

export function fetchDocuments() {
  return request<DocumentInfo[]>("/documents");
}

export function sendChat(docId: string, message: string, history: ChatTurn[]) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc_id: docId, message, history }),
  });
}

type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

interface StreamHandlers {
  onSources: (sources: Source[]) => void;
  onToken: (text: string) => void;
}

/** POST /chat/stream and dispatch its server-sent events. Resolves when the answer is complete. */
export async function streamChat(
  docId: string,
  message: string,
  history: ChatTurn[],
  { onSources, onToken }: StreamHandlers,
) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id: docId, message, history }),
    });
  } catch {
    throw new ApiError("Can't reach the backend. Is it running?");
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Request failed (${res.status})`, res.status);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      if (!raw.startsWith("data: ")) continue;
      const event = JSON.parse(raw.slice(6)) as StreamEvent;
      if (event.type === "sources") onSources(event.sources);
      else if (event.type === "token") onToken(event.text);
      else if (event.type === "error") throw new ApiError(event.message);
      else if (event.type === "done") return;
    }
  }
  throw new ApiError("The connection closed before the answer finished.");
}
