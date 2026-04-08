# QuestionCraft AI — AI-Powered Question Paper Generator

> Final Year Project | B.Tech | Department of Information Technology  
> Kalasalingam Academy of Research and Education (Deemed to be University)

---

## Project Overview

QuestionCraft AI is a full-stack web application that automates the generation of university-standard question papers using Artificial Intelligence. Faculty members (staff) upload their subject PDF materials, and the system extracts real content from those PDFs and generates exam-ready question papers in the official Kalasalingam University format — complete with Bloom's Taxonomy levels, Course Outcomes (CO) mapping, and CO-PO mapping table.

The system supports two roles: **Admin (HOD/COE)** and **Staff (Faculty)**. Admins can monitor all staff activity, manage users, and download performance reports. Staff can create subjects, upload PDFs, generate papers, preview them, edit questions inline, and download as PDF or Word.

---

## Live Demo

**Production URL:** https://quizzy-ai-paper-forge.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI Components | shadcn/ui, Tailwind CSS, Radix UI |
| Backend (Serverless) | Vercel Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Email OTP) |
| AI Providers | Groq (Llama 3.3 70B), NVIDIA NIM (Llama 3.1), OpenRouter |
| PDF Processing | PDF.js (pdfjs-dist v5.4) |
| PDF Export | jsPDF, Browser Print API |
| Word Export | HTML-to-DOC conversion |
| Deployment | Vercel (Frontend + API) |
| Version Control | GitHub |

---

## Key Features

### For Staff
- Upload subject PDFs per unit with weightage configuration
- AI generates questions **strictly from uploaded PDF content** — no generic questions
- Questions follow Bloom's Taxonomy (Remember → Create)
- Official Kalasalingam University paper format with CO mapping
- Inline question editing — edit any question directly in the preview
- Regenerate individual questions or entire parts with one click
- AI-generated Answer Key with model answers
- Download as PDF (print dialog) or Word (.doc)
- Question Bank — save important questions for reuse
- Export/Import question bank as JSON backup
- Paper Stats — Bloom's distribution, CO coverage analysis
- Version History — restore previous question sets
- Exam templates (Sessional I/II, End Semester, Unit Test, Assignment)
- Watermark support (Draft / Confidential)
- Custom paper title
- Duplicate question detection against past papers
- Bloom's balance warning if paper is too easy

### For Admin (HOD/COE)
- Full dashboard with staff activity overview
- Analytics — subject distribution, difficulty heatmap, paper trends
- Staff Activity Report — papers generated per staff, last activity date
- Download individual staff paper reports as PDF
- Send password reset email to any staff member directly
- User Management — add/remove staff accounts
- Monthly performance report download
- View all papers across all staff

### System
- Dark/Light theme toggle
- Mobile responsive design
- Notification bell with real-time alerts
- Confetti animation on paper generation
- Customizable dashboard widget order
- Skeleton loading states

---

## Architecture

```
Browser (React + TypeScript)
        │
        ▼
Vercel CDN (Static Frontend)
        │
        ├── /api/groq        → Groq API proxy (Llama 3.3 70B)
        ├── /api/nvidia      → NVIDIA NIM proxy (Llama 3.1)
        ├── /api/openrouter  → OpenRouter proxy
        ├── /api/gemini      → Google Gemini proxy
        └── /api/anthropic   → Anthropic Claude proxy
                │
                ▼
        Supabase (PostgreSQL)
        ├── subjects table
        ├── units table (with extracted_content JSONB)
        ├── question_papers table
        ├── profiles table
        └── Storage (syllabus-files bucket)
```

---

## How It Works (Flow)

1. **Staff registers** → Email OTP verification → Profile setup
2. **Subject Setup** → Enter subject name, course code, exam type, max marks, number of units
3. **PDF Upload** → Upload PDF per unit → PDF.js extracts real text content → Stored in Supabase
4. **Generate Paper** → Select subject, configure parts (Part A/B/C), set marks, difficulty, weightage
5. **AI Generation** → Extracted PDF content sent to Groq/NVIDIA → AI generates questions strictly from PDF
6. **Paper Formatting** → Questions parsed → Formatted into Kalasalingam University official HTML format
7. **Preview & Edit** → Staff previews paper, edits questions inline, regenerates parts if needed
8. **Download** → Print as PDF or export as Word document
9. **Admin Monitoring** → Admin views all staff activity, downloads reports, manages users

---

## AI Provider Strategy

The system uses a **waterfall fallback** approach:
1. **Groq (Primary)** — Llama 3.3 70B, fastest (1-2s), free tier, 14,400 req/day
2. **NVIDIA NIM (Fallback)** — Llama 3.1 8B via proxy, reliable backup
3. All API keys are stored as **server-side environment variables** in Vercel — never exposed to the browser

---

## Security

- All AI API keys stored in Vercel environment variables (server-side only)
- API proxy pattern — browser never directly calls AI APIs
- Supabase Row Level Security (RLS) — users can only access their own data
- Email OTP verification for all new accounts
- CORS restricted to production domain only

---

## Project Structure

```
src/
├── components/
│   ├── auth/           # Login, SignUp, OTP, ForgotPassword
│   ├── ui/             # shadcn/ui components
│   ├── Dashboard.tsx   # Main dashboard with navigation
│   ├── SubjectSetup.tsx        # PDF upload & subject creation
│   ├── QuestionPaperConfig.tsx # Paper configuration & generation
│   ├── QuestionPaperPreview.tsx # Preview, edit, download
│   ├── Analytics.tsx   # Admin analytics & reports
│   ├── QuestionBank.tsx # Saved questions
│   └── ProfilePage.tsx # User profile management
├── lib/
│   ├── ai.ts           # AI provider calls (Groq, NVIDIA, OpenRouter)
│   ├── paper.ts        # Paper formatting, PDF/Word export
│   ├── subject-manager.ts # PDF content extraction, prompt building
│   ├── pdf-extractor-real.ts  # PDF.js text extraction
│   ├── pdf-processor.ts       # PDF processing utilities
│   └── evaluator.ts    # AI-based question quality evaluation
├── contexts/
│   └── AuthContext.tsx # Authentication state management
└── integrations/
    └── supabase/       # Supabase client & types

api/
├── groq.js      # Groq API serverless proxy
├── nvidia.js    # NVIDIA NIM serverless proxy
├── openrouter.js # OpenRouter serverless proxy
├── gemini.js    # Google Gemini serverless proxy
├── anthropic.js # Anthropic Claude serverless proxy
└── _cors.js     # Shared CORS configuration
```

---

## Setup & Installation

```bash
# Clone the repository
git clone https://github.com/sujan7989/AI-Question-Paper-Generator.git
cd quizzy-ai-paper-forge

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your API keys in .env.local
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_GROQ_API_KEY=your_groq_key
# VITE_NVIDIA_API_KEY=your_nvidia_key

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Team

- **Developer:** Sujan Kumar Reddy
- **Institution:** Kalasalingam Academy of Research and Education
- **Department:** Information Technology
- **Academic Year:** 2024-2025

---

## References

- [Groq API Documentation](https://console.groq.com/docs)
- [NVIDIA NIM API](https://build.nvidia.com)
- [Supabase Documentation](https://supabase.com/docs)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [React Documentation](https://react.dev)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
