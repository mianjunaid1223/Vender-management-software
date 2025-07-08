# **App Name**: VendorVerse

## Core Features:

- User Authentication: User authentication and secure account management using bcrypt and JWT.
- Vendor Management: Clean dashboard to manage vendors: add, edit, delete vendor profiles.
- Invoice Tracking: Upload and track invoices with key details (amount, due date, status).
- Payment Reminders: Automated email payment reminders sent before invoice due dates using cron jobs.
- Reporting: Downloadable reports summarizing vendor spend and invoice statuses.
- AI Invoice Data Extraction: AI-powered tool to automatically extract key data from uploaded invoices using OCR and NLP. LLM reasoning decides when or if data needs extraction.
- AI Spending Insights: AI-driven insights tool providing summaries of spending trends and vendor performance based on historical invoice data, with user queries support (e.g., 'show unpaid invoices from last month'). LLM reasoning decides when to incorporate the vendor and payment history for better accuracy.

## Style Guidelines:

- Primary color: Soft blue (#A0D2EB) to convey professionalism and trust, reflecting the application's vendor management focus. (Light Mode)
- Primary color: Light blue (#ADD8E6) for contrast and readability. (Dark Mode)
- Background color: Light gray (#F0F4F8), offering a clean, uncluttered backdrop that enhances readability and usability. (Light Mode)
- Background color: Full black (#000000) for a true dark mode experience. (Dark Mode)
- Accent color: Muted teal (#77ACA2) for subtle highlights, call-to-action buttons, and key interactive elements, adding a touch of sophistication. (Light Mode)
- Accent color: Bright teal (#008080) for better visibility against the black background. (Dark Mode)
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern, neutral, and objective aesthetic.
- Simple, clear icons for navigation and actions, ensuring intuitive user interactions.
- Responsive layout optimized for both desktop and mobile, with a clean, easy-to-navigate dashboard featuring a left navigation bar and a main workspace.
- Subtle animations for feedback on actions (e.g., saving, uploading) to enhance user experience without being distracting.