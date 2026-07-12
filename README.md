# Gimbiya Mall — Frontend

React 18 + Vite + Tailwind CSS frontend for the Gimbiya Mall platform.

## Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.3 | UI framework |
| Vite | 5.x | Build tool + dev server |
| Tailwind CSS | 3.4 | Design system + utility CSS |
| React Router DOM | 6.x | Client-side routing |
| TanStack Query | 5.x | Server state + caching |
| Zustand | 4.x | Client state (auth, cart) |
| Framer Motion | 11.x | Animations + transitions |
| Axios | 1.7 | HTTP client |
| React Hot Toast | 2.4 | Toast notifications |
| Lucide React | 0.424 | SVG icon library |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (no changes needed for local dev with Vite proxy)
cp .env.example .env

# 3. Make sure the backend is running on port 8080
# cd ../gimbiya-backend && npm run dev

# 4. Start the dev server
npm run dev
```

Frontend runs on http://localhost:5173

The Vite dev server automatically proxies `/api/*` requests to `http://localhost:8080`.

## Directory Structure

```
src/
├── api/
│   └── index.js          # All API calls (authApi, productApi, orderApi, etc.)
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx          # Sticky nav with cart, role menu, state selector
│   │   ├── Sidebar.jsx         # Role-aware dashboard sidebar
│   │   ├── DashboardLayout.jsx # Sidebar + main content wrapper
│   │   └── LiveTicker.jsx      # Scrolling market data ticker
│   └── ui/
│       └── index.jsx     # Button, Badge, Card, Input, Modal, Spinner, etc.
├── context/
│   └── AuthContext.jsx   # Auth provider + RequireAuth + RequireGuest guards
├── pages/
│   ├── Landing.jsx        # Hero + floor switcher + features + CTAs
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotReset.jsx
│   └── dashboards/
│       ├── CEO.jsx        # Telemetry + KYC adjudication + escrow
│       ├── Buyer.jsx      # Catalog + cart + checkout + order tracker
│       ├── Merchant.jsx   # Listings + analytics + settlement
│       ├── Operations.jsx # Stock Manager + Rider + Affiliate
│       └── Coordinator.jsx# Regional user registry
├── store/
│   ├── authStore.js      # Zustand — user, login, logout, checkAuth
│   └── mallStore.js      # Zustand — cart, state selection, floor
└── utils/
    └── index.js          # formatNaira, formatDate, timeAgo, copyToClipboard
```

## Routes

| Path | Access | Page |
|------|--------|------|
| `/` | Public | Landing page |
| `/login` | Guest only | Login |
| `/register` | Guest only | Register |
| `/forgot-password` | Public | Forgot password |
| `/reset-password/:token` | Public | Reset password |
| `/shop` | Public | Buyer catalog |
| `/cart` | Buyer | Cart |
| `/dashboard/ceo` | super_admin | CEO dashboard |
| `/dashboard/coordinator` | developer_coordinator | Regional hub |
| `/dashboard/merchant` | business_owner | Store manager |
| `/dashboard/stock` | stock_manager | Warehouse control |
| `/dashboard/rider` | delivery | Rider console |
| `/dashboard/affiliate` | affiliate | Campaign hub |
| `/dashboard/buyer` | buyer | Order management |

## Design System

Based on logo colors:
- **Forest Green** `#0D4A3A` — hero backgrounds, brand identity
- **Burnished Brass** `#C8A84B` — primary CTAs, active states, KPIs
- **Midnight** `#050510` — dashboard backgrounds

Fonts loaded from Google Fonts:
- `Playfair Display` — display headings
- `Inter` — body text
- `JetBrains Mono` — all data, prices, codes

## Deploy to Netlify

```bash
# Build
npm run build

# Or connect GitHub repo to Netlify — it auto-detects Vite config
# Set these environment variables in Netlify dashboard:
# VITE_MONNIFY_API_KEY=your_live_key
# VITE_MONNIFY_CONTRACT_CODE=your_code
```

The `netlify.toml` handles:
- SPA routing (`/* → /index.html`)
- API proxy (`/api/* → Railway backend`)
