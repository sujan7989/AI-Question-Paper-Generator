# Quizzy AI Paper Forge

An AI-powered academic question paper generator for universities and colleges. Upload your syllabus PDFs, configure your paper structure, and get a professionally formatted question paper in seconds.

🔗 **Live Demo**: [quizzy-ai-paper-forge.vercel.app](https://quizzy-ai-paper-forge.vercel.app)

---

## Features

- **AI Question Generation** — powered by NVIDIA LLaMA 3.1 405B, OpenRouter (Claude, Mistral, Gemma), Google Gemini, and Anthropic Claude
- **PDF Syllabus Upload** — upload unit-wise PDFs; AI reads and generates questions directly from your content
- **Kalasalingam University Format** — generates papers with proper header, registration number box, Part A/B/C structure, choice-enabled sections
- **Bloom's Taxonomy** — questions tagged with cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **Answer Key** — auto-generated answer key alongside the question paper
- **Export Options** — download as PDF or Word document
- **Secure Authentication** — Supabase-based login, signup, OTP verification, password reset
- **Subject Management** — save subjects with unit PDFs and reuse them for future papers
- **Local Fallback** — generates questions without any API key if all providers fail

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Auth & DB | Supabase |
| AI Providers | NVIDIA NIM, OpenRouter, Gemini, Anthropic |
| PDF Processing | PDF.js + custom extractors |
| Deployment | Vercel (serverless functions for API proxying) |

---

## Security

All API keys are stored as **Vercel environment variables** and accessed only through serverless proxy functions (`/api/*.js`). The frontend bundle contains **zero API keys** — nothing is exposed to the browser or visible in source code.

```
Browser → /api/nvidia.js (Vercel) → NVIDIA API
Browser → /api/openrouter.js (Vercel) → OpenRouter API
Browser → /api/gemini.js (Vercel) → Gemini API
Browser → /api/anthropic.js (Vercel) → Anthropic API
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/quizzy-ai-paper-forge.git
cd quizzy-ai-paper-forge
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
VITE_NVIDIA_API_KEY=nvapi-...
VITE_OPENROUTER_API_KEY=sk-or-v1-...
VITE_GEMINI_API_KEY=AIzaSy...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Get keys from:
- NVIDIA: [build.nvidia.com](https://build.nvidia.com)
- OpenRouter: [openrouter.ai/keys](https://openrouter.ai/keys)
- Gemini: [aistudio.google.com](https://aistudio.google.com/app/apikey)
- Anthropic: [console.anthropic.com](https://console.anthropic.com)

### 3. Run

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Deploying to Vercel

```bash
npx vercel --prod
```

Add your API keys in Vercel dashboard → Project Settings → Environment Variables. The serverless proxy functions will pick them up automatically.

---

## How to Use

1. **Sign up / Log in**
2. **Create a subject** — add subject name, code, units, and upload a PDF for each unit
3. **Go to Dashboard** → select your subject → click Generate Paper
4. **Configure the paper** — set total marks, difficulty, parts, AI provider
5. **Generate** — AI reads your PDFs and produces a formatted question paper
6. **Download** as PDF or Word

---

## Project Structure

```
src/
├── components/         # React UI components
│   ├── auth/           # Login, signup, OTP, password reset
│   ├── ui/             # shadcn/ui base components
│   ├── Dashboard.tsx
│   ├── QuestionPaperConfig.tsx
│   ├── QuestionPaperPreview.tsx
│   └── SubjectSetup.tsx
├── lib/
│   ├── ai.ts           # All AI provider calls (via proxies)
│   ├── paper.ts        # HTML paper generation + formatting
│   ├── subject-manager.ts  # Subject/unit/PDF management
│   └── pdf-extractor-real.ts  # PDF text extraction
api/
├── nvidia.js           # NVIDIA NIM proxy
├── openrouter.js       # OpenRouter proxy
├── gemini.js           # Gemini proxy
└── anthropic.js        # Anthropic proxy
```

---

## License

MIT — free to use for educational purposes.
