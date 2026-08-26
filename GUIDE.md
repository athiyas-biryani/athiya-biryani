# Athiya's Biriyani - Complete Setup Guide
### Supabase + Git/GitHub + Vercel Deployment (all in one)

This guide answers three questions in order:

| # | Your question | Short answer |
|---|---------------|--------------|
| 1 | Is Supabase really needed? How do I set it up? | **Yes** (for live orders). Full steps in **Section 1** |
| 2 | Do I need Git/GitHub? What do I run? Which files go in? | **Yes** (Vercel pulls code from GitHub). Steps + exact file list in **Section 2** |
| 3 | Is Vercel free tier a good deployment choice? | **Yes** - verdict with real-world scenarios in **Section 3** |

---

## Section 0: Do Things In This Order

```
1. Supabase  (Section 1)   -> your API keys go into js/config.js
2. Git       (Section 2)   -> your code gets committed and pushed to GitHub
3. Vercel    (Section 3)   -> imports from GitHub, your site goes live
```

**Why this order:** Vercel deploys by importing a GitHub repo, so the repo must exist first.
And you want the Supabase keys already inside `js/config.js` before you push, so the site
works the moment it goes live - no redeploys needed.

---

## Section 1: Supabase Setup

### 1.0 Is it really needed?

**Short answer: Yes, if this is a real restaurant taking real orders.**

Without Supabase, the app runs in **demo mode**: data is stored in your browser's
localStorage, so an order placed on a customer's phone will NEVER reach your admin
dashboard - it only exists on that one device.

With Supabase (free), orders sync live across all devices: customer places an order,
your admin dashboard receives it within 1-2 seconds with a chime sound.

Demo mode is only useful for testing the UI on your own laptop.

### 1.1 Create a Free Account

1. Go to https://supabase.com
2. Click **Start your project** -> Sign up with GitHub (easiest) or email
3. Verify your email

### 1.2 Create a New Project

1. In the dashboard, click **New project**
2. **Organization:** create one if asked (name it anything, e.g. "Athiya")
3. **Project name:** `athiya-biryani`
4. **Database password:** pick something strong and WRITE IT DOWN somewhere safe
5. **Region:** pick **Mumbai** (or Singapore if Mumbai is unavailable) - closest to Andhra Pradesh
6. Click **Create new project** and wait 1-2 minutes

### 1.3 Create the Database Tables (run schema.sql once)

Your project has `db/schema.sql` containing all SQL commands. Run it once:

1. In the Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `D:\Athiya's Biriyani\db\schema.sql` in Notepad
4. Select all (Ctrl+A), copy (Ctrl+C)
5. Paste into the SQL Editor
6. Click **Run** (or Ctrl+Enter)

You should see **Success** at the bottom. This creates three tables:
- `menu_items` - your 33 menu items
- `orders` - where customer orders go
- `settings` - delivery pincodes and open/closed status

### 1.4 Enable Realtime (critical for live orders)

Realtime makes the admin dashboard receive orders the instant they are placed:

1. Dashboard -> **Database** (left sidebar)
2. Click **Replication**
3. Find the `orders` table in the list
4. Toggle it **ON**

Now when a customer orders, the admin dashboard sees it within 1-2 seconds, no refresh needed.

### 1.5 Get Your API Credentials

1. Click the **gear icon** (Project Settings) at bottom-left
2. Click **API** in the settings menu
3. Copy BOTH values:
   - **Project URL:** `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.6 Paste Into Your App

Open `D:\Athiya's Biriyani\js\config.js`, find these lines near the bottom:

```js
supabase: {
  url: "",
  anonKey: ""
}
```

Paste your values between the quotes:

```js
supabase: {
  url: "https://xxxxxxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Save the file. That is it - the app is now in live mode.

### 1.7 How It Works (technical overview)

Data flow:

```
Customer places order
    -> Supabase orders table (INSERT)
    -> Admin dashboard receives it in real time (Realtime subscription)
    -> Admin accepts / rejects / dispatches
    -> Supabase orders table (UPDATE)
