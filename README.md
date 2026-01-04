# Budget Planner Application

A budget planning application built with Next.js and Supabase.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd app
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema in your Supabase SQL Editor (see `lib/db.js` for table structure)
   - Get your project URL and anon key from Settings → API

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Visit [http://localhost:3000](http://localhost:3000)

## Features

- ✅ Transaction management (income/expenses)
- ✅ Category management with budget limits
- ✅ Monthly and yearly analytics
- ✅ Budget tracking and status
- ✅ Dashboard with visualizations
- ✅ Responsive design (mobile & desktop)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS, Radix UI, Recharts
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (automatic)

## Project Structure

```
app/
├── app/                  # Next.js App Router pages
│   ├── page.js          # Dashboard (home)
│   ├── transactions/    # Transactions page
│   ├── categories/      # Categories page
│   └── analytics/       # Analytics page
├── components/          # React components
│   ├── Layout.jsx      # Main layout with navigation
│   └── ui/             # UI component library
├── lib/                # Utilities and database operations
│   ├── db.js           # Supabase database operations
│   ├── supabase.js     # Supabase client setup
│   └── utils.js        # Helper functions
├── package.json        # Dependencies
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── vercel.json         # Vercel deployment config
```

## Deployment

The project is configured for Vercel deployment:

1. **Push to GitHub**
2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
3. **Set environment variables in Vercel**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
4. **Deploy**
   - Vercel will automatically detect Next.js and deploy

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## License

MIT
