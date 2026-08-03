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
    <section className="bg-card rounded-3xl border p-6 text-center shadow-sm sm:p-8">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        Поделиться историей
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Ссылка открывается у любого — регистрация не нужна.
      </p>

      <div className="mx-auto mt-6 flex max-w-lg flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="bg-muted min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="bg-primary text-primary-foreground shrink-0 rounded-xl px-5 py-2.5 font-medium transition-opacity hover:opacity-90"
        >
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </div>
    </section>
  );
}
