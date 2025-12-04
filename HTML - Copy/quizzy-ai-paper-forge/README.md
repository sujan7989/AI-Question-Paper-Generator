# 🎓 Quizzy AI Paper Forge

An intelligent question paper generation system for universities and educational institutions.

## 🚀 Features

- **AI-Powered Question Generation**: Uses Gemini AI to generate academic questions
- **PDF Content Analysis**: Extracts content from PDF files and generates relevant questions
- **Multiple Subject Support**: Handles various subjects including:
  - Ethical Hacking & Cybersecurity
  - Physics & Laser Technology
  - Database Management & SQL
  - Programming & Software Development
  - And more...
- **Intelligent Fallback System**: Generates appropriate questions even when PDF extraction fails
- **Professional Question Papers**: Creates well-structured papers with multiple parts (A, B, C)
- **User Authentication**: Secure login system with Supabase
- **Subject Management**: Create and manage subjects with multiple units
- **Question Paper History**: Save and retrieve previously generated papers

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (Authentication + Database + Storage)
- **AI**: Google Gemini AI API
- **PDF Processing**: PDF.js + Extractor API

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Google Gemini API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd "HTML - Copy/quizzy-ai-paper-forge"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Update `.env.local` with your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   VITE_EXTRACTOR_API_KEY=your_extractor_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:8080
   ```

## 📖 Usage

### Creating a Subject

1. Log in to your account
2. Navigate to "Create Subject"
3. Fill in subject details:
   - Subject name
   - Course code
   - Exam type
   - Maximum marks
   - Number of units
4. Upload PDF files for each unit
5. Click "Create Subject"

### Generating Question Papers

1. Select a subject from your list
2. Choose units to include
3. Set weightage for each unit
4. Configure question paper settings:
   - Total marks
   - Difficulty level
   - Question types
5. Click "Generate Question Paper"
6. Review and download the generated paper

## 🎯 How It Works

1. **PDF Upload**: Users upload PDF files containing study material
2. **Content Extraction**: System extracts text from PDFs using multiple methods
3. **AI Analysis**: Gemini AI analyzes the content and identifies key concepts
4. **Question Generation**: AI generates relevant questions based on the content
5. **Paper Formatting**: Questions are formatted into a professional paper structure
6. **Intelligent Fallback**: If PDF extraction fails, system generates questions based on subject context

## 🔐 Security

- Secure authentication with Supabase
- API keys stored in environment variables
- User data isolation
- Secure file storage

## 🤝 Contributing

This is a university project. For any issues or suggestions, please contact the development team.

## 📄 License

This project is developed for educational purposes.

## 👥 Support

For support and queries, please contact your system administrator.

---

**Developed for University Question Paper Generation System**
