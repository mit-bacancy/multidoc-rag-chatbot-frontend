"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { SendIcon } from "@/app/components/icons";
import { Message } from "@/app/components/Message";
import type { Source } from "@/app/lib/api";

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  error?: boolean;
  streaming?: boolean;
}

interface ChatPanelProps {
  messages: ChatEntry[];
  busy: boolean; // request in flight: input stays locked until the answer finishes
  disabled: boolean;
  placeholder: string;
  emptyState: React.ReactNode;
  onSend: (text: string) => void;
}

export function ChatPanel({
  messages,
  busy,
  disabled,
  placeholder,
  emptyState,
  onSend,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const canSend = !disabled && !busy && input.trim().length > 0;
  // Show the indicator until the first streamed token creates the answer
  const thinking = busy && !messages.at(-1)?.streaming;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function send() {
    if (!canSend) return;
    onSend(input.trim());
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {messages.length === 0 && !thinking && emptyState}
          {messages.map((m) => (
            <Message
              key={m.id}
              role={m.role}
              content={m.content}
              sources={m.sources}
              error={m.error}
            />
          ))}
          {thinking && <Message role="assistant" content="" pending />}
        </div>
      </div>

      <div className="border-t border-border px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex w-full items-end gap-2 rounded-3xl border border-border bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent/50">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className="max-h-48 py-1"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              aria-label="Send message"
              disabled={!canSend}
              onClick={send}
              className="h-9 w-9 rounded-full p-0"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-text-muted">
            Answers come only from the selected report. Check the cited pages.
          </p>
        </div>
      </div>
    </div>
  );
}
