# ProfitFlow Cloud

This is the online version of your lightweight Shopify-style dashboard.

It includes:
- Login / sign up
- Cloud database using Supabase
- Shared online hosting using Vercel
- Sales/orders
- Costs by website
- Inventory
- Weekly profit
- Charts
- CSV export
- Row Level Security so each logged-in user only sees their own data

## No-terminal setup path

### 1. Create free accounts
Create accounts on:
- GitHub
- Supabase
- Vercel

### 2. Put this project on GitHub
1. Extract this ZIP.
2. Go to GitHub.
3. Create a new repository called `profitflow-cloud`.
4. Click **Add file** > **Upload files**.
5. Upload everything inside this folder.
6. Click **Commit changes**.

### 3. Create your Supabase project
1. Open Supabase.
2. Create a new project.
3. Go to **SQL Editor**.
4. Open the file `supabase-setup.sql` from this ZIP.
5. Copy everything inside it.
6. Paste it into Supabase SQL Editor.
7. Click **Run**.

### 4. Get your Supabase keys
1. In Supabase, go to **Project Settings**.
2. Go to **API**.
3. Copy:
   - Project URL
   - anon public key

### 5. Deploy on Vercel
1. Open Vercel.
2. Click **Add New Project**.
3. Import your GitHub repo.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

### 6. Use it
Open the Vercel website link.
Create an account.
Your friend can create an account too.

## Important business note

This starter uses separate data per logged-in user.

If you and your friend need to share the exact same business dashboard, the next upgrade is a `businesses` table and team membership system.
