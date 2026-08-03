import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5";

let cached: Anthropic | null = null;

/**
 * Lazily constructed: the SDK throws at construction when no key is present,
 * which would break `next build` on a machine that only serves public pages.
 */
export function getClaude(): Anthropic {
  if (!cached) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    cached = new Anthropic();
  }
  return cached;
}

/** Runs tasks with bounded concurrency, preserving input order in the result. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}
