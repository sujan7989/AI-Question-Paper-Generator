# 🚀 Quick Deployment Instructions

## Choose Your Deployment Method:

---

## ⚡ FASTEST: GitHub Pages (Already Configured!)

### Step 1: Build and Test Locally
```bash
cd "HTML - Copy/quizzy-ai-paper-forge"
npm run build
npm run preview
```
Open http://localhost:4173 and test if everything works.

### Step 2: Deploy to GitHub Pages
```bash
npm run deploy
```

**That's it!** Your site will be live at:
`https://sujan7989.github.io/quizzy-ai-paper-forge/`

### Step 3: Enable GitHub Pages (if needed)
1. Go to https://github.com/sujan7989/quizzy-ai-paper-forge
2. Click "Settings" → "Pages"
3. Source: Select `gh-pages` branch
4. Save and wait 2-3 minutes

---

## 🌟 RECOMMENDED: Vercel (Best for Production)

### Why Vercel?
- ✅ Automatic deployments on every git push
- ✅ Better performance (global CDN)
- ✅ Environment variables support
- ✅ Free SSL certificate
- ✅ No configuration needed

### Step 1: Push to GitHub (if not done)
```bash
cd "HTML - Copy/quizzy-ai-paper-forge"
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/sujan7989/quizzy-ai-paper-forge.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/signup (sign up with GitHub)
2. Click "Add New" → "Project"
3. Import `sujan7989/quizzy-ai-paper-forge`
4. Vercel auto-detects everything ✅
5. Add environment variables:
   ```
   VITE_APP_URL = https://your-project.vercel.app
   VITE_OPENROUTER_API_KEY = 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
   VITE_ANTHROPIC_API_KEY = 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
   VITE_GEMINI_API_KEY = AIzaSyBpejf1OkN80FDwmq42Rv80XurIQmtfcTA
   ```
6. Click "Deploy"
7. Done! 🎉

**Your site will be live at:** `https://quizzy-ai-paper-forge.vercel.app`

---

## 🎯 ALTERNATIVE: Netlify

### Step 1: Build Locally
```bash
cd "HTML - Copy/quizzy-ai-paper-forge"
npm run build
```

### Step 2: Drag and Drop
1. Go to https://app.netlify.com/drop
2. Drag the `dist` folder onto the page
3. Done! Your site is live

### Step 3: Add Environment Variables
1. Go to "Site settings" → "Environment variables"
2. Add your API keys (same as Vercel above)
3. Redeploy

---

## ✅ Post-Deployment Checklist

After deployment, do these:

### 1. Update Supabase Allowed Origins
1. Go to Supabase Dashboard
2. Settings → API → URL Configuration
3. Add your deployment URL:
   - For GitHub Pages: `https://sujan7989.github.io`
   - For Vercel: `https://your-project.vercel.app`
   - For Netlify: `https://your-site.netlify.app`

### 2. Test All Features
- [ ] Login/Signup works
- [ ] PDF upload works
- [ ] Question generation works
- [ ] Paper download works
- [ ] All pages load correctly

### 3. Update README
Update the live demo link in your README.md

---

## 🐛 Troubleshooting

### Build Fails?
```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build
```

### Blank Page After Deployment?
- Check browser console for errors
- Verify base path in vite.config.ts
- Check if environment variables are set

### API Not Working?
- Verify API keys are correct
- Check Supabase allowed origins
- Look at browser network tab for errors

### Routes Show 404?
For GitHub Pages, ensure `vite.config.ts` has:
```typescript
base: '/quizzy-ai-paper-forge/'
```

---

## 📞 Need Help?

**Common Commands:**
```bash
# Test build locally
npm run build && npm run preview

# Deploy to GitHub Pages
npm run deploy

# Check for errors
npm run lint

# Clean everything
rm -rf node_modules dist .vite && npm install
```

**Still stuck?** Check DEPLOYMENT_GUIDE.md for detailed troubleshooting.

---

## 🎉 You're Ready!

Pick your deployment method above and follow the steps. 

**Recommended order:**
1. Try GitHub Pages first (fastest, already configured)
2. If you need better performance, use Vercel
3. Netlify is a good alternative

**Good luck with your deployment! 🚀**
