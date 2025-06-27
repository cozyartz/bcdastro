# BCDAstro – Professional Drone Services Platform

**BCDAstro** is an enterprise-grade, full-stack drone services platform that combines professional aerial photography/videography with modern web technologies. Built for Battle Creek Drone, this platform offers secure media licensing, multi-payment processing (traditional & cryptocurrency), and comprehensive user management.

## 🏗️ Architecture

**BCDAstro** is built as a server-side rendered (SSR) application with a modern tech stack:

- **Frontend**: Astro with React components, TailwindCSS styling
- **Backend**: Node.js with Astro API routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Media Storage**: Cloudflare R2 + Stream for video/image processing
- **Authentication**: JWT-based with email verification
- **Payments**: Dual payment system (Stripe + Coinbase Commerce)
- **Security**: bcrypt password hashing, secure API endpoints

## ✨ Features

### Core Services
- **FAA Part 107 Certified** drone operations
- **Professional Media Gallery** with advanced filtering
- **Secure Licensing System** (Standard, Commercial, Exclusive)
- **Multi-tier User Management** (Free, Pro, Enterprise)
- **Admin Dashboard** with content moderation

### Technical Features
- **Dual Payment Processing** - Stripe & cryptocurrency via Coinbase
- **Advanced Media Management** - Video streaming, image optimization
- **Real-time Search & Filtering** - Category-based media discovery
- **Responsive Design** - Mobile-first with dark mode support
- **SEO Optimized** - Dynamic sitemaps, meta tags
- **API-First Architecture** - RESTful endpoints for all operations

## 🚀 Tech Stack

