# AI Image Studio - Setup Guide

This comprehensive guide will walk you through setting up the entire AI Image Generation platform from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Google Cloud Platform Setup](#google-cloud-platform-setup)
4. [Google OAuth Setup](#google-oauth-setup)
5. [Gemini AI API Setup](#gemini-ai-api-setup)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Google account
- Basic knowledge of Next.js and React
- Terminal/command line access

---

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: ai-image-studio (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
5. Click "Create new project"
6. Wait 2-3 minutes for your project to be provisioned

### Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Go to "API" section
3. Copy these values (you'll need them later):
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Step 3: Set Up Database Schema

1. In your Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the SQL
6. You should see success messages for all table creations

### Step 4: Configure Row Level Security (RLS)

The schema already includes RLS policies, but verify they're active:

1. Go to "Authentication" > "Policies"
2. Ensure you see policies for:
   - `users` table
   - `folders` table
   - `images` table
   - `credit_transactions` table

---

## Google Cloud Platform Setup

### Step 1: Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click "Select a project" > "New Project"
3. Enter project name: `ai-image-studio`
4. Click "Create"
5. Wait for the project to be created and select it

### Step 2: Enable Required APIs

1. In the GCP Console, go to "APIs & Services" > "Library"
2. Search for and enable:
   - **Cloud Storage API**
   - **Identity and Access Management (IAM) API**

### Step 3: Create a Cloud Storage Bucket

1. Go to "Cloud Storage" > "Buckets"
2. Click "Create Bucket"
3. Configure your bucket:
   - **Name**: `ai-image-studio-images` (must be globally unique)
   - **Location type**: Region (choose closest to your users)
   - **Storage class**: Standard
   - **Access control**: Fine-grained
4. Click "Create"

### Step 4: Make Bucket Public (for image URLs)

1. Click on your bucket name
2. Go to "Permissions" tab
3. Click "Grant Access"
4. Add principal: `allUsers`
5. Select role: "Storage Object Viewer"
6. Click "Save"
7. Click "Allow Public Access"

### Step 5: Create a Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `ai-image-studio-sa`
   - **Description**: Service account for AI Image Studio
4. Click "Create and Continue"
5. Grant role: "Storage Object Admin"
6. Click "Continue" then "Done"

### Step 6: Create Service Account Key

1. Click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. A JSON file will download - **keep this file safe!**
7. Open the JSON file and note:
   - `project_id` → `GCS_PROJECT_ID`
   - `client_email` → `GCS_CLIENT_EMAIL`
   - `private_key` → `GCS_PRIVATE_KEY`

---

## Google OAuth Setup

### Step 1: Configure OAuth Consent Screen

1. In GCP Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Click "Create"
4. Fill in the application details:
   - **App name**: AI Image Studio
   - **User support email**: Your email
   - **App logo**: Optional
   - **Application home page**: `http://localhost:3000` (for dev)
   - **Authorized domains**: Add your production domain later
   - **Developer contact**: Your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Add or Remove Scopes"
7. Add these scopes:
   - `openid`
   - `email`
   - `profile`
8. Click "Save and Continue"
9. Add test users (your email) for development
10. Click "Save and Continue"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: AI Image Studio Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production - add later)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production - add later)
5. Click "Create"
6. Copy these values:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## Gemini AI API Setup

### Step 1: Get Gemini API Key

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select your GCP project or create a new one
4. Click "Create API Key in existing project"
5. Copy the API key → `GEMINI_API_KEY`

### Step 2: (Optional) Set Up Replicate for Image Generation

Since Gemini doesn't directly generate images, you'll want to use Replicate:

1. Go to [https://replicate.com](https://replicate.com)
2. Sign up or log in
3. Go to "Account Settings" > "API Tokens"
4. Copy your API token → `REPLICATE_API_TOKEN`
5. Install Replicate in your project:
   ```bash
   npm install replicate
   ```

---

## Environment Variables

### Step 1: Create .env.local File

In your project root, create a `.env.local` file (never commit this file!):

```bash
# Copy from .env.example
cp .env.example .env.local
```

### Step 2: Fill in All Environment Variables

Open `.env.local` and fill in all the values you collected:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-this-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Cloud Storage
GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=ai-image-studio-images
GCS_CLIENT_EMAIL=ai-image-studio-sa@your-project.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Optional: Replicate
REPLICATE_API_TOKEN=your-replicate-token

# Credits Configuration
DEFAULT_CREDITS=100
CREDITS_PER_GENERATION=5
```

### Step 3: Generate NEXTAUTH_SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### Important Notes:

- The `GCS_PRIVATE_KEY` must include the full key with `\n` for newlines
- Never commit `.env.local` to git (it's in `.gitignore`)
- For production, use environment variables in your hosting platform

---

## Running the Application

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Verify Environment Variables

```bash
# Check that all required env vars are set
npm run check-env  # (if you create this script)
```

### Step 3: Run Development Server

```bash
npm run dev
```

### Step 4: Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see the landing page!

### Step 5: Test Authentication

1. Click "Sign In"
2. Sign in with Google
3. You should be redirected to the dashboard
4. Check Supabase to see your user was created

---

## Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env.local` to version control
- ✅ Use different credentials for development and production
- ✅ Rotate keys regularly (every 90 days minimum)
- ✅ Use secret management tools in production (Vercel Secrets, AWS Secrets Manager, etc.)

### 2. Supabase Security

- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Use the `service_role` key only in API routes (server-side)
- ✅ Never expose `service_role` key to the client
- ✅ Regularly review RLS policies

### 3. Google Cloud Storage

- ✅ Use signed URLs for sensitive images (not implemented yet)
- ✅ Set up CORS if needed
- ✅ Implement object lifecycle policies to auto-delete old files
- ✅ Monitor storage usage and costs

### 4. API Security

- ✅ All API routes check authentication
- ✅ Validate user input on the server
- ✅ Implement rate limiting (recommended)
- ✅ Use HTTPS in production

### 5. NextAuth Security

- ✅ Use a strong `NEXTAUTH_SECRET`
- ✅ Set correct callback URLs
- ✅ Enable CSRF protection (enabled by default)
- ✅ Use secure cookies in production

---

## Troubleshooting

### Common Issues

**Issue**: "Missing Supabase environment variables"
- **Solution**: Check that all Supabase env vars are set in `.env.local`

**Issue**: "Google OAuth error: redirect_uri_mismatch"
- **Solution**: Add the exact redirect URI to Google OAuth console

**Issue**: "GCS upload failed"
- **Solution**: Check service account permissions and bucket name

**Issue**: "Image generation not working"
- **Solution**: The Gemini integration is a placeholder - integrate Replicate or Stability AI

**Issue**: "Cannot find module '@/...' "
- **Solution**: Check `jsconfig.json` has correct paths configuration

---

## Next Steps

1. **Integrate Image Generation**: Replace the placeholder with Replicate or Stability AI
2. **Add Payment System**: Integrate Stripe for credit purchases
3. **Implement Rate Limiting**: Add rate limiting to API routes
4. **Add Email Notifications**: Set up Supabase email templates
5. **Optimize Images**: Add image compression and thumbnails
6. **Add Analytics**: Track usage with Vercel Analytics or Google Analytics
7. **Deploy to Production**: Deploy to Vercel, Netlify, or your preferred platform

---

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the Supabase and Google Cloud logs
3. Check the browser console for client-side errors
4. Check the terminal for server-side errors

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in production environment
- [ ] Updated OAuth redirect URLs for production domain
- [ ] Updated CORS settings for GCS bucket
- [ ] Enabled security headers in Next.js config
- [ ] Set up monitoring and error tracking (Sentry, etc.)
- [ ] Configure backup strategy for Supabase
- [ ] Set up CI/CD pipeline
- [ ] Review and test all RLS policies
- [ ] Add rate limiting middleware
- [ ] Configure CDN for static assets
- [ ] Set up domain and SSL certificate
- [ ] Test all features in production environment

---

Congratulations! Your AI Image Studio is now set up and ready to use! 🎉
