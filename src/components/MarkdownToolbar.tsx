"use client";

import { useRef } from "react";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function MarkdownToolbar({ textareaRef }: MarkdownToolbarProps) {
  const apply = (before: string, after: string, block = false) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);
    const placeholder = block ? "code" : "text";
    const replacement = before + (selected || placeholder) + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);

    // Trigger React state update via native setter
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    )?.set;
    setter?.call(ta, newValue);
    ta.dispatchEvent(new Event("input", { bubbles: true }));

    ta.focus();
    const selStart = start + before.length;
    const selEnd = selStart + (selected || placeholder).length;
    ta.setSelectionRange(selStart, selEnd);
  };

  const insertPrefix = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const text = ta.value;
    const before = text.substring(0, start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insertion = (needsNewline ? "\n" : "") + prefix;
    const newValue = text.substring(0, start) + insertion + text.substring(start);

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    )?.set;
    setter?.call(ta, newValue);
    ta.dispatchEvent(new Event("input", { bubbles: true }));

    ta.focus();
    ta.setSelectionRange(start + insertion.length, start + insertion.length);
  };

  const btnClass = "px-1.5 py-0.5 text-[10px] font-mono text-aluminum/50 hover:text-signal-orange hover:bg-ink/[0.06] transition-colors rounded";

  return (
    <div className="flex items-center gap-0.5 py-1 border-b border-ink/[0.06] mb-1">
      <button type="button" onClick={() => apply("**", "**")} title="Bold" className={btnClass}>
        <span className="font-bold">B</span>
      </button>
      <button type="button" onClick={() => apply("*", "*")} title="Italic" className={btnClass}>
        <span className="italic">I</span>
      </button>
      <button type="button" onClick={() => apply("`", "`")} title="Inline code" className={btnClass}>
        {"</>"}
      </button>
      <button type="button" onClick={() => apply("[", "](url)")} title="Link" className={btnClass}>
        Link
      </button>
      <button type="button" onClick={() => insertPrefix("- ")} title="Bullet list" className={btnClass}>
        List
      </button>
      <button type="button" onClick={() => apply("```\n", "\n```", true)} title="Code block" className={btnClass}>
        {"```"}
      </button>
      <span className="ml-auto text-[9px] font-mono text-aluminum/25">
        Markdown supported
      </span>
    </div>
  );
}
