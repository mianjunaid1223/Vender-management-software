# 🏢 Vendor Management Software

A comprehensive **Next.js 15 Full-Stack Application** for managing vendors, invoices, contracts, and business relationships. Built with modern technologies and following industry best practices.

## ✨ Features

- **🔐 Authentication & Authorization** - Secure user and vendor authentication
- **📊 Dashboard Analytics** - Real-time business insights and metrics
- **📄 Invoice Management** - Create, track, and manage invoices
- **👥 Vendor Portal** - Dedicated portal for vendor interactions
- **📋 Contract Management** - Handle vendor contracts and agreements
- **🤖 AI Integration** - AI-powered invoice processing and assistance
- **📧 Email Notifications** - Automated email communication
- **📱 Responsive Design** - Works on all devices

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd vendor-management-software
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB URI and other configs
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:9002](http://localhost:9002)

4. **Seed Database** (Optional)
   ```bash
   npm run seed
   ```

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: Custom JWT implementation
- **Email**: Nodemailer
- **AI**: Google AI/Genkit integration
- **UI Components**: Radix UI + Custom components

### **Project Structure**
```
src/
├── app/                    # Next.js App Router (Pages & API)
├── components/             # Reusable UI Components
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   ├── dashboard/         # Dashboard-specific components
│   └── vendor-portal/     # Vendor portal components
├── lib/                   # Business Logic & Utilities
│   ├── auth/              # Authentication
│   ├── database/          # Database operations
│   ├── email/             # Email services
│   ├── ai/                # AI integration
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript definitions
├── config/                # Configuration files
├── hooks/                 # Custom React hooks
└── middleware.ts          # Next.js middleware
```

## 📜 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run seed` - Seed database with sample data
- `npm run test-email` - Test email configuration

## 🔧 Environment Variables

Required environment variables (see `.env.example`):

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `EMAIL_HOST` - SMTP host (optional)
- `EMAIL_USER` - Email username (optional)
- `EMAIL_PASSWORD` - Email password (optional)
- `GOOGLE_AI_API_KEY` - Google AI API key (optional)

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- [Setup Guide](./docs/EMAIL_SETUP.md)
- [Implementation Details](./docs/IMPLEMENTATION_SUMMARY.md)
- [Architecture Overview](./docs/README.md)

## 🚀 Deployment

This application can be deployed on:

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Docker** containers
- Any **Node.js** hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the [documentation](./docs/)
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ using Next.js 15 and modern web technologies**