```

What the code does:
- `js/db.js` checks if the Supabase URL + key are configured (the LIVE flag)
- If configured -> uses the Supabase client for all reads/writes
- If empty -> falls back to localStorage (demo mode)
- The Supabase JS client loads from a CDN - nothing to install

| Table | Purpose | Who writes |
|-------|---------|------------|
| `menu_items` | 33 dishes with prices and stock status | Admin toggles stock |
| `orders` | Customer orders with status lifecycle | Customer inserts, admin updates |
| `settings` | Delivery pincodes, open/closed flag | Admin |

Order lifecycle:

```
pending -> accepted -> dispatched -> paid
pending -> cancelled   (rejected)
cancelled -> pending   (undo/restore)
```

### 1.8 Test That It Works

1. Open the customer site in one browser tab
2. Open the admin dashboard (`admin.html`) in another tab
3. Place a test order on the customer side
4. The admin dashboard should show it within ~2 seconds with a chime sound
5. Accept the order on admin -> the status updates

If it does not work, check:
- Browser console (F12) for errors
- You ran the SQL schema (step 1.3)
- Realtime is ON for the `orders` table (step 1.4)
- URL and key are pasted exactly right - no extra spaces

### 1.9 Free Tier Limits

- **500 MB database** - thousands of orders; you will never hit this with one restaurant
- **500 MB bandwidth** - plenty for a restaurant ordering site
- **2 free projects** - one is all you need

---

## Section 2: Git & GitHub Setup

### 2.0 Do you need Git?

**Yes.** Two reasons:

1. **Vercel needs it.** Vercel deploys by importing your code from a GitHub repo.
   (The only deployment path that skips Git is Netlify drag-and-drop - see Section 3.6.)
2. **Backup + history.** Every change you ever make is saved; you can roll back any mistake.

### 2.1 Which files go into Git - and which do NOT

Committed to GitHub (these are your website):

| File / folder | What it is |
|---------------|-----------|
| `index.html` | Customer-facing site |
| `admin.html` | Admin dashboard page |
| `css/` | All styling |
| `js/` | All app logic - **including `js/config.js`, see note below** |
| `db/schema.sql` | Database setup script |
| `assets/` | Logo, food photos (interior/exterior), QR folder |
| `manifest.webmanifest` | PWA manifest |
| `sw.js` | Service worker |
| `DESIGN.md`, `PRODUCT.md`, `athiya-biryani-app-spec.md`, `GUIDE.md` | Docs |

Ignored via `.gitignore` (never uploaded):

| Pattern | Why it is skipped |
|---------|-------------------|
| `.impeccable/` | Local AI design-tool state - machine-specific junk |
| `graphify-out/` | Generated analysis cache - regenerable, large |
| `Thumbs.db`, `Desktop.ini`, `.DS_Store` | Operating-system junk files |
| `.vscode/`, `*.swp`, `*.swo`, `*~` | Editor temp files |

**Important note about `js/config.js`:** it contains your admin PIN and the Supabase anon key.
The anon key is safe to expose by design (see Section 4), but the admin PIN is only protected
by keeping the repo PRIVATE. **Never make this repository public** unless you first remove the
PIN or replace it with real authentication.

### 2.2 Install Git

1. Go to https://git-scm.com/download/win
2. Download the 64-bit Windows installer and run it
3. Click "Next" through all defaults, then Finish

Verify in PowerShell:

```powershell
git --version
```

You should see something like `git version 2.45.x`.

### 2.3 Create a GitHub Account (skip if you have one)

1. Go to https://github.com
2. Click **Sign up** - use your email, set a password, pick a username (e.g. `athiya-biryani`)
3. Verify your email

### 2.4 Create a New Repository on GitHub

1. Go to https://github.com/new
2. **Repository name:** `athiya-biryani`
3. **Description:** `Online ordering app for Athiya's Hyderabad Biryani`
4. **Visibility:** **Private** (your config file has the admin PIN - see 2.1)
5. Do NOT check "Add a README file" - we already have files
6. Click **Create repository**

GitHub shows a page of setup commands - we use those in step 2.7.

### 2.5 Initialize Git in Your Project Folder

Open PowerShell and run:

