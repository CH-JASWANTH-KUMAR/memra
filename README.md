# Memra

**Memories deserve better than a text file.**

Memra is a privacy-first web application that transforms WhatsApp and iMessage chat exports into a cinematic memory archive. Every chapter, every insight, every flag — generated entirely on your device. Your conversations never leave your browser.

---

## What Memra Does

You export a WhatsApp chat. You get a disgusting `.txt` file with thousands of lines of raw timestamps and text. No story. No emotion. No memory.

Memra takes that file and turns it into something worth keeping.

---

## Features

### Timeline Movie
Five cinematic chapters extracted from your conversation. Each chapter is a key moment — selected by a multi-pass intelligence engine that filters out AI content, code, assignments, and logistical messages before choosing what actually matters. Each moment gets a 4-sentence documentary-style narrative written by Llama 3.3 70B via Groq. Navigate with keyboard arrows or chapter dots.

### Human Authenticity Filter
A weighted scoring engine that classifies every message before any analysis runs. Detects and excludes AI-generated responses, ChatGPT outputs, code snippets, assignment solutions, forwarded content, announcements, and resource dumps. Only genuine human conversation participates in memory generation. Supports English, Hinglish, Teluglish, and Tanglish.

### Flag Analysis
Behavioral pattern detection using semantic intent classification — not keyword matching. Detects care signals, emotional support, reciprocity, celebration, and friction patterns with actual message evidence. Green flags show detection count and confidence score. Red flags show data-driven metrics like silence duration and initiation imbalance.

### Text DNA
Each sender is scored across five communication axes — initiation rate, emotional vocabulary density, response consistency, question frequency, and affirmation frequency — and mapped to one of nine conversational archetypes: Organizer, Listener, Motivator, Planner, Problem Solver, Caregiver, Reassurer, Initiator, or Comedian.

### Compatibility Score
A weighted score across five relationship dimensions — communication balance, initiation equity, emotional availability, response consistency, and depth progression. Clamped between 30 and 95 to prevent unrealistic outputs. Includes an analyst note diagnosing the weakest axis.

### Relationship Journey
A pure SVG line chart of weekly message frequency with gradient fill, month labels, and three stat cards showing most active week, longest silence, and conversation trend direction.

### Chat Explorer
The full conversation rendered as premium chat bubbles. Highlight pills appear above messages that triggered chapters or flags. Real-time debounced search. Deterministic sampling for archives over 3,000 messages prioritising significant messages. Scroll-to-top button. Auto-scrolls to first chapter message on open.

### Relationship Soundtrack
Five curated tracks selected using relationship profile and emotional pattern data. Each track links directly to Spotify search. Context note ties each song to a specific moment in your archive.

### Memra Wrap
A Spotify Wrapped-style animated slideshow — eight slides covering message counts, peak hours, silence gaps, archetypes, compatibility, and your best green flag moment. Share any slide as a PNG. Numbers count up with animation.

### Memory Book PDF
An 11-page premium PDF compiled entirely client-side using jsPDF. Cover page, five chapter pages with left border rail and Roman numeral watermarks, analytics page, flags audit, archetype cards, relationship evolution timeline, soundtrack page, and closing page with QR code. Triggered by Razorpay payment at ₹199.

---

## Privacy Architecture

This is the most important part of the product.

```
Your Device (Browser)
        │
        ▼
┌─────────────────────────────┐
│   chatParser.ts             │  ← File never leaves browser
│   authenticityFilter.ts     │  ← All classification local
│   flagDetector.ts           │  ← All detection local
│   textDNA.ts                │  ← All scoring local
│   compatibility.ts          │  ← All calculation local
│   moments.ts                │  ← Moment extraction local
└──────────────┬──────────────┘
               │
               │  Only 5 anonymized moment signals transmitted
               │  (date, title, sender name, quote, context)
               │  Raw messages never transmitted
               ▼
┌─────────────────────────────┐
│   /api/narrative            │  ← Next.js API Route
│   Groq Llama 3.3 70B        │  ← Narrative generation only
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   pdfGenerator.ts           │  ← PDF compiled on device
│   captureElement.ts         │  ← PNG export on device
│   localStorage              │  ← Archive cached on device
└─────────────────────────────┘
```

**What we never see:** Your raw messages. Ever. The only data that leaves your device is five anonymized moment objects containing a date, a chapter title, a sender name, a quote under 150 characters, and two surrounding messages for context. No conversation content is stored on any server. No database exists. No authentication required.

---

## Intelligence Pipeline

Every message passes through this pipeline in strict order before any analysis runs:

```
Raw Message
    ↓
Human Authenticity Filter     ← Weighted scoring: 0-100
    ↓
Message Classification        ← HUMAN / AI / CODE / FORWARDED / etc.
    ↓
Intent Detection              ← CARE / SUPPORT / CELEBRATION / etc.
    ↓
Relationship Detection        ← Blended profile scoring
    ↓
Moment Scoring                ← Multi-pass with emotional tiebreaker
    ↓
Narrative Generation          ← Groq Llama 3.3 70B
```

