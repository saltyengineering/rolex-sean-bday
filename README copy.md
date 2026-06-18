# Rolex Submariner Fund 🕐

A personal tracker for saving toward a Rolex Submariner via QQQ (Nasdaq-100 ETF).

## How to log a contribution

Edit `data/contributions.json` and add an entry:

```json
{
  "date": "2026-07-01",
  "amount": 500,
  "buyPrice": 741.20,
  "note": "July contribution"
}
```

- `date` — ISO format YYYY-MM-DD
- `amount` — dollars you invested
- `buyPrice` — QQQ price on the day you bought (check finance.yahoo.com/quote/QQQ)
- `note` — optional label

Then commit and push to GitHub — Vercel redeploys automatically.

## Deploy to Vercel

1. Push this folder to a GitHub repo (can be private)
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework: Next.js (auto-detected)
4. Click Deploy — done!

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000
