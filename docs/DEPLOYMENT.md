# 🚀 BeQ Deployment Guide

This guide covers deploying BeQ to production using Supabase and Vercel.

## 📋 Prerequisites

- Supabase account
- Vercel account  
- GitHub repository
- OpenAI API key

## 🗂️ Step 1: Setup Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and set project details:
   - Name: `beq-production`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users

### 1.2 Setup Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy the content from `infra/supabase/schema.sql`
3. Execute the SQL to create all tables and policies

### 1.3 Configure Authentication

1. Go to Authentication > Settings
2. Enable email authentication
3. Configure email templates (optional)
4. Set up redirect URLs:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 1.4 Get Supabase Keys

1. Go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role (secret) key

## 🎯 Step 2: Setup Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your BeQ repository from GitHub
4. Configure project settings:
   - Framework Preset: `Next.js`
   - Root Directory: `clients/web`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2.2 Environment Variables

Add the following environment variables in Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (100% Open Source - Gemma 3 27B IT)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemma-2-27b-it

# Application
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
ENVIRONMENT=production

# Calendar Integration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### 2.3 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be available at `https://your-app.vercel.app`

## 🔧 Step 3: Backend Services Deployment

Since we're using Supabase for the database, most backend functionality can be handled via Vercel's serverless functions. However, for the AI orchestrator service, you have several options:

### Option A: Vercel Serverless Functions (Recommended)

Create API routes in `clients/web/app/api/` for:
- `/api/chat` - AI conversation handling
- `/api/schedule` - Scheduling operations
- `/api/bricks` - Brick management
- `/api/resources` - Resource recommendations

### Option B: External Hosting

Deploy the FastAPI services to:
- Railway
- Render
- Google Cloud Run
- AWS Lambda
- Digital Ocean

Update `NEXT_PUBLIC_API_URL` to point to your external API.

## 📊 Step 4: Configure Analytics & Monitoring

### 4.1 Supabase Analytics

Enable analytics in Supabase dashboard to monitor:
- Database usage
- API requests
- User activity

### 4.2 Vercel Analytics

Enable Vercel Analytics for:
- Performance monitoring
- User flow analysis
- Error tracking

### 4.3 Error Tracking (Optional)

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

## 🔐 Step 5: Security Configuration

### 5.1 Row Level Security

Ensure RLS is enabled on all tables (already configured in schema).

### 5.2 API Security

- Use HTTPS only
- Implement rate limiting
- Validate all inputs
- Use proper CORS settings

### 5.3 Environment Security

- Never commit secrets to git
- Use Vercel's environment variables
- Rotate keys regularly

## 🚀 Step 6: Go Live

### 6.1 Final Checks

- [ ] Database schema applied
- [ ] Authentication working
- [ ] Environment variables set
- [ ] All services responding
- [ ] Error tracking configured

### 6.2 Custom Domain (Optional)

1. Add custom domain in Vercel
2. Configure DNS settings
3. Enable SSL

### 6.3 Performance Optimization

- Enable Vercel caching
- Optimize images and assets
- Configure CDN

## 📈 Step 7: Scaling Considerations

### Database Scaling

Supabase handles scaling automatically, but monitor:
- Connection limits
- Storage usage
- Query performance

### API Scaling

Vercel serverless functions scale automatically:
- 10-second timeout limit
- Memory usage optimization
- Cold start optimization

### Cost Management

Monitor usage and costs:
- Supabase: Database size, bandwidth, auth users
- Vercel: Function invocations, bandwidth
- OpenAI: API usage

## 🔄 Step 8: CI/CD Pipeline

GitHub Actions are configured in `.github/workflows/`:

### Automatic Deployment

Pushes to `main` branch automatically deploy to production.

### Environment-based Deployment

- `main` branch → Production
- `develop` branch → Staging (optional)

## 🆘 Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   - Check Vercel environment variables
   - Ensure proper variable names

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies

3. **Authentication Issues**
   - Verify redirect URLs
   - Check Supabase auth settings

4. **Build Failures**
   - Check build logs in Vercel
   - Verify dependencies

### Debug Mode

Enable debug mode by setting:
```bash
DEBUG=true
LOG_LEVEL=DEBUG
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [BeQ Development Guide](./DEVELOPMENT.md)

---

## 🎉 Success!

Your BeQ application should now be live and accessible to users worldwide!

For any issues, check the troubleshooting section or create an issue in the GitHub repository.
