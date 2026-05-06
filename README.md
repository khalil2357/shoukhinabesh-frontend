# Shoukhinabesh Frontend

Modern React frontend for the Shoukhinabesh e-commerce platform.

## Overview

This app includes:

- Public storefront (home, shop, product detail)
- Cart, wishlist, and checkout flows
- Auth flows (register, login, forgot/reset password)
- Role-aware dashboards (customer, vendor, admin)
- API integration through Axios + bearer token interceptor
- Client-side routing with React Router

## Tech Stack

- React 19 + TypeScript
- Vite 8
- React Router
- Axios
- Zustand
- Tailwind CSS (via Vite plugin)

## Project Structure

```text
shoukhinabesh-frontend/
├─ public/
├─ src/
│  ├─ api/
│  │  └─ axios.ts
│  ├─ components/
│  │  ├─ common/
│  │  ├─ layout/
│  │  ├─ product/
│  │  └─ ui/
│  ├─ pages/
│  │  ├─ auth/
│  │  ├─ account/
│  │  ├─ vendor/
│  │  ├─ admin/
│  │  ├─ Home.tsx
│  │  ├─ Shop.tsx
│  │  ├─ ProductDetail.tsx
│  │  ├─ Cart.tsx
│  │  ├─ Checkout.tsx
│  │  ├─ Wishlist.tsx
│  │  ├─ ForgotPassword.tsx
│  │  └─ ResetPassword.tsx
│  ├─ services/
│  ├─ store/
│  ├─ App.tsx
│  └─ main.tsx
└─ vite.config.ts
```

## Prerequisites

- Node.js 20+
- npm 10+
- Running backend API

## Environment Variables

Create `.env` in the frontend root.

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Notes:

- `VITE_API_URL` is required.
- `VITE_STRIPE_PUBLISHABLE_KEY` is used by checkout when Stripe is enabled.

## Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Default local URL: `http://localhost:5173`

## Routes (High Level)

Public:

- `/`
- `/shop`
- `/product/:slug`
- `/cart`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/wishlist`
- `/privacy`
- `/terms`
- `/cookies`

Protected:

- `/checkout` (`CUSTOMER`)
- `/dashboard` (`CUSTOMER`, `VENDOR`, `ADMIN`)
- `/dashboard/orders` (`CUSTOMER`)
- `/vendor` (`VENDOR`, `ADMIN`)
- `/admin` (`ADMIN`)

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Deployment

- Vercel rewrite config is defined in `vercel.json` for SPA routing.
- Ensure `VITE_API_URL` points to your deployed backend base URL.
