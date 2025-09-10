# VendorVerse - Vendor Management System

A comprehensive vendor management system built with Next.js, MongoDB, and AI-powered features.

## Features

- **Vendor Management**: Complete vendor lifecycle management with onboarding
- **Invoice Tracking**: AI-powered invoice data extraction and status management
- **Contract Management**: Contract creation, tracking, and renewal automation
- **Vendor Portal**: Self-service portal for vendors with role-based access
- **AI Assistant**: Intelligent insights and recommendations
- **Multi-tenant**: Secure data isolation for multiple companies
- **Audit Logging**: Comprehensive audit trail for compliance

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based sessions with bcrypt
- **AI**: Google AI (Gemini) with Genkit
- **PDF Generation**: jsPDF with autoTable
- **Email**: Nodemailer integration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account or local MongoDB instance

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd vendorverse
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
AUTH_SECRET=your_jwt_secret_key
VENDOR_AUTH_SECRET=your_vendor_jwt_secret

# AI (Optional)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key

# Email (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

5. Seed the database with sample data:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:9002` to see the application.

## Database Setup

See [docs/MONGODB_SETUP.md](docs/MONGODB_SETUP.md) for detailed MongoDB setup instructions.

## Architecture

### Multi-tenant Design
- Each company has isolated data access
- Users belong to companies via `companyId`
- All data operations are scoped by company

### Vendor Portal
- Self-service portal for vendors
- Role-based access control
- Approval workflows for vendor changes
- Comprehensive audit logging

### AI Integration
- Invoice data extraction from uploaded files
- Intelligent business insights and recommendations
- Context-aware AI assistant

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run schema:enhance` - Enhance database schema for vendor portal
- `npm run migrate:passwords` - Migrate plain text passwords to hashed
- `npm run genkit:dev` - Start Genkit AI development server

## Documentation

- [MongoDB Setup Guide](docs/MONGODB_SETUP.md)
- [Email Configuration](docs/EMAIL_SETUP.md)
- [Invoice Management](docs/INVOICE_MANAGEMENT.md)
- [Vendor Portal Architecture](docs/VENDOR_PORTAL_ARCHITECTURE.md)
- [Enhanced Vendor Portal Features](docs/ENHANCED_VENDOR_PORTAL.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.