```powershell
cd "D:\Athiya's Biriyani"
git init
```

This creates a hidden `.git` folder that tracks every change.

### 2.6 Create the .gitignore File

Create a new file called `.gitignore` in the project root
(`D:\Athiya's Biriyani\.gitignore`) with exactly this content:

```
# OS junk
Thumbs.db
Desktop.ini
.DS_Store

# Editor files
.vscode/
*.swp
*.swo
*~

# Local tool state and generated caches - never commit these
.impeccable/
graphify-out/
```

Save it. This keeps your repo clean (see the table in 2.1 for what each line skips).

### 2.7 Make Your First Commit

A "commit" is a snapshot of your project at a point in time:

```powershell
cd "D:\Athiya's Biriyani"

# Tell Git to track all files
git add .

# Check what is about to be committed
git status

# Make the first commit
git commit -m "Initial commit - Athiya's Biriyani v1"
```

`git status` shows green files (staged) and red files (untracked).
After `git add .`, everything should be green.

### 2.8 Connect to GitHub and Push

Replace `YOUR_USERNAME` with your actual GitHub username:

```powershell
# Link your local repo to GitHub
git remote add origin https://github.com/YOUR_USERNAME/athiya-biryani.git

# Rename the default branch to "main"
git branch -M main

# Push everything to GitHub
git push -u origin main
```

GitHub may ask for your username and a password (or a "Personal Access Token" - see below).

### If GitHub asks for a password and your password does not work:

GitHub no longer accepts passwords directly. You need a **Personal Access Token**:

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** -> **Generate new token (classic)**
3. Note: `athiya-biryani`, Expiration: 90 days
4. Check the box: **repo** (full control of private repos)
5. Click **Generate token**
6. **Copy the token immediately** (you will not see it again)
7. Use this token as your password when Git asks

### 2.9 Day-to-Day Workflow

Every time you make changes you want to save:

```powershell
cd "D:\Athiya's Biriyani"

git status          # 1. See what changed
git diff            # 2. See the actual changes, line by line
git add .           # 3. Stage all changes
git commit -m "Removed QR code, added quantity selector"   # 4. Snapshot with a description
git push            # 5. Upload to GitHub (this also auto-redeploys Vercel!)
```

Commit message rules:
- Present tense: "Add feature", not "Added feature"
- Under 72 characters
- Be specific: "Fix pincode validation on checkout" beats "Fix bug"

### 2.10 Useful Git Commands

| Command | What it does |
|---------|-------------|
| `git status` | See what changed |
| `git diff` | See line-by-line changes |
| `git log --oneline` | See recent commits |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Save a snapshot |
| `git push` | Upload to GitHub |
| `git pull` | Download latest from GitHub |
| `git stash` | Temporarily hide changes |
| `git stash pop` | Bring back hidden changes |

### 2.11 If Something Goes Wrong

Committed something you should not have?

```powershell
git reset --soft HEAD~1    # Undo last commit, keep the changes
```

Want to see what a file looked like before your changes?

```powershell
git diff HEAD -- js/config.js
```

Setting up on a new computer?

```powershell
git clone https://github.com/YOUR_USERNAME/athiya-biryani.git
cd athiya-biryani
```

That is it - all your files are there.

---

## Section 3: Deploying on Vercel (Free)

Your app is pure static HTML/CSS/JS - no build step, no server needed. Any free static
host works, and Vercel is a solid choice.

### 3.0 Is Vercel free tier a good decision? Yes - here is why, in real-world scenarios

**Friday dinner rush:** your files are served from Vercel's global CDN - hundreds of
simultaneous customers will not slow it down or cost you anything.

**You change a menu price at midnight:** edit the file, `git push` - the site is updated
worldwide in about 30 seconds. No FTP, no manual uploads.

**You are away from the shop but an order comes in:** the admin dashboard works from any
phone/laptop because the data lives in Supabase, not on your PC.

**You want `athiyasbiryani.in`:** custom domain support is free, HTTPS/SSL is automatic.

**Private repo:** Vercel deploys private repos on the free tier (GitHub Pages would demand
you pay for GitHub Pro).

