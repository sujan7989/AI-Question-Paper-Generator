# Quizzy AI Paper Forge

**An advanced AI-powered question paper generation system for educational institutions**

## Key Features

- **Multiple AI Providers**: 
  - **OpenRouter** (Claude 3.5 Haiku) - Primary choice
  - **NVIDIA Meta LLaMA 3.1 405B** - Most powerful model
  - **NVIDIA Qwen** - Content analysis specialist
  - **Google Gemini** - Reliable backup
  - **Local Generation** - Works without any API keys

- **Advanced PDF Processing**:
  - Multiple extraction engines (PDF.js, pdf-parse, fallbacks)
  - Content sanitization and analysis
  - Key term extraction from PDFs
  - Intelligent content understanding

- **Professional Question Paper Generation**:
  - Bloom's taxonomy integration
  - Multiple question types (Short, Medium, Long)
  - Customizable difficulty levels
  - Subject-specific formatting
  - Weightage distribution per unit

- **Secure Authentication**:
  - Supabase integration
  - User management system
  - Secure session handling
  - Password reset functionality

- **Comprehensive Subject Management**:
  - Multi-unit support
  - PDF file organization
  - Subject metadata tracking
  - Question paper history

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (Auth + Database + Storage)
- **AI Services**: 
  - OpenRouter API (Multiple models)
  - NVIDIA NIM API (Meta LLaMA 405B)
  - Google Gemini API
  - Local generation fallback
- **PDF Processing**: PDF.js + pdf-parse + Custom extractors
- **State Management**: React Query + Context API

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Modern web browser
- AI API keys (optional - local generation available)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/quizzy-ai-paper-forge.git
cd quizzy-ai-paper-forge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` file with your API keys:

```env
# Primary AI Provider (Get from: https://openrouter.ai/keys)
VITE_OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here

# NVIDIA Meta LLaMA 405B (Get from: https://build.nvidia.com/)
VITE_NVIDIA_API_KEY=nvapi-your_nvidia_key_here

# Google Gemini (Get from: https://makersuite.google.com/app/apikey)
VITE_GEMINI_API_KEY=AIzaSy-your_gemini_key_here

# Supabase (Already configured)
VITE_SUPABASE_URL=https://tctwiubpfaeskbuqpjfw.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_key_here
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access Application
Open your browser and navigate to:
```
http://localhost:8080
```

## Usage Guide

### Creating a Subject
1. **Sign Up/Login** to your account
2. Click **"Create Subject"** from dashboard
3. **Fill subject details**:
   - Subject name and code
   - Exam type and duration
   - Maximum marks and passing criteria
   - Number of units/topics
4. **Upload PDF files** for each unit
5. **Configure weightage** for each unit
6. **Save subject** to your library

### Generating Question Papers
1. **Select subject** from your dashboard
2. **Choose units** to include in the paper
3. **Set weightage** distribution
4. **Configure paper settings**:
   - Total marks and duration
   - Difficulty level (Easy/Medium/Hard)
   - Question parts and distribution
   - AI provider preference
5. **Click "Generate Paper"**
6. **Review and download** the generated question paper

### AI Provider Options
- **OpenRouter**: Best overall performance with Claude 3.5 Haiku
- **NVIDIA Meta LLaMA 405B**: Most powerful model for complex content
- **Local Generation**: No API required, works offline

## How It Works

### 1. PDF Content Analysis
- **Multi-engine extraction** for maximum compatibility
- **Content sanitization** and cleaning
- **Key term identification** and concept extraction
- **Semantic analysis** for understanding context

### 2. AI-Powered Generation
- **Content analysis** using advanced AI models
- **Question crafting** based on Bloom's taxonomy
- **Difficulty calibration** for academic standards
- **Contextual relevance** to uploaded material

### 3. Professional Formatting
- **Structured paper layout** with proper headings
- **Mark distribution** across different sections
- **Academic formatting** standards
- **Export options** (PDF, Word, Text)

### 4. Intelligent Fallback
- **Local generation** when APIs fail
- **Template-based questions** for emergency use
- **Graceful degradation** for reliability

## Security Features

- **Secure Authentication**: Supabase-based user management
- **API Key Protection**: Environment variables only
- **Data Isolation**: User data separation
- **Secure Storage**: Encrypted file handling
- **No API Exposure**: Keys hidden from version control

## Deployment Options

### GitHub Pages (Free)
- **Local Generation** mode works without APIs
- **Static deployment** with GitHub Pages
- **No server costs** or maintenance

### Private Server (Full Features)
- **All AI providers** available
- **Custom domain** and branding
- **Enhanced security** and control

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │   Supabase     │    │   AI Services  │
│   (React)      │◄──►│   (Backend)     │◄──►│   (Multiple)    │
│                │    │                │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PDF Upload   │    │   Database     │    │   Question     │
│   & Processing │    │   & Storage    │    │   Generation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Performance Features

- **Fast Processing**: Optimized PDF extraction
- **High Accuracy**: Advanced AI models
- **Reliable Fallbacks**: Multiple backup systems
- **Responsive Design**: Works on all devices
- **Offline Capability**: Local generation option

## Academic Standards

- **Bloom's Taxonomy**: Remember, Understand, Apply, Analyze, Evaluate, Create
- **Question Types**: Multiple choice, short answer, essay, problem-solving
- **Difficulty Levels**: Easy, Medium, Hard with appropriate complexity
- **Mark Distribution**: Fair weightage across topics and difficulty

## Contributing

This is an educational project. For contributions:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is developed for educational purposes under the MIT License.

## Support

For technical support and queries:
- **Documentation**: Check this README and inline guides
- **Issues**: Report via GitHub Issues
- **Community**: Join our development discussions

---

## **Project Status: Production Ready** 

**Quizzy AI Paper Forge** is fully functional and ready for educational institution deployment with:
- **Multiple AI providers** with fallback systems
- **Secure authentication** and data management
- **Professional question generation** with academic standards
- **PDF processing** with multiple extraction methods
- **Production-ready build** with no critical issues

**Perfect for universities, colleges, and educational institutions!** 

---

*Developed with  for educational excellence*
