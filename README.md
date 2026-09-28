# Unique Cranes ERP (Estimation Engine)

A full-stack, enterprise-grade Next.js application designed to manage the estimation, drawing, and document generation workflows for crane manufacturing. 

This platform streamlines the entire sales-to-engineering process, enabling estimators to quickly calculate costs based on dynamic requirements, automatically generate GA (General Arrangement) drawings as SVGs, and seamlessly compile PDF quotations and job cards.

## 🚀 Key Features

*   **Intelligent Estimation Engine**: Computes highly detailed breakdowns (Main Hoist, Aux Hoist, CT, LT) evaluating dynamic formulas across structural, electrical, mechanical, and painting costs.
*   **Dynamic SVG Drawing Generator**: An algorithmic drawing engine that renders complex crane assemblies (span, hook lifts, wheels, trolley) dynamically as scalable vector graphics based on precise mathematical parameters.
*   **Automated PDF Document Generation**: Uses headless Chromium (Puppeteer) to seamlessly convert dynamically generated web templates (Quotations, Job Cards, Missing Info) into high-fidelity PDFs.
*   **Multi-Role Authentication & Access Control**: Secure Role-Based Access Control (RBAC) via Supabase for Admins, Estimators, and Sales with edge-level route protection.
*   **Real-time Collaboration & History**: Full audit trailing and versioning of estimations and generated documents synced instantly using Supabase real-time subscriptions.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
*   **Language:** TypeScript
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Storage)
*   **State Management:** React Query & Zustand
*   **PDF Engine:** Puppeteer / `puppeteer-core` with `@sparticuz/chromium-min`
*   **Icons:** Lucide React

## 📂 Project Architecture

```
unique-cranes-erp/
├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (auth)/           # Authentication flows (Login, Forgot Password)
│   ├── (admin)/          # Admin Dashboard & Settings
│   ├── (app)/            # Core ERP features (Jobs, Estimations, Drawings)
│   └── api/              # Serverless route handlers (PDF Generation, etc.)
├── components/           # Reusable React components
│   ├── ui/               # shadcn/ui generic components
│   └── ...               # Domain specific components (Forms, Tables)
├── lib/                  # Core Business Logic & Utilities
│   ├── engines/          # Advanced algorithmic engines
│   │   ├── estimation/   # Cost calculation logic
│   │   └── drawing/      # SVG generation logic
│   ├── pdf/              # Puppeteer PDF generation templates & instances
│   └── supabase/         # Supabase client singletons (Server & Client)
├── public/               # Static assets & sample files
└── supabase/             # Database migrations & seed files
```

## 🏗️ Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn
*   A Supabase project (for Postgres DB and Authentication)

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
   Rename `.env.example` to `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Database Migrations (Optional/If applicable):**
   ```bash
   npx supabase db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 🛡️ Security
All environment variables are securely handled. Hardcoded secrets are strictly avoided. Database interactions are secured with Postgres Row Level Security (RLS).

## 📄 License
Internal Proprietary Software - Unique Industrial Handlers Pvt. Ltd.
