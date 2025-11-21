# AI Image Studio

A professional AI-powered image generation platform for creating stunning product advertising images. Upload your products, optionally add models, and generate professional photoshoots with AI.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Supabase](https://img.shields.io/badge/Supabase-Integrated-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)

## Features

### Core Functionality
- 🎨 **AI Image Generation** - Generate professional product images with AI
- 📸 **Product Solo Shots** - Create stunning product-only advertising images
- 👤 **Product + Model** - Combine products with model photos for lifestyle shots
- 🔄 **Multiple Variations** - Generate multiple versions in one go
- 📁 **Folder Organization** - Organize images into custom folders
- 🖼️ **Pinterest-Style Dashboard** - Beautiful masonry grid layout for browsing
- 💳 **Credit System** - Fair usage-based credit management

### Authentication & Security
- 🔐 **Google OAuth** - Secure sign-in with Google
- 🛡️ **Row Level Security** - Supabase RLS for data protection
- 🔒 **Protected Routes** - Middleware-based route protection
- 👤 **User Profiles** - Automatic user creation and management

### Storage & Data
- ☁️ **Google Cloud Storage** - Reliable image storage
- 🗄️ **Supabase Database** - PostgreSQL with real-time capabilities
- 🔗 **Public Image URLs** - Direct access to generated images
- 📊 **Credit History** - Track all credit transactions

### UI/UX
- 🎯 **Modern Design** - Clean, professional interface
- 📱 **Responsive** - Works on all devices
- ⚡ **Fast Performance** - Optimized Next.js App Router
- 🎭 **Loading States** - Smooth loading experiences
- ⚠️ **Error Handling** - User-friendly error messages

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS
- **React Dropzone** - Drag & drop file uploads
- **React Masonry CSS** - Pinterest-like grid layout
- **NextAuth.js** - Authentication
- **Date-fns** - Date formatting

### Backend & Services
- **Supabase** - PostgreSQL database with RLS
- **Google Cloud Storage** - Image storage
- **Gemini AI** - AI integration (placeholder for image gen)
- **Next.js API Routes** - Serverless API endpoints

### Development
- **JavaScript (not TypeScript)** - Easy to understand and modify
- **ESLint** - Code linting
- **Git** - Version control

## Quick Start

### Prerequisites
- Node.js 18 or higher
- A Google account
- Supabase account
- Google Cloud Platform account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-image-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in all the required values. See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

4. **Set up Supabase database**
   - Create a Supabase project
   - Run the SQL from `supabase-schema.sql` in the SQL Editor

5. **Configure Google Cloud**
   - Create a GCS bucket
   - Set up a service account
   - Configure OAuth credentials

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Cloud Storage
GCS_PROJECT_ID=
GCS_BUCKET_NAME=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=

# AI Integration
GEMINI_API_KEY=
REPLICATE_API_TOKEN=    # Optional but recommended

# Configuration
DEFAULT_CREDITS=100
CREDITS_PER_GENERATION=5
```

See `.env.example` for a complete template.

## Known Limitations & TODOs

### Image Generation
- **Replace Gemini placeholder** - Currently uses Gemini Pro Vision which doesn't generate images
- **Integrate Replicate/Stability AI** - Add actual image generation API
- The current implementation provides a framework that needs actual image generation integration

### Features to Add
- Payment Integration - Stripe for credit purchases
- Email Notifications - For generation completion
- Image Editing - Basic editing tools
- Public Sharing - Share images publicly

For complete documentation, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js, Supabase, and Google Cloud
