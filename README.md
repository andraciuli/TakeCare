# TakeCare - Pet Adoption Platform

A minimal Next.js web application for pet adoption, powered by Supabase and ArcGIS Maps.

## Features

- Browse available animals from shelters
- Interactive map showing shelter locations (ArcGIS)
- Filter animals by species, breed, age, and status
- Save favorite animals
- Submit adoption requests
- Shelter admin dashboard (coming soon)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Maps**: ArcGIS Maps SDK for JavaScript
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account with project created
- ArcGIS Developer account with API key

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Edit `.env.local` and add your actual credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_ARCGIS_API_KEY=your_arcgis_api_key
   ```

3. **Set up the database in Supabase**

   **Quick method:** Use the migration file
   - Open `supabase/migrations/20241129_initial_schema.sql`
   - Copy entire contents
   - Paste in Supabase SQL Editor and Run

   See `supabase/README.md` for detailed instructions, or scroll to **Database Setup** below.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000)


SELECT s.id, 'Bella', 'cat', 'Persian', 1, 'female', 'Young, playful and curious cat', 'available', '{"vaccinated": true, "sterilized": true, "playful": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Pet House' LIMIT 1;
```

### Step 4: Storage Setup

- Go to **Storage** in your Supabase dashboard
- Create a new bucket: `animal-images`
- Make it **Public**

## Project Structure

```
isi/
├── app/                # Next.js App Router
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Landing page
│   ├── animals/       # Animals listing
│   │   └── page.tsx
│   └── map/           # Map page
│       └── page.tsx
├── lib/               # Utility libraries
│   ├── supabase.ts   # Supabase client
│   └── arcgis.ts     # ArcGIS configuration
├── components/        # React components (as needed)
├── .env.local        # Environment variables (not in git)
└── README.md         # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

### Tables

- **users** - User profiles (extends Supabase auth)
- **shelters** - Animal shelters with locations
- **animals** - Animals available for adoption
- **adoption_requests** - Adoption applications
- **favorites** - User's favorite animals

### Relationships

- shelters 1→N animals
- users 1→N adoption_requests
- animals 1→N adoption_requests
- users N→M animals (via favorites)

## Next Steps

1. ✅ Basic project setup
2. ✅ Database schema and seed data
3. ✅ Animals listing page
4. 🔲 Map integration with ArcGIS
5. 🔲 Authentication (Supabase Auth)
6. 🔲 Animal detail pages
7. 🔲 Favorites functionality
8. 🔲 Adoption request forms
9. 🔲 Shelter admin dashboard

## Development Notes

This is a **school project** prioritizing simplicity and speed.

**Design decisions:**
- Client-side data fetching (easier to understand)
- Simple RLS policies (not production-ready)
- Public storage bucket (easier setup)
- Minimal error handling (focus on core features)

## Contributors

- Ciulinca Andra Stefania - 341C4
- Ilea Dorin - 343C5

## License

MIT