Only `HUMAN_CONVERSATION` classified messages participate in flag detection, moment extraction, archetype analysis, compatibility scoring, quote selection, and narrative generation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Narrative AI | Groq — Llama 3.3 70B Versatile |
| PDF Generation | jsPDF (client-side) |
| PNG Export | html2canvas with oklch/lab sanitizer |
| Payment | Razorpay |
| Fonts | Cormorant Garamond, Instrument Mono |
| State | React Context + localStorage |
| Deployment | Vercel |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── narrative/
│   │       └── route.ts          # Groq API integration + fallback generator
│   ├── archive/
│   │   └── page.tsx              # Main archive dashboard (6 tabs + Wrap)
│   ├── privacy/
│   │   └── page.tsx              # Plain-English privacy policy
│   ├── how-it-works/
│   │   └── page.tsx              # Technical explainer
│   ├── layout.tsx                # Root layout with ErrorBoundary
│   ├── page.tsx                  # Landing + upload
│   └── globals.css
├── components/
│   └── ErrorBoundary.tsx         # React class error boundary
├── context/
│   └── ChatContext.tsx           # Global state + localStorage persistence
├── utils/
│   ├── authenticityFilter.ts     # Human Authenticity Engine
│   ├── chatParser.ts             # WhatsApp + iMessage parser
│   ├── compatibility.ts          # 5-axis compatibility calculator
│   ├── flagDetector.ts           # Behavioral flag detection
│   ├── moments.ts                # Cinematic moment extraction
│   ├── pipeline.ts               # Orchestration layer
│   ├── textDNA.ts                # Archetype + axis scoring
│   ├── pdfGenerator.ts           # 11-page PDF compiler
│   └── captureElement.ts         # Shared PNG export utility
└── config/
    ├── flags.json                # Weighted flag ruleset
    └── soundtrack.json           # Relationship-aware playlists
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Groq API key — free at [console.groq.com](https://console.groq.com)
- A Razorpay account for payment integration — [razorpay.com](https://razorpay.com)

### Installation

```bash
git clone https://github.com/yourusername/memra.git
cd memra
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

The app works without a Groq API key — a deterministic fallback narrative generator runs locally. But the Groq-powered narratives are significantly better.

Razorpay keys are configured directly in `archive/page.tsx`. Replace `rzp_test_mockkeyhere` with your actual test or live key.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Click **Try with Sample Chat** to test the full pipeline without uploading a real file.

### Production Build

```bash
npm run build
npm start
```

---

## Testing the Product

**Testing the parser:**
Upload any WhatsApp `.txt` export. To export from WhatsApp: open a chat → tap the contact name → Export Chat → Without Media → save the `.txt` file.

**Testing the PDF:**
Click Book Memoir → Test Bypass: Simulate Success. This skips Razorpay and generates the PDF immediately.

**Testing the authenticity filter:**
Upload a chat that contains ChatGPT outputs or code snippets. Confirm they do not appear in chapters or flags.

**Sample chat for testing:**
A sample chat file is bundled in `/public/sample_chat.txt` and loads automatically when you click Try with Sample Chat.

---

## Deployment

Memra deploys to Vercel in one command.

```bash
vercel
```

Add your environment variable in the Vercel dashboard:

```
GROQ_API_KEY → your_groq_api_key_here
```

Vercel handles the Next.js API route for narrative generation automatically. No separate server needed.

---

## Engineering Notes

**Why no database:**
Memra was designed from day one with zero server-side storage. The product works entirely on the constraint that we never see user data. This is not a privacy policy promise — it is an architectural fact. There is no database to breach.

**Why Groq over OpenAI:**
Groq's inference speed on Llama 3.3 70B is significantly faster than GPT-4o for our use case — under 3 seconds for five narrative paragraphs. The free tier covers 14,400 requests per day which is sufficient for early-stage traffic. The API call structure is identical to OpenAI so switching is one-line if needed.

**Why jsPDF over server-side PDF:**
Generating the PDF client-side means no file is ever transmitted to a server. It also eliminates server costs and scaling concerns entirely. The tradeoff is limited font rendering — we use Courier as the monospace fallback and rely on Cormorant Garamond loading from Google Fonts CDN before capture.

**The html2canvas oklch problem:**
Tailwind CSS v4 uses modern CSS color functions like `oklch()` and `lab()` which html2canvas does not support. We solved this by building a recursive DOM walker in `captureElement.ts` that replaces every unsupported computed color value with a flat hex equivalent on the cloned element before canvas capture.

**localStorage hydration:**
Parsed archives are cached to localStorage under `memra_archive_v1` after every successful processing. On archive page mount, we check for this cache before triggering a home redirect. This means refreshing the archive page never loses the user's session. Raw chat text is never cached — only processed output.

---

## Roadmap

- [ ] Physical print-on-demand Memory Book via Zoomin/Printo integration
- [ ] Anniversary detection — surface "one year ago today" moments
- [ ] Multi-language narrative generation
- [ ] Telegram export support
- [ ] Relationship health score trend over time
- [ ] Mobile app (React Native)

---

## License

MIT

---

## Author

Built by [Jaswanth](https://github.com/yourusername) — third-year CSE student at GITAM University.

*"Memories deserve better than a text file."*
