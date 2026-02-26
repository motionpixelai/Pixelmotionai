# PixelMotion AI — Setup Guide

## Files in This Project
```
pixelmotionai/
├── index.html       ← Main site (all 22 features)
├── about.html       ← About Us page
├── privacy.html     ← Privacy Policy
├── terms.html       ← Terms of Service
├── contact.html     ← Contact page
├── blog.html        ← Blog (5 articles)
├── api/
│   └── generate.js  ← Hugging Face API (backend)
├── vercel.json      ← Vercel config
├── package.json     ← Project config
└── README.md        ← This file
```

## Setup Steps

### Step 1 — Add Your API Key to Vercel
1. Go to vercel.com
2. Open your project
3. Go to Settings → Environment Variables
4. Add new variable:
   - NAME: HF_API_KEY
   - VALUE: (your Hugging Face token)
5. Click Save

### Step 2 — Upload to GitHub
1. Go to github.com
2. Create new repository named "pixelmotionai"
3. Upload all files
4. Make repository public

### Step 3 — Connect to Vercel
1. Go to vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Click Deploy
5. Your site is LIVE!

## Your Site Will Be Live At:
https://pixelmotionai.vercel.app

## Support
For help, visit contact.html on your site.