**Honest caveats:**
- The admin PIN is checked in JavaScript, so it lives in the browser either way - true on
  ANY host, not just Vercel (hardening notes in Section 4)
- If you ever add payment-gateway webhooks or other server-side logic later, Vercel
  supports serverless functions - you would not have to migrate

### 3.1 Create a Vercel Account

1. Go to https://vercel.com
2. Click **Sign Up** -> **Continue with GitHub** (this also lets Vercel see your repos)

### 3.2 Import Your Repo

1. Click **Add New...** -> **Project**
2. Find your `athiya-biryani` repo and click **Import**
3. **Framework Preset:** Other
4. **Root Directory:** leave as default (`./`)
5. Click **Deploy**

### 3.3 Get Your URL

Vercel gives you something like:

```
https://athiya-biryani.vercel.app
```

Open it on your phone to confirm. From now on, every `git push` redeploys automatically.

### 3.4 Custom Domain (optional)

1. Buy a domain (~Rs 500/year from Namecheap, GoDaddy, Cloudflare, etc.)
2. In Vercel -> your project -> **Settings** -> **Domains**
3. Enter your domain; Vercel shows DNS records
4. Copy those records into your registrar's DNS settings
5. Wait 5-30 minutes for DNS propagation - HTTPS certificate is automatic and free

### 3.5 Environment Variables Note

You may read tutorials saying "hide Supabase keys in environment variables." For a static
site this adds nothing - whatever reaches the browser is public anyway, and the anon key is
public by design (Section 4). Keys in `js/config.js` inside a PRIVATE repo are fine. Skip it.

### 3.6 Fallback: Netlify Drag-and-Drop (no Git at all)

If you ever want a quick deploy without Git: sign up at https://app.netlify.com and drag
the whole project folder onto the deploy drop zone - live in ~30 seconds. This is the only
deployment path that skips Git entirely.

### 3.7 Post-Deployment Checklist

After deploying, verify all of these work:

1. **Customer site loads** - menu items show, categories work, scrolling works
2. **Add to cart works** - tap +, quantity selector appears, total updates
3. **Checkout works** - fill form, place order, confirmation shows
4. **Pincode validation** - entering a non-522034 pincode shows an error
5. **Admin login** - go to `/admin.html`, enter PIN, dashboard loads
6. **Live orders** - place order on customer site, admin sees it
7. **Audio alert** - new order triggers the repeating chime
8. **Accept/reject** - accept moves to accepted; reject shows undo button
9. **Undo rejected** - tap "Restore to pending" on a rejected order
10. **Out of stock** - toggle stock in admin, customer sees "Out of stock" label
11. **Contact info** - phone number, address, slogan display correctly
12. **No QR code** - checkout page has no UPI QR image

If anything fails, open the browser console (F12 -> Console tab) for error messages.

---

## Section 4: Security Notes

### Is the anon key safe to expose?

**Yes.** The Supabase `anon` (public) key is designed to be used in frontend code.
It is protected by **Row-Level Security (RLS)** policies in your database:

- The key lets anyone CONNECT to your database
- But RLS rules limit what they can DO
- Anonymous users can only INSERT orders and SELECT the menu/settings
- They cannot read other customers' phone numbers or addresses, update orders,
  delete anything, or modify menu items

This is safe for production.

### What NEVER goes in your code or repo

- Supabase `service_role` key (Project Settings -> API -> `service_role` secret) - this key
  bypasses ALL security; if it leaks you must regenerate it immediately
- Payment gateway secrets
- Database passwords

### About the admin PIN (honest limits)

The PIN (`athiya2026`) is checked in JavaScript only - someone can view page source and see
it. It is a convenience gate, not real security. Fine for v1 as a single-owner restaurant.

For v2 hardening:
1. Use Supabase Auth for admin login - create a user, use `signInWithPassword()` instead of the static PIN
2. Add RLS policies so only that admin user can SELECT/UPDATE orders with full details

And remember from Section 2.1: because `js/config.js` holds the PIN, the GitHub repo must
stay **Private** until that hardening is done.

---

*One file, three guides merged. Supabase first, Git second, Vercel last - then test with the checklist.*
