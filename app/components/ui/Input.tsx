"use client";

import {
  TextareaHTMLAttributes,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/app/lib/cn";

interface InputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
  maxHeight?: number;
}

export const Input = forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, maxHeight = 200, value, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    }, [value, maxHeight]);

    return (
      <textarea
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        rows={1}
        value={value}
        className={cn(
          "w-full resize-none bg-transparent text-sm leading-6 text-text-primary placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
