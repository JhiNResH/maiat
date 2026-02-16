# Maiat 🪲

Clean scaffold for Maat - Trust Layer for Agentic Commerce.

## Categories

- `m/openclaw-skills` - PRIMARY category for cold launch
- `m/ai-agents` - AI agent reviews
- `m/memecoin` - Memecoin reviews  
- `m/defi` - DeFi protocol reviews

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite + Prisma ORM
- **Auth**: Privy
- **Styling**: TailwindCSS
- **AI**: Google Gemini (review quality check)

## Structure

```
maatV2/
├── src/
│   ├── app/
│   │   ├── m/[category]/page.tsx  (dynamic category pages)
│   │   ├── api/reviews/           (GET/POST + vote)
│   │   ├── api/scarab/            (balance, claim, purchase, history)
│   │   ├── api/leaderboard/       (category leaderboards)
│   │   ├── api/projects/          (GET/POST projects)
│   │   └── layout.tsx             (clean, with Privy)
│   ├── components/                (minimal UI components)
│   ├── lib/                       (prisma, scarab, gemini-review-check, store)
│   └── types/
├── prisma/schema.prisma           (User, Project, Review, Vote, Scarab*)
└── ...config files
```

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (creates dev.db)
npx prisma migrate dev

# Start dev server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` - SQLite file path
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy App ID
- `PRIVY_APP_SECRET` - Privy Secret
- `GOOGLE_GEMINI_API_KEY` - Gemini API key (optional, for review quality check)

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Scarab Economy

Off-chain points system:
- Initial claim: 20 Scarab
- Daily claim: +5 Scarab (streak bonus up to +5)
- Review cost: -2 Scarab
- Vote cost: -5 Scarab
- Purchase: $1=50 | $5=300 | $20=1500

## License

MIT
