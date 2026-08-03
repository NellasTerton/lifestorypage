"use client";

import { useEffect, useRef, useState } from "react";

export function ShareButton() {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read on the client: the canonical link is whatever host the visitor used.
  useEffect(() => setUrl(window.location.href), []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard can be refused (insecure context, unfocused document).
      // Select the link so the visitor can copy it by hand instead of
      // clicking a button that appears to do nothing.
      setCopied(false);
      inputRef.current?.select();
    }
  }

  return (
    <section
      className="flex flex-col items-center gap-3 rounded-2xl border-2 p-4 shadow-sm sm:flex-row sm:justify-between sm:p-5"
      style={{
        borderColor: "var(--chart-1)",
        backgroundColor: "var(--accent)",
      }}
    >
      <p
        className="text-center text-sm font-medium sm:text-left"
        style={{ color: "var(--accent-foreground)" }}
      >
        Эта история доступна по ссылке — поделитесь ей
      </p>

      <div className="flex w-full max-w-md gap-2 sm:w-auto">
        <input
          ref={inputRef}
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="bg-card min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="bg-primary text-primary-foreground shrink-0 rounded-xl px-5 py-2 font-medium shadow-sm transition-opacity hover:opacity-90"
        >
          {copied ? "Скопировано ✓" : "Поделиться"}
        </button>
      </div>
    </section>
  );
}
