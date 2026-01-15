# Deploying InvoTrack to Vercel

This guide explains how to deploy your full-stack application (Vite Frontend + Node.js Backend) to Vercel.

## Prerequisites

1.  **GitHub Account**: You should have your code pushed to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
3.  **Postgres Database**: You already have this (Supabase/Neon). Keep your connection string handy.
4.  **Stripe Keys**: Keep your `STRIPE_SECRET_KEY` handy.

## Step 1: Push to GitHub

If you haven't already, commit your changes and push to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Step 2: Import into Vercel

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub repository `invotrack`.
4.  Vercel will automatically detect that this is a **Vite** project.

## Step 3: Configure Project

Before clicking Deploy, you must configure the **Environment Variables**.

In the "Environment Variables" section, add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Your full Postgres connection string (from Neon/Supabase). |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Your Stripe Secret Key. |
| `JWT_SECRET` | `your_secret` | A secure random string for user sessions. |
| `VITE_API_URL` | `/api` | **Optional**. Sets the API base path. References logic we added to `api.ts`. |

> **Note**: You do NOT need to change the "Build and Output Settings". The default `vite build` command and `dist` output directory are correct.

## Step 4: Deploy

Click **"Deploy"**.

Vercel will:
1.  Install dependencies (from the root `package.json`).
2.  Build the frontend (`vite build`).
3.  Deploy the `server/index.js` as a serverless function because of the `vercel.json` configuration we verified.

## Troubleshooting

### "Function not found" or 404 on /api
If the backend doesn't work:
1.  Check the "Functions" tab in your Vercel deployment dashboard.
2.  Ensure `vercel.json` is in the root directory.
3.  Ensure `server/index.js` is exporting the app or handling requests correctly (we verified it handles the `api/*` rewrite).

### Database Connection Error
If you see connection errors:
1.  Ensure your `DATABASE_URL` allows connections from "Anywhere" (0.0.0.0/0), as Vercel IPs are dynamic.
2.  We already configured `db.js` to use `ssl: { rejectUnauthorized: false }` for production, so it should work with Neon/Supabase.

### CORS Errors
If you see CORS errors:
1.  The `server/index.js` has `app.use(cors())`. This allows all origins by default, which is easiest for now.
2.  Since both frontend and backend are on the same domain (Vercel), CORS is often not even an issue for relative path requests (`/api/...`).
