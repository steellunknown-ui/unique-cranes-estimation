# Unique Cranes ERP (Estimation Engine)

A full-stack, enterprise-grade Next.js application designed to automate the estimation, engineering, and document generation workflows for heavy industrial crane manufacturing. 

This platform leverages modern web technologies combined with **Multi-LLM AI capabilities** to streamline the entire sales-to-engineering pipeline. It enables estimators to parse unstructured client PDFs via AI, compute precise component costs, algorithmically generate GA (General Arrangement) engineering drawings, and compile professional PDF documentation.

## 🚀 Key Features

*   **Multi-LLM PDF Extraction & Parsing**: Integrates advanced Large Language Models (LLMs) to automatically read, extract, and structure data from raw client inquiry PDFs. The AI parses complex technical specifications (capacity, span, lift, duty class, speeds) directly into the estimation engine.
*   **Intelligent Estimation Engine**: Computes highly detailed, multi-layered cost breakdowns (Main Hoist, Aux Hoist, CT, LT) evaluating dynamic mathematical formulas across structural, electrical, mechanical, and painting parameters.
*   **Algorithmic SVG Drawing Generator**: A dynamic, math-driven drawing engine that renders complex crane assemblies (span, hook lifts, wheels, trolley) as scalable vector graphics based on precise technical inputs.
*   **Automated PDF Document Generation**: Utilizes headless Chromium (Puppeteer) to seamlessly convert dynamically generated web templates (Quotations, Job Cards, Missing Info Requests) into high-fidelity, downloadable PDFs.
*   **Multi-Role Authentication & Access Control**: Secure Role-Based Access Control (RBAC) via Supabase for Admins, Estimators, and Sales teams with strict edge-level route protection.
*   **Real-time Collaboration & History**: Full audit trailing and versioning of estimations and generated documents synced instantly using Supabase real-time subscriptions.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
*   **Language:** TypeScript
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **AI Integration:** Multi-LLM architecture for parsing complex technical PDFs
*   **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Storage)
*   **State Management:** React Query & Zustand
*   **PDF Engine:** Puppeteer / `puppeteer-core` with `@sparticuz/chromium-min`

## 📂 Project Architecture

```
unique-cranes-erp/
├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (auth)/           # Authentication flows (Login, Forgot Password)
│   ├── (admin)/          # Admin Dashboard & System Settings
│   ├── (app)/            # Core ERP features (Jobs, Estimations, Drawings)
│   └── api/              # Serverless route handlers (AI Parsing, PDF Generation)
├── components/           # Reusable React components
│   ├── ui/               # shadcn/ui generic components
│   └── ...               # Domain specific components (Forms, Interactive Tables)
├── lib/                  # Core Business Logic & Utilities
│   ├── engines/          # Advanced algorithmic engines
│   │   ├── estimation/   # Dynamic cost calculation logic
│   │   └── drawing/      # SVG mathematical generation logic
│   ├── pdf/              # Puppeteer PDF generation templates
│   └── supabase/         # Supabase client singletons (Server & Client)
├── public/               # Static assets & sample client PDFs
└── supabase/             # Database migrations & RLS policies
```

## 🏗️ Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn
*   A Supabase project (for Postgres DB and Authentication)
*   Required API keys for LLM integrations

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/steellunknown-ui/unique-cranes-estimation.git
   cd unique-cranes-estimation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Rename `.env.example` to `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Add your specific LLM API Keys here
   ```

4. **Run Database Migrations:**
   ```bash
   npx supabase db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 🛡️ Security
All environment variables are securely handled. Hardcoded secrets are strictly avoided. Database interactions are secured with Postgres Row Level Security (RLS), and API endpoints are protected using server-side auth validation.

## 📄 License
Internal Proprietary Software - Unique Industrial Handlers Pvt. Ltd.
