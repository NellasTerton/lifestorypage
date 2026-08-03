"use client";

import { useEffect, useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async (e) => {
        // The card is wrapped in a link — copying should not navigate.
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${path}`);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className="text-muted-foreground shrink-0 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--muted)]"
    >
      {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
    </button>
  );
}
