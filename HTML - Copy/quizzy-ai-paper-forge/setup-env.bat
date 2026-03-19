@echo off
echo Creating .env.local file with your API keys...
echo.

echo # Quizzy AI Paper Forge - Local Environment Variables > .env.local
echo # This file contains your actual API keys for local development >> .env.local
echo # This file is ignored by Git and won't be pushed to GitHub >> .env.local
echo. >> .env.local
echo # PRIMARY AI PROVIDER - OpenRouter (Claude 3.5 Haiku) >> .env.local
echo VITE_OPENROUTER_API_KEY=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 >> .env.local
echo. >> .env.local
echo # NVIDIA Meta LLaMA 3.1 405B - Most Powerful Model >> .env.local
echo VITE_NVIDIA_API_KEY=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 >> .env.local
echo. >> .env.local
echo # Google Gemini AI - Backup Provider >> .env.local
echo VITE_GEMINI_API_KEY=AIzaSyBpejf1OkN80FDwmq42Rv80XurIQmtfcTA >> .env.local
echo. >> .env.local
echo # Supabase Configuration (Already configured) >> .env.local
echo VITE_SUPABASE_URL=https://tctwiubpfaeskbuqpjfw.supabase.co >> .env.local
echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdHdpdWJwZmFlc2tidXFwamZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzU2ODQsImV4cCI6MjA2NzkxMTY4NH0.4NBtScrpz9V9RpNb9BVwyfk-ZkQEPV7OEDOjHGd9e-Y >> .env.local
echo. >> .env.local
echo # Application Configuration >> .env.local
echo VITE_APP_URL=http://localhost:8080 >> .env.local

echo.
echo ✅ .env.local file created successfully!
echo 📁 File location: .env.local
echo 🔒 This file is ignored by Git and won't be pushed to GitHub
echo.
echo 🚀 Now run: npm run dev
echo 🌐 Then visit: http://localhost:8080
echo.
pause
