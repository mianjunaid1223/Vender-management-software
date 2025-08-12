# Vendor Management Software Documentation

This directory contains comprehensive documentation for the Vendor Management Software project.

## 📚 Documentation Files

- **EMAIL_SETUP.md** - Email service configuration and setup instructions
- **EMAIL_SERVICE_IMPLEMENTATION.md** - Detailed email service implementation guide
- **IMPLEMENTATION_SUMMARY.md** - Overall implementation summary and architecture
- **MULTI_TENANT_SECURITY_FIX.md** - Multi-tenant security implementation details
- **VENDOR_PORTAL_REBUILD.md** - Vendor portal reconstruction documentation

## 🏗️ Architecture Overview

This is a **Next.js 15 Full-Stack Application** with the following tech stack:

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Hooks + Server Components

### Backend
- **API**: Next.js API Routes
- **Database**: MongoDB with native driver
- **Authentication**: Custom JWT implementation
- **Email**: Nodemailer

### DevOps & Tools
- **AI Integration**: Google AI/Genkit
- **Build Tool**: Next.js with Turbopack
- **Package Manager**: npm
- **Type Checking**: TypeScript 5

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router (Pages & API)
├── components/             # Reusable UI Components
│   ├── ui/                # Base UI components (Radix UI)
│   ├── layout/            # Layout components
│   ├── forms/             # Form components
│   ├── dashboard/         # Dashboard-specific components
│   └── vendor-portal/     # Vendor portal components
├── lib/                   # Shared Business Logic & Utilities
│   ├── auth/              # Authentication logic
│   ├── database/          # Database utilities & queries
│   ├── email/             # Email services
│   ├── ai/                # AI integration
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript definitions
│   └── validation/        # Zod schemas & validation
├── config/                # Configuration files
├── hooks/                 # Custom React hooks
└── middleware.ts          # Next.js middleware
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your MongoDB URI and other environment variables
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Seed Database** (optional)
   ```bash
   npm run seed
   ```

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
