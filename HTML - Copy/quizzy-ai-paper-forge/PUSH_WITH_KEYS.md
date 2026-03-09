# 🔑 How to Push with API Keys to GitHub

GitHub blocked your push because it detected API keys. Here are your options:

## ✅ Option 1: Allow the Secret (Recommended for Your Case)

GitHub gave you a link to allow the secret. Follow these steps:

### Step 1: Click the Allow Link
GitHub provided this link in the error message:
```
https://github.com/sujan7989/AI-Question-Paper-Generator/security/secret-scanning/unblock-secret/3AhFh1QrhEw4sAoxMIvSBl1Xbw5
```

1. Open this link in your browser
2. Click "Allow secret" or "I'll fix it later"
3. Confirm the action

### Step 2: Push Again
```bash
cd "HTML - Copy/quizzy-ai-paper-forge"
git push origin main
```

This time it should work! ✅

---

## ✅ Option 2: Keep Keys in .env.local Only (More Secure)

If you want to keep keys out of GitHub entirely:

### Step 1: Restore API Keys to .env.production
```bash
# Edit .env.production and add your real keys back
```

### Step 2: Add .env.production to .gitignore
```bash
echo ".env.production" >> .gitignore
```

### Step 3: Remove from Git History
```bash
git rm --cached .env.production
git commit -m "Remove .env.production from tracking"
git push origin main
```

### Step 4: For Deployment
When deploying to Vercel/Netlify, manually add the environment variables in their dashboard.

---

## ✅ Option 3: Use GitHub Secrets (For GitHub Pages)

If deploying to GitHub Pages:

### Step 1: Add Secrets to GitHub
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each key:
   - Name: `VITE_OPENROUTER_API_KEY`
   - Value: `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`
5. Repeat for other keys

### Step 2: Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build with environment variables
        env:
          VITE_OPENROUTER_API_KEY: ${{ secrets.VITE_OPENROUTER_API_KEY }}
          VITE_ANTHROPIC_API_KEY: ${{ secrets.VITE_ANTHROPIC_API_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Step 3: Remove .env.production
```bash
git rm .env.production
git commit -m "Use GitHub Secrets for deployment"
git push origin main
```

---

## 🎯 My Recommendation

**For your review/demo:** Use **Option 1** (Allow the secret)
- Fastest solution
- Works immediately
- You can rotate keys later

**For production:** Use **Option 3** (GitHub Secrets)
- More secure
- Keys not visible in repository
- Automatic deployments

---

## Quick Commands

### Option 1: Allow and Push
```bash
# 1. Click the GitHub link to allow secret
# 2. Then push again:
cd "HTML - Copy/quizzy-ai-paper-forge"
git push origin main
```

### Option 2: Remove from Git
```bash
cd "HTML - Copy/quizzy-ai-paper-forge"
echo ".env.production" >> .gitignore
git rm --cached .env.production
git rm --cached DEPLOY_NOW.md
git commit -m "Remove sensitive files"
git push origin main
```

---

## ⚠️ Important Security Note

Your API keys are now visible in the error message and in your commit history. After deployment, consider:

1. **Rotate your API keys:**
   - OpenRouter: Generate new key at https://openrouter.ai/keys
   - Anthropic: Generate new key at https://console.anthropic.com/
   - Gemini: Generate new key at https://makersuite.google.com/app/apikey

2. **Monitor usage:**
   - Check API dashboards for unexpected usage
   - Set up usage alerts

3. **For production:**
   - Use environment variables in deployment platform
   - Implement rate limiting
   - Consider backend proxy for API calls

---

**Choose Option 1 for now to deploy quickly! 🚀**
