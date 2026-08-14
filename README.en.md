<div align="center">

# 💌 Lifestorypage

**A chat export becomes a verified story — dates, quotes, and stats you can actually trust**

Every claim on the page passes an independent model check. If it can't be traced to the source text, it doesn't get shown.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Claude](https://img.shields.io/badge/Claude-Opus_5-D97757?logo=anthropic&logoColor=white)](https://claude.com)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)](https://neon.tech)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?logo=vercel&logoColor=white)](https://vercel.com)

[**🔗 Live demo**](https://lifestorypage.vercel.app) · [**Русский**](./README.md)

</div>

---

## 📖 About

Everyone has a chat history they'd hate to lose and will never scroll back through — thousands of messages sitting in a Telegram archive nobody revisits. Lifestorypage turns that export into a finished story page: how many days you've been talking, which moments were turning points, who said what first, what you talked about most — and when.

The difference from a typical "write us something romantic" generator is that **nothing here is invented**. Every key moment is a claim tied to a specific message and backed by a verbatim quote. Before it reaches the page, each claim goes through a separate, independent judge pass that checks it against the source text. Fails the check, it doesn't get shown.

---

## ✨ Features

| | Feature | Detail |
|---|---|---|
| 📊 | **Stats as sentences** | "You've been talking for 709 days. In that time — 600 messages and 44 photos" — instead of bare numbers |
| ✅ | **Verified moments** | Turning points and "firsts" — each with a date and an exact quote from the chat |
| 🌙 | **Biorhythm** | An hour-of-day heatmap and a takeaway like "you're night owls" |
| ☁️ | **Word cloud** | Most frequent words with light stemming and a curated filter — no "hi/bye/anyway" noise |
| 💬 | **Frequent phrases** | What you repeated to each other most, scored by n-gram |
| 📅 | **Weekday activity** | Which days of the week you messaged most |
| 🔗 | **Public link** | The story opens for anyone — no signup, no login |

---

## 📸 Screenshots

<table>
<tr>
<td width="50%">

**Landing page**

<img src="docs/media/01-landing.png" alt="Landing page with a live product preview" width="100%">

</td>
<td width="50%">

**Story page**

<img src="docs/media/02-story.png" alt="Story page with stats and moments" width="100%">

</td>
</tr>
<tr>
<td width="50%">

**Verified moment**

<img src="docs/media/03-moment.png" alt="A moment card with quote and date" width="100%">

</td>
<td width="50%">

**Biorhythm and word cloud**

<img src="docs/media/04-biorhythm.png" alt="Hour-of-day heatmap and word cloud" width="100%">

</td>
</tr>
</table>

---

## 🏗 Architecture

```mermaid
flowchart TB
    U["User"] -->|"chat export, JSON"| ACTION["uploadChat()<br/>Server Action"]
    ACTION --> PARSE["parseChat()<br/>shape validation"]

    subgraph DETPATH["Deterministic pass — free, no LLM"]
        DET["computedSections()"]
        STATS["totalStats · topWords<br/>weekdayActivity · hourActivity<br/>frequentPhrases"]
        DET --> STATS
    end

    subgraph LLMPATH["LLM pass — extraction and verification"]
        CHUNK["chunkMessages()<br/>120-message chunks"]
        EXTRACT["extractFromChunk()<br/>Claude Opus 5, structured output"]
        DEDUPE["dedupeFirsts()"]
        VERIFY["verifyBatch()<br/>Claude Opus 5, judge, 10 claims at a time"]
        CHUNK --> EXTRACT --> DEDUPE --> VERIFY
    end

    PARSE --> DET
    PARSE --> CHUNK
    STATS --> DB[("Neon Postgres<br/>sections")]
    VERIFY -->|"verified / flagged"| DB
    DB --> PAGE["/story/[id]<br/>renders verified only"]
```

Deterministic sections are written to the database first, right away — if the LLM pass fails on message 600, the story still exists with real stats instead of disappearing entirely.

---

## 🔍 How claims get verified

This is the actual engineering problem the project solves: not "generate something nice," but don't let the model invent anything.

**1. Extraction.** The chat is chunked into 120-message pieces. For each chunk, Claude Opus 5 pulls 5–7 `key_moments` and every `first` — as structured output through a Zod schema, not by parsing free text:

```ts
const ClaimSchema = z.object({
  claim: z.string(),
  source_message_ids: z.array(z.number()),
  source_quote: z.string(), // verbatim quote, no paraphrasing
});
```

The system prompt explicitly forbids generalizing: "An empty array beats an invented claim."

**2. Deduping "firsts."** The same topic ("first mention of moving in together") can surface across several adjacent chunks, since chunk context overlaps. `dedupeFirsts()` groups claims by their opening words and keeps only the earliest mention of each topic.

**3. Verification — as a separate call.** A model that isn't "telling the story" is handed a claim, its quote, and the full text of the source messages, and asked to answer two questions independently: `supported` (does the claim actually follow from the text?) and `quote_is_verbatim` (is the quote exact?). Only `true` on both counts becomes `verified`. A claim the model skips in its response is never silently promoted to verified — it defaults to `flagged`.

Before spending an API call, a cheap non-LLM check filters out claims citing message ids that don't exist in the corpus — a hallucination on its face that needs no model call to catch.

**4. Batched, not one at a time.** Verification runs in batches of 10 claims — otherwise a 600-message chat blows past Vercel's serverless function timeout. But batching makes the model noticeably more lenient, so this pass runs at effort "medium" instead of "low": batching buys back the round-trips, and the higher effort buys back the rigor batching cost.

> **Result:** unverified claims simply never reach the page — `getStoryPageData()` only returns sections with status `verified`.

---

## 💡 Other decisions

<details>
<summary><b>A hand-rolled HMAC session instead of a JWT library</b></summary>

<br>

The session cookie stores `userId.signature`, where the signature is an HMAC-SHA256 of the user id under a server secret, checked with `timingSafeEqual`. Without the signature, anyone could just set `session=2` and read someone else's dashboard. The actual question — "can this id be trusted?" — doesn't need JWT's expiry claims and headers; a bare HMAC is enough, and it's small enough to audit in one read.

</details>

<details>
<summary><b>Word cloud: prefix stemming plus a curated stopword list</b></summary>

<br>

Words are grouped by their first 5 characters (Russian inflections of the same word collapse into one group), and the group is labeled with whichever surface form appeared most often. The stopword list was built by hand, iteratively: not just conjunctions and prepositions, but the conversational filler that tops any chat's word list regardless of topic — "hi," "bye," "anyway," "by the way."

</details>

<details>
<summary><b>Biorhythm — a deliberate heuristic, not a measured threshold</b></summary>

<br>

"Night owls" is defined as ≥15% of messages landing in the 01:00–04:00 window. A uniform distribution over a 4-hour window would already land around ~17%, so 15% is a real skew for a 24-hour day. The threshold is chosen, not derived statistically, and the code says so directly in a comment — so a future reader doesn't mistake it for a measured value.

</details>

<details>
<summary><b>A mechanical quote check in the admin panel — a second, independent layer</b></summary>

<br>

Beyond the LLM judge, there's a second, fully non-linguistic check: `quoteMatches()` normalizes quotes/dashes/case and simply looks for the quote as a substring of the original chat text. This kind of check can't fail the way a model can — the substring either exists or it doesn't.

</details>

---

## 🛠 Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| **AI** | Claude Opus 5 (`@anthropic-ai/sdk`) — structured extraction and independent fact verification |
| **Database** | Neon Postgres (serverless) + Drizzle ORM |
| **Auth** | bcrypt + a hand-rolled HMAC-signed session cookie |
| **Hosting** | Vercel |

---

## 📁 Structure

```
src/
├── app/
│   ├── page.tsx                # Landing page
│   ├── login/, register/       # Auth
│   ├── dashboard/upload/       # Chat export upload form
│   ├── admin/                  # Manual section review + quote_match
│   ├── story/[id]/page.tsx     # Public story page
│   └── actions/
│       ├── auth.ts
│       └── story.ts            # uploadChat() Server Action
├── components/
│   ├── story/                  # stats-header, phrase-card, biorhythm-card…
│   └── ui/                     # shadcn/ui
├── lib/
│   ├── auth.ts                 # HMAC sessions
│   ├── db.ts                   # Neon + Drizzle client
│   ├── story.ts                # Data formatting for the story page
│   ├── quote-check.ts          # Mechanical quote verification
│   └── pipeline/
│       ├── chat.ts             # Export parsing and chunking
│       ├── stats.ts            # Deterministic statistics
│       ├── extract.ts          # ⭐ Claim extraction (Claude)
│       ├── verify.ts           # ⭐ Independent verification (Claude)
│       ├── process.ts          # Orchestrates both passes
│       └── claude.ts           # Client + mapLimit()
└── db/schema.ts                # users · stories · sections

scripts/pipeline/
├── run.ts                      # Full pipeline CLI run
├── backfill.ts                 # Backfill fields with no LLM calls
└── timing.ts
```

---

## 🚀 Running locally

**Requires:** Node.js 20+, a [Neon](https://neon.tech) project (or any Postgres), an [Anthropic](https://console.anthropic.com) API key.

### 1. Install

```bash
git clone https://github.com/NellasTerton/lifestorypage.git
cd lifestorypage
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
ANTHROPIC_API_KEY=sk-ant-api03-...
SESSION_SECRET=any_random_string
```

### 3. Migrations

```bash
npm run db:migrate
```

### 4. Start

```bash
npm run dev
```

The app runs at [localhost:3000](http://localhost:3000).

### 5. Parse a chat export directly through the pipeline (optional)

```bash
npm run pipeline synthetic-chat.json
```

Runs every stage — parsing, deterministic stats, Claude extraction and verification — and prints progress for each, bypassing the web form.

---

## ⚠️ Demo limitations

- The export format is a custom JSON shape (`type`, `id`, `date`, `text`, `from`); parsing a native Telegram Desktop export is the next step.
- Source text is stored as one normalized string per story (for mechanical quote checking), not split by message — so later-added computed fields (like hourly activity) can't be backfilled for stories uploaded before that field existed.
- The account and upload flow sit behind plain email/password auth, with no password reset or email verification yet.

---

## 🗺 What's next

- [ ] Rank moments by significance instead of a flat feed — top moments get featured treatment, the rest collapses
- [ ] Native Telegram Desktop export parsing
- [ ] Password reset and email verification
- [ ] Shared stories across two accounts

---

<div align="center">

Built with [Claude Code](https://claude.com/claude-code) · [Русская версия](./README.md)

</div>
