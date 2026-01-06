# ClubSphere - Deployment Guide

## Vercel Deployment

### Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Supabase project set up

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - ClubSphere ready for deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite framework

### Step 3: Configure Environment Variables
Add these environment variables in Vercel dashboard:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Where to find these:**
- **Supabase URL & Key**: Supabase Dashboard → Settings → API
- **Gemini API Key**: Google AI Studio (aistudio.google.com)

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### Step 5: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## PWA Features

### Offline Support
- Service worker caches essential resources
- App works offline after first visit
- Automatic updates when online

### Install as App
Users can install ClubSphere as a standalone app:
- **Desktop**: Click install icon in address bar
- **Mobile**: "Add to Home Screen" option

### PWA Assets
- Favicon: 16x16, 32x32, 64x64
- App Icons: 192x192, 512x512
- Manifest: `/public/manifest.json`
- Service Worker: `/public/sw.js`

## Post-Deployment Checklist

- [ ] Test all features on production URL
- [ ] Verify environment variables are set
- [ ] Test PWA installation
- [ ] Check mobile responsiveness
- [ ] Verify Supabase connection
- [ ] Test AI features (Gemini API)
- [ ] Check analytics (if enabled)
- [ ] Set up custom domain (optional)

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all dependencies are in package.json
- Check build logs for specific errors

### API Not Working
- Verify Supabase URL and keys
- Check CORS settings in Supabase
- Ensure RLS policies are set up

### PWA Not Installing
- Ensure HTTPS is enabled (Vercel provides this)
- Check manifest.json is accessible
- Verify service worker is registered

## Monitoring

### Vercel Analytics
Enable in Project Settings → Analytics for:
- Page views
- Performance metrics
- User demographics

### Supabase Monitoring
Check Supabase Dashboard for:
- Database usage
- API requests
- Storage usage

## Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push
```

Vercel will automatically rebuild and deploy!

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Vite Docs: https://vitejs.dev