### Core Framework
- **[Astro](https://astro.build/)** v5.9.4 - SSR framework with React integration
- **[React](https://react.dev/)** v18.2.0 - Component library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development

### Styling & UI
- **[TailwindCSS](https://tailwindcss.com/)** v4.1.11 - Utility-first CSS
- **[FontAwesome](https://fontawesome.com/)** v6.5.1 - Icon library
- **[Video.js](https://videojs.com/)** v8.23.3 - Video player

### Backend & Database
- **[Supabase](https://supabase.com/)** v2.39.0 - Database, Auth, Storage
- **[Node.js](https://nodejs.org/)** - Server runtime
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** v2.4.3 - Password hashing
- **[jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)** v9.0.2 - JWT authentication

### Cloud Services
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** - Object storage
- **[Cloudflare Stream](https://developers.cloudflare.com/stream/)** - Video processing
- **[AWS SDK](https://aws.amazon.com/sdk-for-javascript/)** v3.837.0 - S3-compatible R2 integration

### Payment Processing
- **[Stripe](https://stripe.com/)** - Traditional payment processing
- **[Coinbase SDK](https://docs.cloud.coinbase.com/)** v0.25.0 - Cryptocurrency payments
- **[crypto-js](https://www.npmjs.com/package/crypto-js)** v4.2.0 - Cryptographic functions

### Media Processing
- **[HLS.js](https://github.com/video-dev/hls.js/)** v1.6.5 - HTTP Live Streaming
- **[VideoJS Themes](https://www.npmjs.com/package/@videojs/themes)** v1.0.1 - Video player styling

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Cloudflare account (R2 + Stream)
- Stripe account
- Coinbase Commerce account

### Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/BCDAstro.git
cd BCDAstro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET=your-bucket-name
STREAM_ACCOUNT_ID=your-stream-account-id
PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=your-stream-customer-code

# Payment Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
COINBASE_API_KEY=your-coinbase-api-key
COINBASE_WEBHOOK_SECRET=your-webhook-secret

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Application Configuration
PUBLIC_SITE_URL=http://localhost:4321
NODE_ENV=development
```

## 📊 Database Schema

### Core Tables

**Users Table**
- User authentication and profile management
- Subscription tiers: `free`, `pro`, `enterprise`
- Admin role management

**Media Assets Table**
- Professional drone footage and photography
- Metadata: resolution, duration, file size, location
- Pricing: individual, package, exclusive licensing
- Status workflow: `pending` → `approved` → `published`

**Purchases Table**
- Transaction records for all payment methods
- License tracking: `standard`, `commercial`, `exclusive`
- Download limits and usage analytics

**Crypto Payments Table**
- Cryptocurrency transaction tracking
- Multi-currency support (BTC, ETH, USDC)
- Confirmation status and wallet addresses

## 🔌 API Endpoints

### Media Management
- `POST /api/r2-upload-url` - Generate presigned URLs for media uploads
- `GET /api/media` - Fetch approved media with filtering
- `POST /api/media/purchase` - Process media license purchases

### Database Operations
- `POST /api/migrate` - Run database migrations (development only)
- `GET /api/sitemap.xml` - Generate dynamic sitemap

### Authentication
- Built-in Supabase Auth with custom JWT handling
- Email verification and password recovery
- Row Level Security (RLS) for data protection

## 🚀 Deployment

### Cloudflare Pages Deployment

BCDAstro is optimized for **Cloudflare Pages** with seamless integration to Cloudflare's ecosystem (R2, Stream, Workers).

#### 1. Connect Repository

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click "Create a project" → "Connect to Git"
3. Select your BCDAstro repository
4. Configure build settings:

```yaml
# Build configuration
Build command: npm run build
Build output directory: dist
Root directory: / (default)
Environment variables: See below
```

#### 2. Environment Variables

Set these in Cloudflare Pages → Settings → Environment Variables:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare Configuration (Auto-detected in Cloudflare Pages)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET=bcd-media
STREAM_ACCOUNT_ID=your-stream-account-id
PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=your-stream-customer-code

# Payment Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
COINBASE_API_KEY=your-coinbase-api-key
COINBASE_WEBHOOK_SECRET=your-webhook-secret

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret

# Application Configuration
PUBLIC_SITE_URL=https://your-domain.pages.dev
NODE_ENV=production
```

#### 3. Custom Domain Setup

```bash
# In Cloudflare Pages → Custom domains
1. Add your domain (e.g., battlecreekdrone.com)
2. Update DNS records as instructed
3. SSL certificates are automatically provisioned
4. Enable "Always Use HTTPS"
```

#### 4. Build & Deploy

```bash
# Local production build test
npm run build
npm run preview

# Automatic deployment triggers on:
# - Git push to main branch
# - Manual deployment from dashboard
# - API/webhook triggers
```

### Cloudflare Functions (API Routes)

API routes in `src/pages/api/` are automatically deployed as Cloudflare Functions:

- **`/api/r2-upload-url`** - Generates presigned URLs for R2 uploads
- **`/api/migrate`** - Database migration endpoint (dev only)
- **`/api/sitemap.xml`** - Dynamic sitemap generation

### Performance Optimizations

Cloudflare Pages provides built-in optimizations:

- **Global CDN** - Edge caching worldwide
- **Auto-minification** - CSS, JS, HTML compression
- **Brotli Compression** - Enhanced file compression
- **Image Optimization** - Automatic WebP/AVIF conversion
- **HTTP/3 Support** - Latest protocol support

### Monitoring & Analytics

Enable in Cloudflare Dashboard:

- **Web Analytics** - Privacy-first visitor analytics
- **Performance Monitoring** - Core Web Vitals tracking
- **Error Logging** - Real-time error reporting
- **Security Insights** - Attack mitigation reports

## 🔒 Security Features

- **Authentication**: JWT-based with secure token handling
- **Database**: Row Level Security (RLS) on all tables
- **Passwords**: bcrypt hashing with salt rounds
- **File Uploads**: Type validation and size limits
- **API**: Rate limiting and CORS configuration
- **Payments**: PCI DSS compliant via Stripe
- **Environment**: Secure secrets management

## 👥 User Roles & Permissions

### User Tiers
- **Free**: Basic access, limited downloads
- **Pro**: Enhanced features, bulk licensing
- **Enterprise**: Custom pricing, exclusive content

### Admin Features
- Content moderation and approval workflow
- User management and analytics
- Revenue tracking and reporting
- Media upload and categorization

## 📱 Responsive Design

- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Gesture-based navigation
- **Performance**: Optimized images and videos
- **Accessibility**: WCAG 2.1 compliant

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run astro        # Run Astro CLI commands
```

### Project Structure

```
src/
├── components/          # Reusable Astro/React components
├── layouts/            # Page layouts
├── pages/              # File-based routing
│   ├── api/           # API endpoints
│   ├── gallery.astro  # Media gallery
│   └── dashboard.astro # User dashboard
├── lib/               # Utility functions
│   ├── supabase.ts    # Database client
│   ├── cloudflare.ts  # Media services
│   └── coinbase.ts    # Crypto payments
└── styles/            # Global CSS
```

## 📄 License

This project is proprietary software developed for Battle Creek Drone Services.

## 🤝 Contributing

This is a private commercial project. For development inquiries, please contact the project maintainers.

---

**Built with ❤️ for professional drone services**